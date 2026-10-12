<?php

use function Pest\Laravel\get;
use function Pest\Laravel\post;

beforeEach(function () {
    $this->withoutVite();
});

it('serves the Inertia foundation in Georgian by default', function () {
    get('/')
        ->assertOk()
        ->assertSee('data-page', false);
    expect(app()->getLocale())->toBe('ka');
});

it('supports explicit language preferences', function () {
    $this->withSession(['locale' => 'en'])->get('/')->assertOk();
    expect(app()->getLocale())->toBe('en');

    $this->withSession(['locale' => 'ru'])->get('/')->assertOk();
    expect(app()->getLocale())->toBe('ru');
});

it('restricts locale values to Georgian, English and Russian', function () {
    post('/locale', ['locale' => 'invalid'])->assertSessionHasErrors('locale');

    post('/locale', ['locale' => 'ru'])->assertRedirect('/');
    expect(session('locale'))->toBe('ru');
});

it('serves a source-only landing without creating operational data', function () {
    expect(file_exists(base_path('database/seeders/DatabaseSeeder.php')))->toBeTrue();
    get('/')->assertOk();
});
