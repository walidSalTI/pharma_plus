<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pharmacists', function (Blueprint $table) {
            $table->dropUnique(['license_number']);
            $table->dropColumn('license_number');
            $table->string('syndicate_card')->nullable()->change();
            $table->enum('verification_status', ['unverified', 'pending', 'approved', 'rejected'])
                ->default('unverified')
                ->after('syndicate_card');
        });
    }

    public function down(): void
    {
        Schema::table('pharmacists', function (Blueprint $table) {
            $table->dropColumn('verification_status');
            $table->string('syndicate_card')->nullable(false)->change();
            $table->string('license_number')->unique()->after('user_id');
        });
    }
};
