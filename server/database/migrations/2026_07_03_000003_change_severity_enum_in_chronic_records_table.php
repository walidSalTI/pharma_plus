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
            DB::statement("ALTER TABLE chronic_records MODIFY severity ENUM('low', 'medium', 'high') NULL");
        } else {
            Schema::table('chronic_records', function (Blueprint $table) {
                $table->string('severity')->nullable()->change();
            });

            Schema::table('chronic_records', function (Blueprint $table) {
                $table->enum('severity', ['low', 'medium', 'high'])->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE chronic_records MODIFY severity VARCHAR(255) NULL");
        } else {
            Schema::table('chronic_records', function (Blueprint $table) {
                $table->string('severity')->nullable()->change();
            });
        }
    }
};
