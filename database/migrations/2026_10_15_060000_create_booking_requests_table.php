<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_requests', function (Blueprint $table) {
            $table->id();
            $table->uuid('request_id')->unique();
            $table->string('reference', 32)->unique();
            $table->string('payload_hash', 64);
            $table->string('venue', 32)->index();
            $table->date('date')->index();
            $table->string('time', 5);
            $table->unsignedSmallInteger('guests');
            $table->string('status', 20)->default('pending')->index();
            $table->json('contact');
            $table->string('occasion', 32);
            $table->decimal('budget', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->json('menu');
            $table->decimal('total', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_requests');
    }
};
