<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1\Medication;

use App\Http\Controllers\Controller;
use App\Http\Resources\API\V1\Medication\MedicationResource;
use App\Models\Medication;
use Illuminate\Http\Request;

/**
 * Global Medication Catalog (FR-P-3).
 *
 * Public endpoints for fetching and filtering the global medication
 * catalog. Available to all user roles without authentication.
 */
class MedicationController extends Controller
{
    /**
     * List & filter medications (FR-P-3.1, FR-P-3.2).
     *
     * Returns a paginated list of medications filtered by optional
     * query parameters. Supports partial matching on trade name,
     * active ingredient name, and manufacturer name.
     *
     * @queryParam name string Partial match on trade_name.
     * @queryParam active_ingredient string Partial match on active_ingredients.ingredient_name_en.
     * @queryParam company string Partial match on manufacture name.
     */
    public function index(Request $request): mixed
    {
        $medicines = Medication::query()
            ->with(['manufacture', 'medicationIngredients.activeIngredient'])
            ->when($request->filled('name'), fn ($q) => $q->where('trade_name', 'like', '%'.$request->input('name').'%'))
            ->when($request->filled('active_ingredient'), fn ($q) => $q->whereHas('activeIngredients', fn ($q) => $q->where('ingredient_name_en', 'like', '%'.$request->input('active_ingredient').'%')))
            ->when($request->filled('company'), fn ($q) => $q->whereHas('manufacture', fn ($q) => $q->where('name', 'like', '%'.$request->input('company').'%')))
            ->paginate(30);

        return MedicationResource::collection($medicines);
    }
}
