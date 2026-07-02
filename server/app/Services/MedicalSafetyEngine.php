<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;

class MedicalSafetyEngine
{
    public function checkDiseaseConflicts(array $medicationIngredientIds, string $patientId): bool
    {
        // Direct pluck from table avoiding hydration of complete Patient and ChronicRecord models
        $patientChronicRecordDiseaseCodes = DB::table('chronic_records')
            ->where('patient_id', $patientId)
            ->pluck('chronic_disease_id');

        if ($patientChronicRecordDiseaseCodes->isEmpty()) {
            return true;
        }

        $highRiskCount = DB::table('active_ingredients_chronic_disease')
            ->whereIn('active_ingredient_id', $medicationIngredientIds)
            ->whereIn('chronic_disease_id', $patientChronicRecordDiseaseCodes)
            ->whereIn('risk_level', ['high', 'medium'])
            ->count();

        return $highRiskCount === 0;
    }

    public function checkDrugInteractions(array $medicationIngredientIds, string $patientId): bool
    {
        // High-Performance Database Join: Pull all active ingredient IDs directly via DB facade
        $activeMedicationIngredientIds = DB::table('medication_patients')
            ->join('medication_ingredients', 'medication_patients.medication_id', '=', 'medication_ingredients.medication_id')
            ->where('medication_patients.patient_id', $patientId)
            ->where('medication_patients.is_active', true)
            ->pluck('medication_ingredients.active_ingredient_id')
            ->unique()
            ->toArray();

        if (empty($activeMedicationIngredientIds)) {
            return true;
        }

        $interactionCount = DB::table('composition_interactions')
            ->where(function ($query) use ($medicationIngredientIds, $activeMedicationIngredientIds) {
                $query->whereIn('composition_id', $medicationIngredientIds)
                    ->whereIn('interaction_composition_id', $activeMedicationIngredientIds);
            })
            ->orWhere(function ($query) use ($medicationIngredientIds, $activeMedicationIngredientIds) {
                $query->whereIn('composition_id', $activeMedicationIngredientIds)
                    ->whereIn('interaction_composition_id', $medicationIngredientIds);
            })
            ->count();

        return $interactionCount === 0;
    }

    public function evaluate(string $medicationId, string $patientId): bool
    {
        // Pull target ingredients once at the root level to save queries
        $medicationIngredientIds = DB::table('medication_ingredients')
            ->where('medication_id', $medicationId)
            ->pluck('active_ingredient_id')
            ->toArray();

        if (empty($medicationIngredientIds)) {
            return true;
        }

        if (! $this->checkDiseaseConflicts($medicationIngredientIds, $patientId)) {
            return false;
        }

        return $this->checkDrugInteractions($medicationIngredientIds, $patientId);
    }
}
