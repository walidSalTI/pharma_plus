<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1\Pharmacy;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Pharmacy\ListOrdersRequest;
use App\Http\Requests\API\V1\Pharmacy\UpdateOrderStatusRequest;
use App\Models\MedicationOrder;
use App\Models\Pharmacy;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    /**
     * List all medication orders for a pharmacy with optional filters.
     *
     * Supports filtering by status, date range, and free-text search
     * against patient name or invoice number.
     */
    public function index(ListOrdersRequest $request, Pharmacy $pharmacy): JsonResponse
    {
        $this->authorize('viewDashboard', $pharmacy);

        $validated = $request->validated();

        $query = MedicationOrder::with([
            'items.medication',
            'patient.user',
        ])->where('pharmacy_id', $pharmacy->id);

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (! empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('patient.user', function ($userQ) use ($search) {
                        $userQ->where('f_name', 'like', "%{$search}%")
                            ->orWhere('l_name', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = min((int) ($validated['per_page'] ?? 20), 100);
        $orders = $query->orderByDesc('created_at')->paginate($perPage);

        $data = $orders->map(fn (MedicationOrder $order) => [
            'order_id' => $order->id,
            'invoice_number' => $order->invoice_number,
            'status' => $order->status,
            'total_price' => (float) $order->total_price,
            'pharmacist_note' => $order->pharmacist_note,
            'patient_name' => $order->patient?->user
                ? trim($order->patient->user->f_name.' '.$order->patient->user->l_name)
                : null,
            'items_count' => $order->items->count(),
            'items' => $order->items->map(fn ($item) => [
                'medication_id' => $item->medication_id,
                'trade_name' => $item->medication?->trade_name,
                'quantity' => $item->quantity,
                'price' => (float) $item->price,
            ]),
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
        ]);

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    private const VALID_TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['ready', 'cancelled'],
        'ready' => ['completed', 'cancelled'],
    ];

    /**
     * Update the status of a medication order (FR-PH-2.3).
     *
     * Valid transitions and inventory impact (handled by observer):
     * - pending   → confirmed:  Decrements stock
     * - confirmed → ready:      No stock change
     * - ready     → completed:  No stock change
     * - confirmed → cancelled:  Restocks inventory
     * - ready     → cancelled:  Restocks inventory
     * - pending   → cancelled:  No stock change
     */
    public function updateStatus(UpdateOrderStatusRequest $request, string $pharmacy, string $order): JsonResponse
    {
        $validated = $request->validated();

        $order = MedicationOrder::with('items')->find($order);

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $this->authorize('processOrders', $order->pharmacy);

        $newStatus = $validated['status'];
        $oldStatus = $order->status;

        if ($oldStatus === 'cancelled') {
            return response()->json(['message' => 'Cannot update a cancelled order.'], 422);
        }

        if ($oldStatus === 'completed') {
            return response()->json(['message' => 'Cannot update a completed order.'], 422);
        }

        if ($oldStatus === $newStatus) {
            return response()->json(['message' => "Order is already {$oldStatus}."], 422);
        }

        $allowed = self::VALID_TRANSITIONS[$oldStatus] ?? [];
        if (! in_array($newStatus, $allowed, true)) {
            return response()->json([
                'message' => "Invalid transition from {$oldStatus} to {$newStatus}.",
            ], 422);
        }

        $order->update(['status' => $newStatus]);

        return response()->json([
            'message' => 'Order status updated successfully.',
            'data' => [
                'order_id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'status' => $order->status,
                'total_price' => $order->total_price,
                'pharmacy_id' => $order->pharmacy_id,
                'updated_at' => $order->updated_at,
            ],
        ]);
    }
}
