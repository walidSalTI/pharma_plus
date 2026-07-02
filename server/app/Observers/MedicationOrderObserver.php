<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\MedicationOrder;
use App\Models\PharmacyInventory;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class MedicationOrderObserver
{
    /**
     * Handle inventory lifecycle on order status changes.
     *
     * - pending   → confirmed: Decrements stock (fail-safe, locked).
     * - confirmed → cancelled: Restocks inventory.
     * - ready     → cancelled: Restocks inventory.
     * - All other valid transitions: No stock change.
     */
    public function updated(MedicationOrder $order): void
    {
        if (! $order->isDirty('status')) {
            return;
        }

        $newStatus = $order->status;
        $oldStatus = $order->getOriginal('status');

        DB::transaction(function () use ($order, $newStatus, $oldStatus) {

            if ($newStatus === 'confirmed' && $oldStatus === 'pending') {

                foreach ($order->items as $item) {

                    $inventory = PharmacyInventory::where('pharmacy_id', $order->pharmacy_id)
                        ->where('medication_id', $item->medication_id)
                        ->lockForUpdate()
                        ->first();

                    if (! $inventory) {
                        throw new RuntimeException(
                            "Medication {$item->medication_id} is not registered in this pharmacy's inventory."
                        );
                    }

                    if ($inventory->stock < $item->quantity) {
                        throw new RuntimeException(
                            "Insufficient stock for medication {$item->medication_id}. "
                            ."Available: {$inventory->stock}, requested: {$item->quantity}."
                        );
                    }

                    $inventory->decrement('stock', $item->quantity);
                }

                return;
            }

            if ($newStatus === 'cancelled' && in_array($oldStatus, ['confirmed', 'ready'], true)) {

                foreach ($order->items as $item) {
                    PharmacyInventory::where('pharmacy_id', $order->pharmacy_id)
                        ->where('medication_id', $item->medication_id)
                        ->increment('stock', $item->quantity);
                }
            }
        });
    }
}
