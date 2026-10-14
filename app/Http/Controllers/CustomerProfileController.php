<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerProfileController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        // Route requires an authenticated session. Never accept a customer
        // identifier from the browser when looking up contact details.
        $user = $request->user();

        $displayName = trim((string) $user->name);
        $parts = preg_split('/\s+/u', $displayName, 2) ?: [];
        $firstName = trim((string) ($user->first_name ?: ($parts[0] ?? '')));
        $lastName = trim((string) ($user->last_name ?: ($parts[1] ?? '')));

        return response()->json([
            'authenticated' => true,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'fullName' => trim($firstName.' '.$lastName),
            // Only contacts actually verified to belong to this account are
            // prefilled. The guest can supply a missing contact at booking.
            'email' => $user->email_verified_at ? $user->email : null,
            'phone' => $user->phone_verified_at ? $user->phone : null,
        ])->header('Cache-Control', 'private, no-store, max-age=0')
            ->header('Vary', 'Cookie');
    }
}
