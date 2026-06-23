<?php

declare(strict_types=1);

use App\Http\Controllers\API\V1\Pharmacy\AuthController;
use App\Http\Controllers\API\V1\Pharmacy\DemandController;
use App\Http\Controllers\API\V1\Pharmacy\ForecastController;
use App\Http\Controllers\API\V1\Pharmacy\InventoryController;
use App\Http\Controllers\API\V1\Pharmacy\NotificationController;
use App\Http\Controllers\API\V1\Pharmacy\OperatingHourController;
use App\Http\Controllers\API\V1\Pharmacy\ProfileController;
use App\Http\Controllers\API\V1\Pharmacy\ProposalController;
use App\Http\Controllers\API\V1\Pharmacy\ReportController;
use App\Http\Controllers\API\V1\Pharmacy\ReviewController;
use App\Http\Controllers\API\V1\Pharmacy\StaffController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Pharmacist / Pharmacy API Routes (FR-PH)
|--------------------------------------------------------------------------
|
| Prefix: /api/v1/pharmacist
| Middleware: api
|
| These routes implement the complete Pharmacist functional requirements
| covering authentication, inventory, demand tracking, disease forecasting,
| catalog contributions, profile management, reviews, and reporting.
|
*/

Route::prefix('pharmacist')->group(function () {

    // ─── Authentication (FR-PH-1) — no auth ───────────────────────────
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    // ─── Authenticated Routes ──────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'role:pharmacist'])->group(function () {

        // Auth
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('dashboard', [AuthController::class, 'dashboard']);

        // Verification (FR-PH-1.2)
        Route::post('verify', [AuthController::class, 'submitVerification']);
        Route::get('verification-status', [AuthController::class, 'verificationStatus']);

        // Profile (FR-PH-6.1) — user profile (not pharmacy-scoped)
        Route::put('update-profile', [ProfileController::class, 'updateProfile']);

        // Pharmacy management
        Route::post('pharmacy', [ProfileController::class, 'storePharmacy']);
        Route::get('pharmacies/{pharmacy}', [ProfileController::class, 'showPharmacy']);

        // ─── Pharmacy-scoped routes (require pharmacy_id) ─────────────
        Route::prefix('pharmacies/{pharmacy}')->group(function () {

            // Pharmacy Profile (FR-PH-6.1)
            Route::get('profile', [ProfileController::class, 'show']);
            Route::put('profile', [ProfileController::class, 'update']);

            // Inventory (FR-PH-2)
            Route::prefix('inventory')->group(function () {
                Route::get('/', [InventoryController::class, 'index']);
                Route::post('/', [InventoryController::class, 'store']);
                Route::post('bulk-import', [InventoryController::class, 'bulkImport']);
                Route::get('export', [ReportController::class, 'export']);
                Route::put('{inventory}', [InventoryController::class, 'update']);
                Route::delete('{inventory}', [InventoryController::class, 'destroy'])->missing(fn () => response()->json(['message' => 'Inventory item not found.'], 404));
            });

            // Operating Hours (FR-PH-6.1, FR-PH-6.2)
            Route::get('operating-hours', [OperatingHourController::class, 'index']);
            Route::put('operating-hours', [OperatingHourController::class, 'upsert']);
            Route::post('vacation', [OperatingHourController::class, 'declareVacation']);

            // Regional Demand (FR-PH-3)
            Route::get('demand-map', [DemandController::class, 'demandMap']);

            // Disease Forecasting (FR-PH-4)
            Route::get('disease-forecasts', [ForecastController::class, 'forecasts']);

            // Staff (FR-PH-6.3)
            Route::prefix('staff')->group(function () {
                Route::post('search', [StaffController::class, 'search']);
                Route::post('invite/{targetPharmacist}', [StaffController::class, 'invite']);
                Route::get('/', [StaffController::class, 'index']);
                Route::post('/', [StaffController::class, 'store']);
                Route::put('{staff}', [StaffController::class, 'update']);
                Route::delete('{staff}', [StaffController::class, 'destroy']);
            });

            // Join Request (FR-PH-6.3) — pharmacist requests to join
            Route::post('join-request', [NotificationController::class, 'sendJoinRequest']);

            // Reviews (FR-PH-7)
            Route::get('reviews', [ReviewController::class, 'index']);
            Route::post('reviews/{review}/reply', [ReviewController::class, 'reply']);

            // Reports (FR-PH-8)
            Route::get('reports/monthly', [ReportController::class, 'monthly']);

        });

        // Proposals (FR-PH-5) — not pharmacy-scoped
        Route::prefix('proposals')->group(function () {
            Route::get('/', [ProposalController::class, 'index']);
            Route::post('/', [ProposalController::class, 'store']);
            Route::get('{proposal}', [ProposalController::class, 'show']);
        });

        // Notifications (FR-PH-6.3) — not pharmacy-scoped
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::post('{notification}/accept-invitation', [NotificationController::class, 'acceptStaffInvitation']);
            Route::post('{notification}/reject-invitation', [NotificationController::class, 'rejectStaffInvitation']);
            Route::post('{notification}/accept-join-request', [NotificationController::class, 'acceptJoinRequest']);
            Route::post('{notification}/reject-join-request', [NotificationController::class, 'rejectJoinRequest']);
        });

    });
});
