<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_operating_hours', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pharmacy_id')->constrained('pharmacies')->cascadeOnDelete();
            $table->integer('day_of_week');
            $table->time('opening_time');
            $table->time('closing_time');
            $table->boolean('is_24_hours');
            $table->boolean('is_closed');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_operating_hours');
    }
};
