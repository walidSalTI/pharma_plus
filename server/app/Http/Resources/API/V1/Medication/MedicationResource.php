<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1\Medication;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'trade_name' => $this->trade_name,
            'barcode' => $this->barcode,
            'form' => $this->form,
            'arabic_form' => $this->arabic_form,
            'image' => $this->image ? asset('storage/'.$this->image) : null,
            'manufacture' => $this->whenLoaded('manufacture', fn () => [
                'id' => $this->manufacture->id,
                'name' => $this->manufacture->name,
            ]),
            'active_ingredients' => $this->whenLoaded(
                'medicationIngredients',
                fn () => $this->medicationIngredients
                    ->groupBy('active_ingredient_id')
                    ->map(fn ($group) => [
                        'id' => $group->first()->activeIngredient->id,
                        'ingredient_name_en' => $group->first()->activeIngredient->ingredient_name_en,
                        'active_ratio' => $group->pluck('active_ratio')->filter()->values()->toArray(),
                    ])
                    ->values()
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
