<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('license_number')->unique();
            $table->string('syndicate_card');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacists');
    }
};
