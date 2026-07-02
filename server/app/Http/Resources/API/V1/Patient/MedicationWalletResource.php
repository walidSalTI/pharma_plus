<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicationWalletResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'medication_id' => $this->medication_id,
            'trade_name' => $this->medication?->trade_name,
            'form' => $this->medication?->form,
            'medication_image' => $this->medication?->image ? asset('storage/'.$this->medication->image) : null,
            'state' => $this->state,
            'chronic_id' => $this->chronic_id,
            'dosage' => $this->dosage,
            'available_pills' => $this->available_pills,
            'frequency' => $this->frequency,
            'refill_risk' => $this->refill_risk,
            'instructions_before' => $this->instructions_before,
            'instructions_after' => $this->instructions_after,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'is_active' => $this->is_active,
            'schedules' => MedicationScheduleResource::collection($this->whenLoaded('medicationSchedules')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
