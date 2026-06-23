<?php

declare(strict_types=1);

use App\Http\Controllers\API\V1\Medication\MedicationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Global Medication Catalog API Routes (FR-P-3)
|--------------------------------------------------------------------------
|
| Prefix: /api/v1/medications
| Middleware: api
|
| These public endpoints provide access to the global medication catalog
| for all user roles (patients, doctors, pharmacists, etc.).
|
*/

Route::get('medications', [MedicationController::class, 'index']);
