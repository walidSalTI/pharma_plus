<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\MedicationOrder;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class MedicationHoldRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public readonly MedicationOrder $order,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('pharmacy.'.$this->order->pharmacy_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'medication.hold.requested';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'invoice_number' => $this->order->invoice_number,
            'patient_name' => $this->order->patient?->user?->f_name.' '.$this->order->patient?->user?->l_name,
            'total_price' => (float) $this->order->total_price,
            'status' => $this->order->status,
            'items' => $this->order->items->map(fn ($item) => [
                'medication_id' => $item->medication_id,
                'trade_name' => $item->medication?->trade_name,
                'quantity' => $item->quantity,
                'price' => (float) $item->price,
            ]),
            'created_at' => $this->order->created_at->toISOString(),
        ];
    }
}
