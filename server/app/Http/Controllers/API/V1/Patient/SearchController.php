<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Patient\SearchRequest;
use App\Models\Medication;
use App\Services\AlternativeMappingEngine;
use App\Services\MedicalSafetyEngine;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Log;

class SearchController extends Controller
{
    public function __construct(
        private readonly MedicalSafetyEngine $safetyEngine,
        private readonly AlternativeMappingEngine $alternativeEngine,
    ) {}

    /**
     * Search multiple medications and rank nearby pharmacies.
     */
    public function __invoke(SearchRequest $request): JsonResponse
    {
        $validated = $request->validated();
        // استقبال مصفوفة من النصوص البحثية بدلاً من نص واحد
        $queries = $validated['queries'];
        $patientLat = (float) $validated['latitude'];
        $patientLng = (float) $validated['longitude'];

        $patient = $request->user()?->patient;

        // 1. البحث عن كافة الأدوية المطابقة لكل النصوص المدخلة وتجميعها
        $matchedMedications = collect();
        foreach ($queries as $query) {
            $matchedMedications = $matchedMedications->merge($this->resolveMedications($query));
            // تسجيل التليمتري لكل كلمة بحثية
            $this->logSearchTelemetry($query, $matchedMedications, $patientLat, $patientLng);
        }

        // إزالة التكرار من الأدوية المطابقة بناءً على الـ ID
        $matchedMedications = $matchedMedications->unique('id')->values();

        if ($matchedMedications->isEmpty()) {
            return response()->json([
                'data' => [],
                'message' => 'No medications found',
            ]);
        }

        $allMedicationIds = collect();
        $brandMap = collect();
        $alternativeMap = collect();

        // مصفوفة بالذاكرة لتخزين أسماء الأدوية ومنع الـ N+1 Query
        $medicationNames = $matchedMedications->pluck('trade_name', 'id')->toArray();

        // 2. جلب البدائل للأدوية التي عثرنا عليها
        foreach ($matchedMedications as $medication) {
            $allMedicationIds->push($medication->id);
            $brandMap->put($medication->id, true);

            $alternatives = $this->alternativeEngine->findAlternatives($medication->id);
            foreach ($alternatives as $alt) {
                $allMedicationIds->push($alt->id);
                $alternativeMap->put($alt->id, $medication->id);

                if (! isset($medicationNames[$alt->id])) {
                    // تحسين: جلب الأدوية غير الموجودة دفعة واحدة لاحقاً أو استخدام find كملجأ أخير
                    $medicationNames[$alt->id] = $alt->trade_name ?? Medication::find($alt->id)?->trade_name;
                }
            }
        }

        $allMedicationIds = $allMedicationIds->unique();

        $radiusKm = 10;
        $latDelta = $radiusKm / 111.32;
        $lngDelta = $radiusKm / (111.32 * cos(deg2rad($patientLat)));

        // 3. الاستعلام لجلب الصيدليات التي تمتلك "أي" من هذه الأدوية في مخزونها
        $nearbyPharmacies = DB::table('pharmacy_inventories')
            ->join('pharmacies', 'pharmacies.id', '=', 'pharmacy_inventories.pharmacy_id')
            ->whereIn('pharmacy_inventories.medication_id', $allMedicationIds)
            ->where('pharmacy_inventories.stock', '>', 0)
            ->whereBetween('pharmacies.latitude', [$patientLat - $latDelta, $patientLat + $latDelta])
            ->whereBetween('pharmacies.longitude', [$patientLng - $lngDelta, $patientLng + $lngDelta])
            ->select([
                'pharmacies.id as pharmacy_id',
                'pharmacies.name as pharmacy_name',
                'pharmacies.address as pharmacy_address',
                'pharmacies.latitude as pharmacy_latitude',
                'pharmacies.longitude as pharmacy_longitude',
                'pharmacy_inventories.medication_id',
                'pharmacy_inventories.price',
                'pharmacy_inventories.stock',
                DB::raw('(SELECT AVG(rating) FROM pharmacy_reviews WHERE pharmacy_id = pharmacies.id) as average_rating'),
                DB::raw('(SELECT AVG(availability_rating) FROM pharmacy_reviews WHERE pharmacy_id = pharmacies.id) as average_availability_rating'),
            ])
            ->get();

        $uniquePharmacyIds = $nearbyPharmacies->pluck('pharmacy_id')->unique()->toArray();
        $currentDayName = strtolower(now()->format('l'));

        $hoursCache = DB::table('pharmacy_operating_hours')
            ->whereIn('pharmacy_id', $uniquePharmacyIds)
            ->where('day_of_week', $currentDayName)
            ->get()
            ->keyBy('pharmacy_id');

        $results = collect();

        foreach ($nearbyPharmacies as $pharmacy) {
            $distance = $this->haversine(
                $patientLat,
                $patientLng,
                (float) $pharmacy->pharmacy_latitude,
                (float) $pharmacy->pharmacy_longitude
            );

            if ($distance > $radiusKm) {
                continue;
            }

            $medicationId = $pharmacy->medication_id;
            $isBrandMatch = $brandMap->has($medicationId);
            $isAlternativeMatch = $alternativeMap->has($medicationId);

            $safetyStatus = 'unknown';
            if ($patient) {
                $isSafe = $this->safetyEngine->evaluate($medicationId, $patient->id);
                $safetyStatus = $isSafe ? 'green' : 'red';
            }

            $suitabilityScore = 0;

            if ($safetyStatus !== 'red') {
                if ($isBrandMatch) {
                    $suitabilityScore += 50;
                } elseif ($isAlternativeMatch) {
                    $suitabilityScore += 25;
                }
            }

            $generalRating = (float) ($pharmacy->average_rating ?? 0);
            $availabilityRating = (float) ($pharmacy->average_availability_rating ?? 0);

            $suitabilityScore += ($generalRating * 3) + ($availabilityRating * 6);
            if ($distance <= 0.1) {
                $suitabilityScore += 30;
            } else {
                $suitabilityScore += max(0, (10 - $distance) * 2);
            }
            logger($isBrandMatch);
            $matchType = $isBrandMatch ? 'brand' : ($isAlternativeMatch ? 'alternative' : 'generic');
            $isOpen = $this->checkIfPharmacyIsOpen((string) $pharmacy->pharmacy_id, $hoursCache);

            $results->push((object) [
                'pharmacy_id' => $pharmacy->pharmacy_id,
                'pharmacy_name' => $pharmacy->pharmacy_name,
                'pharmacy_address' => $pharmacy->pharmacy_address,
                'pharmacy_latitude' => $pharmacy->pharmacy_latitude,
                'pharmacy_longitude' => $pharmacy->pharmacy_longitude,
                'distance_km' => $distance,
                'suitability_score' => max(0, $suitabilityScore),
                'match_type' => $matchType,
                'medication_id' => $medicationId,
                'trade_name' => $medicationNames[$medicationId] ?? 'Unknown',
                'price' => $pharmacy->price,
                'stock' => $pharmacy->stock,
                'average_rating' => $pharmacy->average_rating,
                'safety_status' => $safetyStatus,
                'is_open' => $isOpen,
            ]);
        }

        // 4. تجميع الداتا وإعطاء الأولوية للصيدليات التي توفر أكبر عدد من الأدوية المطلوبة
        $groupedResults = $results->groupBy('pharmacy_id')->map(function ($pharmacyGroup): array {
            $first = $pharmacyGroup->first();

            $availableMedications = $pharmacyGroup->map(fn ($item) => [
                'medication_id' => $item->medication_id,
                'trade_name' => $item->trade_name,
                'price' => $item->price,
                'stock' => $item->stock,
                'match_type' => $item->match_type,
                'safety_status' => $item->safety_status,
            ])->values();

            // تحسين الحساب: الصيدلية التي تحتوي على تنوع أدوية أكثر (تغطي طلب المريض بالكامل) تُمنح بونص إضافي في الـ Score
            $medicationCountBonus = $availableMedications->count() * 100;

            return [
                'pharmacy_id' => $first->pharmacy_id,
                'pharmacy_name' => $first->pharmacy_name,
                'pharmacy_address' => $first->pharmacy_address,
                'pharmacy_latitude' => $first->pharmacy_latitude,
                'pharmacy_longitude' => $first->pharmacy_longitude,
                'distance_km' => $first->distance_km,
                // السكور الإجمالي للصيدلية هو أعلى سكور دواء منفرد + بونص عدد الأدوية المتوفرة
                'suitability_score' => $pharmacyGroup->max('suitability_score') + $medicationCountBonus,
                'is_open' => $first->is_open,
                'medications' => $availableMedications,
            ];
        })->values();

        $sorted = $groupedResults->sortByDesc('suitability_score')->values();

        return response()->json([
            'data' => $sorted,
            'message' => 'Search results retrieved successfully',
        ]);
    }

    private function resolveMedications(string $query): Collection
    {
        $byTradeName = Medication::with('activeIngredients')
            ->where('trade_name', 'like', '%'.$query.'%')
            ->get();

        $byIngredient = Medication::with('activeIngredients')
            ->whereHas('activeIngredients', fn ($q) => $q->where('ingredient_name_en', 'like', '%'.$query.'%'))
            ->get();

        return $byTradeName->merge($byIngredient)->unique('id')->values();
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLng / 2) * sin($dLng / 2);

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function checkIfPharmacyIsOpen(string $pharmacyId, Collection $hoursCache): bool
    {
        $hours = $hoursCache->get($pharmacyId);

        if ($hours === null || $hours->is_closed) {
            return false;
        }

        if ($hours->is_24_hours) {
            return true;
        }

        $now = now()->format('H:i');

        return $now >= $hours->opening_time && $now <= $hours->closing_time;
    }

    private function logSearchTelemetry(string $query, Collection $matchedMedications, float $lat, float $lng): void
    {
        try {
            $firstMedication = $matchedMedications->first();
            $activeIngredientId = null;

            if ($firstMedication && $firstMedication->activeIngredients->isNotEmpty()) {
                $activeIngredientId = $firstMedication->activeIngredients->first()->id;
            }

            DB::table('search_telemetries')->insert([
                'searched_query' => $query,
                'resolved_active_ingredient_id' => $activeIngredientId,
                'latitude' => $lat,
                'longitude' => $lng,
                'created_at' => now(),
            ]);
        } catch (Exception $e) {
            Log::error('Failed to log search telemetry: '.$e->getMessage());
        }
    }
}
