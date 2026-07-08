<?php

declare(strict_types=1);

use App\Http\Controllers\API\V1\Rep\AuthController;
use App\Http\Controllers\API\V1\Rep\ScheduleController;
use App\Http\Controllers\API\V1\Rep\VisitController;
use App\Http\Controllers\API\V1\Rep\WorkplaceSuggestionController;
use Illuminate\Support\Facades\Route;

Route::prefix('rep')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'role:scientific_rep'])->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('dashboard', [AuthController::class, 'dashboard']);

        Route::prefix('schedules')->group(function () {
            Route::get('/', [ScheduleController::class, 'index']);
            Route::get('{schedule}', [ScheduleController::class, 'show']);
        });

        Route::prefix('visits')->group(function () {
            Route::get('/', [VisitController::class, 'index']);
            Route::post('check-in', [VisitController::class, 'checkIn']);
            Route::get('stats', [VisitController::class, 'stats']);
            Route::get('{visit}', [VisitController::class, 'show']);
            Route::put('{visit}/notes', [VisitController::class, 'updateNotes']);
        });

        Route::post('workplace-suggestions', [WorkplaceSuggestionController::class, 'store']);
    });
});
