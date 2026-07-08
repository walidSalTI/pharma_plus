<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE pharmaceutical_companies MODIFY status ENUM('pending', 'active', 'suspended', 'rejected') NOT NULL");
        }

        Schema::table('representative_visits', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('verification_status');
        });
    }

    public function down(): void
    {
        Schema::table('representative_visits', function (Blueprint $table) {
            $table->dropColumn('notes');
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE pharmaceutical_companies MODIFY status ENUM('pending', 'active', 'suspended') NOT NULL");
        }
    }
};
