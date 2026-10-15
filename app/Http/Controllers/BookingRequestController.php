<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BookingRequestController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $token = (string) config('services.booking.token');
        abort_if($token === '', 503, 'Booking intake is not configured.');
        abort_unless(hash_equals($token, (string) $request->bearerToken()), 401);

        $data = $request->validate([
            'requestId' => ['required', 'uuid'],
            'venue' => ['required', Rule::in(['batumi', 'kutaisi', 'tbilisi'])],
            'fullName' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'regex:/^[+0-9 ()-]{7,32}$/'],
            'email' => ['nullable', 'email', 'max:254'],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.now('Asia/Tbilisi')->toDateString()],
            'time' => ['required', 'date_format:H:i'],
            'guests' => ['required', 'integer', 'min:1', 'max:100'],
            'occasion' => ['required', Rule::in(['traditional', 'birthday', 'business'])],
            'budget' => ['nullable', 'numeric', 'min:80', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'menu' => ['present', 'array', 'max:80'],
            'menu.*' => ['array:itemId,quantity'],
            'menu.*.itemId' => ['required', 'string', 'distinct', 'max:80'],
            'menu.*.quantity' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);
        $hash = hash('sha256', json_encode($data, JSON_THROW_ON_ERROR));
        $existing = DB::table('booking_requests')->where('request_id', $data['requestId'])->first();
        if ($existing) {
            abort_unless(hash_equals($existing->payload_hash, $hash), 409);

            return $this->receipt($existing);
        }
        if ($data['date'].' '.$data['time'] <= now('Asia/Tbilisi')->format('Y-m-d H:i')) {
            throw ValidationException::withMessages(['date' => 'აირჩიეთ მომავალი თარიღი და დრო.']);
        }

        // The browser sends item IDs/quantities only. All prices and names are
        // resolved from this venue's server-side catalog, never from the client.
        $catalog = json_decode(file_get_contents(database_path('catalog/restaurant-menus.json')), true, 512, JSON_THROW_ON_ERROR);
        $items = collect($catalog[$data['venue']]['sections'])->flatMap(fn ($section) => $section['items'])->keyBy('id');
        $lines = [];
        $totalCents = 0;
        foreach ($data['menu'] as $index => $selection) {
            $item = $items->get($selection['itemId']);
            if (!$item) {
                throw ValidationException::withMessages(["menu.$index.itemId" => 'კერძი ამ ფილიალის მენიუში არ მოიძებნა.']);
            }
            $unitCents = (int) round($item['price'] * 100);
            $lineCents = $unitCents * $selection['quantity'];
            $totalCents += $lineCents;
            $lines[] = ['itemId' => $item['id'], 'name' => $item['name'], 'quantity' => $selection['quantity'], 'unitPrice' => $unitCents / 100, 'lineTotal' => $lineCents / 100];
        }
        // One atomic row contains the contact details and complete priced menu.
        // The unique request ID makes retries safe after a network timeout.
        $row = DB::transaction(function () use ($data, $hash, $lines, $totalCents) {
            DB::table('booking_requests')->insertOrIgnore([
                'request_id' => $data['requestId'],
                'reference' => 'EP-'.Str::upper(Str::random(12)),
                'payload_hash' => $hash,
                'venue' => $data['venue'],
                'date' => $data['date'],
                'time' => $data['time'],
                'guests' => $data['guests'],
                'status' => 'pending',
                'contact' => json_encode(['fullName' => $data['fullName'], 'phone' => $data['phone'], 'email' => $data['email'] ?? null], JSON_THROW_ON_ERROR),
                'occasion' => $data['occasion'],
                'budget' => $data['budget'] ?? null,
                'notes' => $data['notes'] ?? null,
                'menu' => json_encode($lines, JSON_THROW_ON_ERROR),
                'total' => $totalCents / 100,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $saved = DB::table('booking_requests')->where('request_id', $data['requestId'])->first();
            abort_unless($saved && hash_equals($saved->payload_hash, $hash), 409);

            return $saved;
        });

        return $this->receipt($row, 201);
    }

    private function receipt(object $row, int $status = 200): JsonResponse
    {
        return response()->json([
            'reference' => $row->reference,
            'menuIncluded' => count(json_decode($row->menu, true)) > 0,
            'status' => 'pending',
        ], $status)->header('Cache-Control', 'private, no-store');
    }
}
