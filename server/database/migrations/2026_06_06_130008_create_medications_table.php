<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('trade_name');
            $table->string('barcode')->unique()->nullable();
            $table->foreignUuid('manufacture_id')->nullable()->constrained('manufactures')->nullOnDelete();
            $table->string('form')->nullable();
            $table->string('arabic_form')->nullable();
            $table->string('image')->nullable();
            $table->timestamps();

            $table->index('trade_name', 'idx_medications_trade_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medications');
    }
};
