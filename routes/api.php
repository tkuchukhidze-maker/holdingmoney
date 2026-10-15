<?php

use App\Http\Controllers\BookingRequestController;
use App\Http\Controllers\HotelBookingRequestController;
use Illuminate\Support\Facades\Route;

// Server-to-server intake. The controller requires a configured bearer token;
// browser clients use the same-origin Node proxy and never receive this token.
Route::post('/booking-requests', BookingRequestController::class)->middleware('throttle:120,1');

Route::post('/hotel-booking-requests', HotelBookingRequestController::class)->middleware('throttle:120,1');
