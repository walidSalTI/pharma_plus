<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1\Pharmacy;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Pharmacy\BulkImportInventoryRequest;
use App\Http\Requests\API\V1\Pharmacy\StoreInventoryRequest;
use App\Http\Requests\API\V1\Pharmacy\UpdateInventoryRequest;
use App\Http\Resources\API\V1\Pharmacy\InventoryResource;
use App\Models\Pharmacy;
use App\Models\PharmacyInventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Inventory Management (FR-PH-2).
 *
 * Handles manual stock entry, bulk Excel import, live stock adjustments,
 * and out-of-stock declarations. All changes are synced to patient-facing
 * search results in real-time.
 */
class InventoryController extends Controller
{
    /**
     * List pharmacy inventory (FR-PH-2.1).
     *
     * Returns paginated inventory items with medication details,
     * current stock, pricing, and low-stock indicators.
     * Accessible by owner or staff with `inventory_manage` permission.
     */
    public function index(Request $request, Pharmacy $pharmacy): JsonResponse
    {
        $this->authorize('manageInventory', $pharmacy);

        $inventory = $pharmacy->pharmacyInventories()
            ->with('medication')
            ->when($request->filled('low_stock'), fn ($q) => $q->whereColumn('stock', '<=', 'min_stock'))
            ->when($request->filled('medication_id'), fn ($q) => $q->where('medication_id', $request->medication_id))
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 50));

        return response()->json([
            'data' => InventoryResource::collection($inventory),
            'meta' => [
                'current_page' => $inventory->currentPage(),
                'last_page' => $inventory->lastPage(),
                'per_page' => $inventory->perPage(),
                'total' => $inventory->total(),
            ],
        ]);
    }

    /**
     * Add a new inventory item (FR-PH-2.1, FR-PH-2.3).
     *
     * Creates a new stock entry for an existing medication from the
     * central catalog. Price, stock quantity, and optional minimum
     * stock threshold are required. Requires `inventory_manage` permission.
     */
    public function store(StoreInventoryRequest $request, Pharmacy $pharmacy): JsonResponse
    {
        $this->authorize('manageInventory', $pharmacy);

        $validated = $request->validated();

        $exists = $pharmacy->pharmacyInventories()
            ->where('medication_id', $validated['medication_id'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'This medication is already in your inventory. Use PUT to update it.'], 409);
        }

        $inventory = PharmacyInventory::create([
            'pharmacy_id' => $pharmacy->id,
            'medication_id' => $validated['medication_id'],
            'price' => $validated['price'],
            'stock' => $validated['stock'],
            'min_stock' => $validated['min_stock'] ?? 10,
            'last_updated' => now(),
        ]);

        $inventory->load('medication');

        return response()->json([
            'message' => 'Inventory item added successfully.',
            'data' => new InventoryResource($inventory),
        ], 201);
    }

    /**
     * Update an inventory item (FR-PH-2.3).
     *
     * Updates price, stock quantity, and/or minimum stock threshold.
     * Stock can be adjusted up (restock) or down (sale/waste).
     * Setting stock to 0 effectively marks the item as "Out of Stock".
     * Requires `inventory_manage` permission.
     */
    public function update(UpdateInventoryRequest $request, Pharmacy $pharmacy, PharmacyInventory $inventory): JsonResponse
    {
        if ($inventory->pharmacy_id !== $pharmacy->id) {
            return response()->json(['message' => 'Inventory item not found for this pharmacy.'], 404);
        }

        $this->authorize('manageInventory', $pharmacy);

        $validated = $request->validated();

        $updateData = [];

        if (isset($validated['price'])) {
            $updateData['price'] = $validated['price'];
        }
        if (isset($validated['stock'])) {
            $updateData['stock'] = $validated['stock'];
        }
        if (isset($validated['min_stock'])) {
            $updateData['min_stock'] = $validated['min_stock'];
        }

        $updateData['last_updated'] = now();

        $inventory->update($updateData);
        $inventory->load('medication');

        return response()->json([
            'message' => 'Inventory item updated successfully.',
            'data' => new InventoryResource($inventory),
        ]);
    }

    /**
     * Remove an inventory item (FR-PH-2.3).
     *
     * Permanently deletes the stock entry from the pharmacy's inventory.
     * Requires `inventory_manage` permission.
     */
    public function destroy(Request $request, Pharmacy $pharmacy, PharmacyInventory $inventory): JsonResponse
    {

        if ($inventory->pharmacy_id !== $pharmacy->id) {
            return response()->json(['message' => 'Inventory item not found for this pharmacy.'], 404);
        }
        $this->authorize('manageInventory', $pharmacy);

        $inventory->delete();

        return response()->json(['message' => 'Inventory item removed successfully.']);
    }

    /**
     * Bulk import inventory from Excel (FR-PH-2.2).
     *
     * Accepts an uploaded Excel file (.xlsx, .xls, .csv) and processes
     * each row against the central medication catalog. Returns a detailed
     * status report highlighting successful imports and validation errors.
     *
     * Expected columns: Commercial Name, Active Ingredient, Concentration,
     * Stock Quantity, Retail Price, Expiry Date.
     * Requires `inventory_manage` permission.
     *
     * @todo Implement actual Excel parsing with maatwebsite/excel
     */
    public function bulkImport(BulkImportInventoryRequest $request, Pharmacy $pharmacy): JsonResponse
    {
        $this->authorize('manageInventory', $pharmacy);

        $file = $request->file('file');

        $filePath = $file->store('bulk-imports', 'local');

        return response()->json([
            'message' => 'File uploaded successfully. Processing will be completed asynchronously.',
            'data' => [
                'file_path' => $filePath,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ],
        ]);
    }
}
