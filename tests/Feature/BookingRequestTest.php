<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function bookingPayload(array $overrides = []): array
{
    return array_replace([
        'requestId' => (string) Str::uuid(), 'venue' => 'batumi',
        'fullName' => 'Test Guest', 'phone' => '+995599123456', 'email' => 'guest@example.test',
        'date' => now('Asia/Tbilisi')->addDay()->toDateString(), 'time' => '19:00', 'guests' => 10,
        'occasion' => 'birthday', 'budget' => 100, 'notes' => 'Test only',
        'menu' => [['itemId' => 'appetizers-1', 'quantity' => 2]],
    ], $overrides);
}

beforeEach(function () {
    config(['services.booking.token' => 'test-booking-token']);
});

it('requires the server credential and fails closed without configuration', function () {
    $this->postJson('/api/booking-requests', bookingPayload())->assertUnauthorized();
    config(['services.booking.token' => '']);
    $this->withToken('test-booking-token')->postJson('/api/booking-requests', bookingPayload())->assertStatus(503);
    $this->assertDatabaseCount('booking_requests', 0);
});

it('atomically stores the booking and server-priced menu and makes retries idempotent', function () {
    $payload = bookingPayload();
    $response = $this->withToken('test-booking-token')->postJson('/api/booking-requests', $payload)->assertCreated()->assertJson(['menuIncluded' => true, 'status' => 'pending']);
    $this->withToken('test-booking-token')->postJson('/api/booking-requests', $payload)->assertOk()->assertJson(['reference' => $response->json('reference')]);
    $this->assertDatabaseCount('booking_requests', 1);
    $row = DB::table('booking_requests')->first();
    expect((float) $row->total)->toBe(70.0);
    expect(json_decode($row->menu, true)[0]['quantity'])->toBe(2);
    $this->withToken('test-booking-token')->postJson('/api/booking-requests', array_replace($payload, ['guests' => 20]))->assertStatus(409);
});

it('accepts an explicit request without a menu at every restaurant', function () {
    foreach (['batumi', 'kutaisi', 'tbilisi'] as $venue) {
        $this->withToken('test-booking-token')->postJson('/api/booking-requests', bookingPayload(['venue' => $venue, 'menu' => []]))->assertCreated()->assertJson(['menuIncluded' => false]);
    }
    $this->assertDatabaseCount('booking_requests', 3);
});

it('rejects invalid quantities, duplicate items, past dates and foreign venue menus', function () {
    foreach ([
        ['venue' => 'kutaisi'], ['guests' => 0], ['date' => '2020-01-01'],
        ['menu' => [['itemId' => 'appetizers-1', 'quantity' => -1]]],
        ['menu' => [['itemId' => 'appetizers-1', 'quantity' => 1, 'unitPrice' => 0]]],
        ['menu' => [['itemId' => 'appetizers-1', 'quantity' => 1], ['itemId' => 'appetizers-1', 'quantity' => 1]]],
    ] as $override) {
        $this->withToken('test-booking-token')->postJson('/api/booking-requests', bookingPayload($override))->assertUnprocessable();
    }
    $this->assertDatabaseCount('booking_requests', 0);
});
