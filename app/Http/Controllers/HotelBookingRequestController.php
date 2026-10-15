<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class HotelBookingRequestController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $token = (string) config('services.booking.token');
        abort_if($token === '', 503, 'Booking intake is not configured.');
        abort_unless(hash_equals($token, (string) $request->bearerToken()), 401);
        $data = $request->validate([
            'requestId' => ['required', 'uuid'],
            'venue' => ['required', Rule::in(['magnolia', 'chateau-mere'])],
            'checkIn' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.now('Asia/Tbilisi')->toDateString()],
            'checkOut' => ['required', 'date_format:Y-m-d', 'after:checkIn'],
            'adults' => ['required', 'integer', 'min:1', 'max:10'],
            'children' => ['required', 'integer', 'min:0', 'max:9'],
            'roomCount' => ['required', 'integer', 'min:1', 'max:5'],
            'bed' => ['required', Rule::in(['any', 'double', 'twin'])],
            'purpose' => ['required', Rule::in(['leisure', 'business', 'family', 'romantic'])],
            'roomId' => ['present', 'nullable', 'string', 'max:40'],
            'fullName' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'regex:/^[+0-9 ()-]{7,32}$/'],
            'email' => ['nullable', 'email', 'max:254'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
        if ($data['adults'] + $data['children'] > 10) {
            throw ValidationException::withMessages(['adults' => 'მაქსიმუმ 10 სტუმარი.']);
        }
        if (CarbonImmutable::parse($data['checkIn'])->diffInDays(CarbonImmutable::parse($data['checkOut'])) > 365) {
            throw ValidationException::withMessages(['checkOut' => 'მაქსიმუმ 365 ღამე.']);
        }
        $hash = hash('sha256', json_encode($data, JSON_THROW_ON_ERROR));
        $existing = DB::table('hotel_booking_requests')->where('request_id', $data['requestId'])->first();
        if ($existing) {
            abort_unless(hash_equals($existing->payload_hash, $hash), 409);

            return $this->receipt($existing);
        }
        $catalog = json_decode(file_get_contents(database_path('catalog/hotel-rooms.json')), true, 512, JSON_THROW_ON_ERROR);
        $room = null;
        if ($data['roomId'] !== null) {
            $room = collect($catalog[$data['venue']]['rooms'])->firstWhere('id', $data['roomId']);
            if (! $room || $room['capacity'] * $data['roomCount'] < $data['adults'] + $data['children']) {
                throw ValidationException::withMessages(['roomId' => 'ნომერი ვერ მოიძებნა ან ტევადობა არასაკმარისია.']);
            }
            if ($data['bed'] !== 'any' && ! in_array($data['bed'], $room['beds'], true)) {
                throw ValidationException::withMessages(['bed' => 'საწოლის ტიპი არჩეულ ნომერს არ შეესაბამება.']);
            }
        }
        $row = DB::transaction(function () use ($data, $hash, $room) {
            DB::table('hotel_booking_requests')->insertOrIgnore([
                'request_id' => $data['requestId'],
                'reference' => 'EH-'.Str::upper(Str::random(12)),
                'payload_hash' => $hash,
                'venue' => $data['venue'],
                'check_in' => $data['checkIn'],
                'check_out' => $data['checkOut'],
                'adults' => $data['adults'],
                'children' => $data['children'],
                'room_count' => $data['roomCount'],
                'bed' => $data['bed'],
                'purpose' => $data['purpose'],
                'room' => $room ? json_encode($room, JSON_THROW_ON_ERROR) : null,
                'contact' => json_encode(['fullName' => $data['fullName'], 'phone' => $data['phone'], 'email' => $data['email'] ?? null], JSON_THROW_ON_ERROR),
                'notes' => $data['notes'] ?? null,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $saved = DB::table('hotel_booking_requests')->where('request_id', $data['requestId'])->first();
            abort_unless($saved && hash_equals($saved->payload_hash, $hash), 409);

            return $saved;
        });

        return $this->receipt($row, 201);
    }

    private function receipt(object $row, int $status = 200): JsonResponse
    {
        return response()->json(['reference' => $row->reference, 'status' => 'pending'], $status)
            ->header('Cache-Control', 'private, no-store');
    }
}
