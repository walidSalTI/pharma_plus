<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1\Patient;

use App\Events\MedicationHoldRequested;
use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Patient\HoldMedicationRequest;
use App\Models\MedicationOrder;
use App\Models\Pharmacy;
use App\Models\PharmacyInventory;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Patient Medication Ordering & Real-Time Reservation (FR-P-6.3, FR-P-6.4).
 *
 * Handles medication hold/reservation requests from patients to pharmacies.
 * Ensures the pharmacy is currently open before accepting any orders.
 */
class OrderController extends Controller
{
    /**
     * Hold/reserve multiple medications at a pharmacy (FR-P-6.3).
     *
     * @bodyParam pharmacy_id string required The target pharmacy UUID.
     * @bodyParam items array required Array of medications to reserve.
     * @bodyParam items.*.medication_id string required The medication UUID.
     * @bodyParam items.*.quantity int required Quantity to reserve (1-100).
     * @bodyParam pharmacist_note string optional Note for the pharmacist.
     */
    public function holdMedication(HoldMedicationRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $patient = $request->user()->patient;
        $pharmacyId = $validated['pharmacy_id'];

        // 1. جلب الصيدلية والتحقق من مواعيد العمل فوراً قبل فتح الـ Transaction
        $pharmacy = Pharmacy::find($pharmacyId);

        if (! $pharmacy) {
            return response()->json(['message' => 'Pharmacy not found.'], 404);
        }

        if (! $this->checkIfPharmacyIsOpen($pharmacyId)) {
            return response()->json([
                'message' => 'This pharmacy is currently closed. You cannot place hold requests until they re-open.',
            ], 422);
        }

        // 2. معالجة الحجز والمخزون داخل قاعدة البيانات بأمان
        return DB::transaction(function () use ($validated, $patient, $pharmacyId) {

            $totalOrderPrice = 0;
            $orderItemsData = [];

            foreach ($validated['items'] as $item) {
                // استخدام lockForUpdate لحماية المخزون من الطلبات المتزامنة في نفس الأجزاء من الثانية 🔒
                $inventory = PharmacyInventory::query()
                    ->where('pharmacy_id', $pharmacyId)
                    ->where('medication_id', $item['medication_id'])
                    ->lockForUpdate()
                    ->first();

                if (! $inventory) {
                    throw new Exception("Medication {$item['medication_id']} is not registered at this pharmacy.", 404);
                }

                if ($inventory->stock < $item['quantity']) {
                    throw new Exception("Insufficient stock for medication {$item['medication_id']}. Available: {$inventory->stock}", 422);
                }

                $itemPrice = $inventory->price * $item['quantity'];
                $totalOrderPrice += $itemPrice;

                $orderItemsData[] = [
                    'medication_id' => $item['medication_id'],
                    'quantity' => $item['quantity'],
                    'price' => $inventory->price,
                ];

                // إذا كانت قواعد العمل لديك تقتضي خصم المخزون فوراً عند الحجز المعلق:
                // $inventory->decrement('stock', $item['quantity']);
            }

            $invoiceNumber = 'INV-'.strtoupper(Str::random(12));

            $order = MedicationOrder::create([
                'patient_id' => $patient->id,
                'pharmacy_id' => $pharmacyId,
                'status' => 'pending',
                'total_price' => $totalOrderPrice,
                'invoice_number' => $invoiceNumber,
                'pharmacist_note' => $validated['pharmacist_note'] ?? null,
            ]);

            $order->items()->createMany($orderItemsData);

            // بث إشعار فوري للـ Dashboard الخاص بالصيدلية عبر Reverb ⚡
            broadcast(new MedicationHoldRequested($order))->toOthers();

            return response()->json([
                'message' => 'Medication hold request submitted successfully.',
                'data' => [
                    'order_id' => $order->id,
                    'invoice_number' => $invoiceNumber,
                    'status' => $order->status,
                    'total_price' => $totalOrderPrice,
                    'pharmacy_id' => $pharmacyId,
                    'created_at' => $order->created_at,
                ],
            ], 201);
        });
    }

    /**
     * التحقق الفوري مما إذا كانت الصيدلية مفتوحة الآن بناءً على جدول مواقيت العمل
     */
    private function checkIfPharmacyIsOpen(string $pharmacyId): bool
    {
        $currentDayName = strtolower(now()->format('w')); // يجلب اسم اليوم الحالي مثل 'wednesday'
        logger($currentDayName);
        // جلب سجل مواقيت الصيدلية لليوم الحالي فقط
        $hours = DB::table('pharmacy_operating_hours')
            ->where('pharmacy_id', $pharmacyId)
            ->where('day_of_week', $currentDayName)
            ->first();
        logger($hours->opening_time);
        logger($hours->closing_time);
        logger($hours->is_24_hours);
        // 1. إذا لم يوجد سجل مواقيت لهذا اليوم أو كانت الصيدلية قد حددت اليوم كعطلة مغلقة
        if ($hours === null || (bool) $hours->is_closed) {
            return false;
        }

        // 2. إذا كانت الصيدلية تعمل على مدار 24 ساعة متواصلة
        if ((bool) $hours->is_24_hours) {
            return true;
        }

        // 3. التحقق مما إذا كان الوقت الحالي يقع بين وقت الفتح ووقت الإغلاق
        $now = now()->format('H:i');

        return $now >= $hours->opening_time && $now <= $hours->closing_time;
    }
}
