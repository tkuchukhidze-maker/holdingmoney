<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('does not reveal profile contacts to a guest', function () {
    $this->getJson('/api/customer/profile')
        ->assertUnauthorized();
});

it('prefills verified contacts for the currently signed-in Episode user', function () {
    $user = User::factory()->create([
        'name' => 'სატესტო მომხმარებელი',
        'first_name' => 'ნინო',
        'last_name' => 'მაისურაძე',
        'email' => 'nino@example.test',
        'email_verified_at' => now(),
        'phone' => '+995599123456',
        'phone_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->getJson('/api/customer/profile?user_id=99999')
        ->assertOk()
        ->assertHeader('Cache-Control', 'private, no-store, max-age=0')
        ->assertJson([
            'authenticated' => true,
            'firstName' => 'ნინო',
            'lastName' => 'მაისურაძე',
            'fullName' => 'ნინო მაისურაძე',
            'email' => 'nino@example.test',
            'phone' => '+995599123456',
        ])
        ->assertJsonMissing(['password']);
});

it('never autofills phone or email when those contacts are unverified', function () {
    $user = User::factory()->unverified()->create([
        'name' => 'გიორგი კახიძე',
        'first_name' => null,
        'last_name' => null,
        'phone' => '+995599123456',
        'phone_verified_at' => null,
    ]);

    $this->actingAs($user)
        ->getJson('/api/customer/profile')
        ->assertOk()
        ->assertJson([
            'authenticated' => true,
            'firstName' => 'გიორგი',
            'lastName' => 'კახიძე',
            'fullName' => 'გიორგი კახიძე',
            'email' => null,
            'phone' => null,
        ]);
});

it('does not leak previous user data after session changes', function () {
    $alice = User::factory()->create([
        'first_name' => 'ანა', 'last_name' => 'ჯაფარიძე',
    ]);
    $bob = User::factory()->create([
        'first_name' => 'ლევანი', 'last_name' => 'მგელაძე',
    ]);

    $this->actingAs($alice)->getJson('/api/customer/profile')
        ->assertJson(['firstName' => 'ანა']);

    $this->actingAs($bob)->getJson('/api/customer/profile')
        ->assertJson(['firstName' => 'ლევანი'])
        ->assertDontSee('ჯაფარიძე');
});
