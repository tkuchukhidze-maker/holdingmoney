<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function hotelRequestPayload(array $overrides = []): array
{
    return array_replace([
        'requestId' => (string) Str::uuid(), 'venue' => 'magnolia',
        'checkIn' => now('Asia/Tbilisi')->addDay()->toDateString(),
        'checkOut' => now('Asia/Tbilisi')->addDays(3)->toDateString(),
        'adults' => 2, 'children' => 0, 'roomCount' => 1, 'bed' => 'twin',
        'purpose' => 'business', 'roomId' => 'twin', 'fullName' => 'Test Guest',
        'phone' => '+995599123456', 'email' => 'guest@example.test', 'notes' => 'Test only',
    ], $overrides);
}

beforeEach(function () {
    config(['services.booking.token' => 'test-only']);
});

it('requires the server token for hotel requests', function () {
    $this->postJson('/api/hotel-booking-requests', hotelRequestPayload())->assertUnauthorized();
    $this->assertDatabaseCount('hotel_booking_requests', 0);
});

it('stores selected room and stay details with safe idempotent retries', function () {
    $payload = hotelRequestPayload();
    $response = $this->withToken('test-only')->postJson('/api/hotel-booking-requests', $payload)->assertCreated()->assertJson(['status' => 'pending']);
    $this->withToken('test-only')->postJson('/api/hotel-booking-requests', $payload)->assertOk()->assertJson(['reference' => $response->json('reference')]);
    $this->assertDatabaseCount('hotel_booking_requests', 1);
    $row = DB::table('hotel_booking_requests')->first();
    expect(json_decode($row->room, true)['id'])->toBe('twin');
    expect($row->check_out)->toBe($payload['checkOut']);
    $this->withToken('test-only')->postJson('/api/hotel-booking-requests', array_replace($payload, ['purpose' => 'leisure']))->assertStatus(409);
});

it('allows hotel-assisted selection without inventing a room', function () {
    $this->withToken('test-only')->postJson('/api/hotel-booking-requests', hotelRequestPayload(['venue' => 'chateau-mere', 'roomId' => null]))->assertCreated();
    $row = DB::table('hotel_booking_requests')->first();
    expect($row->room)->toBeNull();
});

it('rejects cross-hotel room IDs, overcapacity, incompatible beds and invalid stays', function () {
    foreach ([
        ['venue' => 'chateau-mere'], ['adults' => 3], ['adults' => 10, 'children' => 1],
        ['bed' => 'double'], ['roomCount' => 0], ['checkIn' => '2020-01-01'],
        ['checkOut' => now('Asia/Tbilisi')->toDateString()],
        ['checkOut' => now('Asia/Tbilisi')->addDays(400)->toDateString()],
    ] as $patch) {
        $this->withToken('test-only')->postJson('/api/hotel-booking-requests', hotelRequestPayload($patch))->assertUnprocessable();
    }
    $this->assertDatabaseCount('hotel_booking_requests', 0);
});
