<?php

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
