<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1\Admin;

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
            'image' => $this->image,
            'manufacture' => $this->whenLoaded('manufacture', fn () => [
                'id' => $this->manufacture->id,
                'name' => $this->manufacture->name,
            ]),
            'active_ingredients' => $this->whenLoaded('activeIngredients', fn () => $this->activeIngredients->map(fn ($ingredient) => [
                'id' => $ingredient->id,
                'name' => $ingredient->ingredient_name_en,
                'ratio' => $ingredient->pivot->active_ratio,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
