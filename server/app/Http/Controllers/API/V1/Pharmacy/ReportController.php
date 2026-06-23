<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1\Pharmacy;

use App\Http\Controllers\Controller;
use App\Http\Resources\API\V1\Pharmacy\ReportResource;
use App\Models\Pharmacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Reporting & Operational Analytics (FR-PH-8).
 *
 * Generates monthly analytical reports and provides one-click
 * inventory export functionality.
 */
class ReportController extends Controller
{
    /**
     * Generate monthly report (FR-PH-8.1).
     *
     * Returns a monthly report detailing top-selling drugs, regional
     * market shifts, and historical disease indicators.
     * Accessible by owner or staff with `pharmacy_manage` permission.
     *
     * @todo Implement real aggregation logic against order and inventory data
     */
    public function monthly(Request $request, Pharmacy $pharmacy): JsonResponse
    {
        $this->authorize('manage', $pharmacy);

        $reportData = (object) [
            'period' => $request->input('month', now()->format('Y-m')),
            'top_selling_drugs' => [],
            'market_shifts' => [],
            'disease_indicators' => [],
        ];

        return response()->json([
            'data' => new ReportResource($reportData),
        ]);
    }

    /**
     * Export inventory to file (FR-PH-8.2).
     *
     * One-click extraction of the live pharmacy asset registry,
     * stock levels, and valuation tiers into a structured file format.
     * Requires `inventory_manage` permission.
     *
     * @todo Implement Excel/PDF export
     */
    public function export(Request $request, Pharmacy $pharmacy): JsonResponse
    {
        $this->authorize('manageInventory', $pharmacy);

        return response()->json([
            'message' => 'Export feature is not yet implemented.',
        ]);
    }
}
