<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('request_ingredients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('request_id')->constrained('medication_requests')->cascadeOnDelete();
            $table->foreignUuid('active_ingredient_id')->constrained('active_ingredients')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_ingredients');
    }
};
