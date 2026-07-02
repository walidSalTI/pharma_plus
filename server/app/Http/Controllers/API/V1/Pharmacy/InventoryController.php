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
     * Add inventory items in bulk (FR-PH-2.1, FR-PH-2.3).
     *
     * Accepts an array of inventory items and creates stock entries
     * for each medication. Items that already exist in the pharmacy's
     * inventory are skipped and reported. Requires `inventory_manage` permission.
     */
    public function store(StoreInventoryRequest $request, Pharmacy $pharmacy): JsonResponse
    {
        $this->authorize('manageInventory', $pharmacy);

        $validated = $request->validated();
        $created = [];
        $skipped = [];

        foreach ($validated['items'] as $item) {
            $exists = $pharmacy->pharmacyInventories()
                ->where('medication_id', $item['medication_id'])
                ->exists();

            if ($exists) {
                $skipped[] = [
                    'medication_id' => $item['medication_id'],
                    'message' => 'Already in inventory. Use PUT to update.',
                ];

                continue;
            }

            $inventory = PharmacyInventory::create([
                'pharmacy_id' => $pharmacy->id,
                'medication_id' => $item['medication_id'],
                'price' => $item['price'],
                'stock' => $item['stock'],
                'min_stock' => $item['min_stock'] ?? 10,
                'last_updated' => now(),
            ]);

            $inventory->load('medication');
            $created[] = new InventoryResource($inventory);
        }

        return response()->json([
            'message' => count($created) > 0
                ? count($created).' inventory item(s) added successfully.'
                : 'No items were added.',
            'data' => $created,
            'skipped' => $skipped,
        ], count($created) > 0 ? 201 : 200);
    }

    /**
     * Update inventory items in bulk (FR-PH-2.3).
     *
     * Accepts an array of items identified by medication_id and updates
     * their price, stock, and/or minimum stock threshold. Items not found
     * in the pharmacy's inventory are reported. Requires `inventory_manage` permission.
     */
    public function update(UpdateInventoryRequest $request, Pharmacy $pharmacy): JsonResponse
    {
        $this->authorize('manageInventory', $pharmacy);

        $validated = $request->validated();
        $updated = [];
        $notFound = [];

        foreach ($validated['items'] as $item) {
            $inventory = $pharmacy->pharmacyInventories()
                ->where('medication_id', $item['medication_id'])
                ->first();

            if (! $inventory) {
                $notFound[] = [
                    'medication_id' => $item['medication_id'],
                    'message' => 'Medication not found in inventory.',
                ];

                continue;
            }

            $updateData = ['last_updated' => now()];

            if (isset($item['price'])) {
                $updateData['price'] = $item['price'];
            }
            if (isset($item['stock'])) {
                $updateData['stock'] = $item['stock'];
            }
            if (isset($item['min_stock'])) {
                $updateData['min_stock'] = $item['min_stock'];
            }

            $inventory->update($updateData);
            $inventory->load('medication');
            $updated[] = new InventoryResource($inventory);
        }

        return response()->json([
            'message' => count($updated).' inventory item(s) updated successfully.',
            'data' => $updated,
            'not_found' => $notFound,
        ]);
    }

    /**
     * Update a single inventory item (FR-PH-2.3).
     *
     * Updates price, stock quantity, and/or minimum stock threshold for a
     * specific inventory item identified by its UUID.
     * Requires `inventory_manage` permission.
     */
    public function updateSingle(Request $request, Pharmacy $pharmacy, PharmacyInventory $inventory): JsonResponse
    {
        if ($inventory->pharmacy_id !== $pharmacy->id) {
            return response()->json(['message' => 'Inventory item not found for this pharmacy.'], 404);
        }

        $this->authorize('manageInventory', $pharmacy);

        $validated = $request->validate([
            'price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'min_stock' => ['nullable', 'integer', 'min:0'],
        ]);

        $updateData = ['last_updated' => now()];

        if (isset($validated['price'])) {
            $updateData['price'] = $validated['price'];
        }
        if (isset($validated['stock'])) {
            $updateData['stock'] = $validated['stock'];
        }
        if (isset($validated['min_stock'])) {
            $updateData['min_stock'] = $validated['min_stock'];
        }

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
     * Get all low-stock medications in the pharmacy.
     *
     * Returns inventory items where current stock is at or below
     * the minimum stock threshold, including full medication details.
     * Accessible by owner or staff with `inventory_manage` permission.
     */
    public function lowStock(Request $request, Pharmacy $pharmacy): JsonResponse
    {
        $this->authorize('manageInventory', $pharmacy);

        $lowStockItems = $pharmacy->pharmacyInventories()
            ->with('medication')
            ->whereColumn('stock', '<=', 'min_stock')
            ->orderBy('stock', 'asc')
            ->get();

        return response()->json([
            'data' => InventoryResource::collection($lowStockItems),
            'meta' => [
                'total' => $lowStockItems->count(),
            ],
        ]);
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
