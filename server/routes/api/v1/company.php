<?php

declare(strict_types=1);

use App\Http\Controllers\API\V1\Company\AdminVerificationController;
use App\Http\Controllers\API\V1\Company\AssignmentController;
use App\Http\Controllers\API\V1\Company\AuthController;
use App\Http\Controllers\API\V1\Company\RepController;
use App\Http\Controllers\API\V1\Company\ScheduleController;
use App\Http\Controllers\API\V1\Company\VisitController;
use Illuminate\Support\Facades\Route;

Route::prefix('company')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {

        Route::middleware('role:company_owner')->group(function () {
            Route::get('dashboard', [AuthController::class, 'dashboard']);
            Route::get('profile', [AuthController::class, 'profile']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::post('logout', [AuthController::class, 'logout']);

            Route::prefix('reps')->group(function () {
                Route::get('/', [RepController::class, 'index']);
                Route::post('/', [RepController::class, 'store']);
                Route::get('{rep}', [RepController::class, 'show']);
                Route::post('{rep}/suspend', [RepController::class, 'suspend']);
                Route::post('{rep}/activate', [RepController::class, 'activate']);
                Route::delete('{rep}', [RepController::class, 'destroy']);
            });

            Route::prefix('assignments')->group(function () {
                Route::get('/', [AssignmentController::class, 'index']);
                Route::post('/', [AssignmentController::class, 'store']);
                Route::delete('{assignment}', [AssignmentController::class, 'destroy']);
            });

            Route::prefix('schedules')->group(function () {
                Route::get('/', [ScheduleController::class, 'index']);
                Route::post('/', [ScheduleController::class, 'store']);
                Route::post('batch', [ScheduleController::class, 'batch']);
                Route::post('{schedule}/publish', [ScheduleController::class, 'publish']);
                Route::post('{schedule}/cancel', [ScheduleController::class, 'cancel']);
            });

            Route::prefix('visits')->group(function () {
                Route::get('/', [VisitController::class, 'index']);
                Route::get('export', [VisitController::class, 'export']);
                Route::get('stats', [VisitController::class, 'stats']);
                Route::get('{visit}', [VisitController::class, 'show']);
            });
        });
    });
});

Route::prefix('company/admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('pending', [AdminVerificationController::class, 'pending']);
    Route::post('{company}/verify', [AdminVerificationController::class, 'verify']);
});
