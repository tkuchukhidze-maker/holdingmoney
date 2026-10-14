<?php

use App\Http\Controllers\CustomerProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Home'))->name('home');

Route::post('/locale', function (Request $request) {
    $data = $request->validate([
        'locale' => ['required', Rule::in(['ka', 'en', 'ru'])],
    ]);

    $request->session()->put('locale', $data['locale']);

    return back();
})->name('locale.update');

// The same signed-in Episode identity can be reused at every venue.
// This route returns 401 for guests (Accept: application/json); it never
// returns another customer's contact information by ID or query parameter.
Route::get('/api/customer/profile', CustomerProfileController::class)
    ->middleware('auth')
    ->name('customer.profile');
