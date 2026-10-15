<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotel_booking_requests', function (Blueprint $table) {
            $table->id();
            $table->uuid('request_id')->unique();
            $table->string('reference', 32)->unique();
            $table->string('payload_hash', 64);
            $table->string('venue', 32)->index();
            $table->date('check_in')->index();
            $table->date('check_out');
            $table->unsignedTinyInteger('adults');
            $table->unsignedTinyInteger('children')->default(0);
            $table->unsignedTinyInteger('room_count');
            $table->string('bed', 20);
            $table->string('purpose', 20);
            $table->json('room')->nullable();
            $table->json('contact');
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_booking_requests');
    }
};
