<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\MedicationOrder;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels; // 1. تأكد من استدعاء هذا السطر

class MedicationHoldRequested implements ShouldBroadcast
{
    // 2. قم بإضافة SerializesModels هنا داخل الكلاس
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public MedicationOrder $order, // بدون readonly وبدون تحدييدات صارمة أخرى
    ) {}
    public function broadcastOn(): array
    {
        return [
            new Channel('pharmacy.' . $this->order->pharmacy_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'medication.hold.requested';
    }

    public function broadcastWith(): array
    {
        // 3. لضمان عدم حدوث خطأ، نقوم بعمل محاكاة آمنة للاسم حتى لو كانت العلاقات فارغة
        $patient = $this->order->patient;
        $user = $patient?->user;
        $patientName = $user ? ($user->f_name . ' ' . $user->l_name) : 'Unknown Patient';

        try {
            return [
                'order_id' => $this->order->id,
                'invoice_number' => $this->order->invoice_number,
                'patient_name' => $patientName,
                'total_price' => (float) $this->order->total_price,
                'status' => $this->order->status,
                'items' => $this->order->items->map(fn($item) => [
                    'medication_id' => $item->medication_id,
                    'trade_name' => $item->medication?->trade_name ?? 'N/A',
                    'quantity' => $item->quantity,
                    'price' => (float) $item->price,
                ]),
                'created_at' => $this->order->created_at?->toISOString(),
            ];
        } catch (\Throwable $e) {
            // سيقوم هذا السطر بكتابة الخطأ بوضوح في الـ Log
            \Log::error('Broadcasting failed in MedicationHoldRequested: ' . $e->getMessage());

            // إرجاع مصفوفة فارغة مؤقتاً حتى لا يموت السيرفر وتعرف المشكلة
            return ['error' => $e->getMessage()];
        }
    }
}
