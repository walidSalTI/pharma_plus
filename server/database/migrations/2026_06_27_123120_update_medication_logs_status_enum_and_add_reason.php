<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE medication_logs MODIFY COLUMN status ENUM('taken', 'delayed', 'skipped') NOT NULL");
        }

        Schema::table('medication_logs', function (Blueprint $table) {
            $table->text('reason')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('medication_logs', function (Blueprint $table) {
            $table->dropColumn('reason');
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE medication_logs MODIFY COLUMN status ENUM('taken', 'missed', 'postponed') NOT NULL");
        }
    }
};
