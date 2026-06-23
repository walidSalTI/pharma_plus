<?php

declare(strict_types=1);

namespace App\Http\Resources\API\V1\Pharmacy;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'pharmacy_id' => $this->pharmacy_id,
            'medication_id' => $this->medication_id,
            'medication' => $this->whenLoaded('medication', fn () => [
                'id' => $this->medication->id,
                'trade_name' => $this->medication->trade_name,
                'barcode' => $this->medication->barcode,
                'form' => $this->medication->form,
                'arabic_form' => $this->medication->arabic_form,
                'image' => $this->medication->image ? asset('storage/'.$this->medication->image) : null,
            ]),
            'price' => (float) $this->price,
            'stock' => $this->stock,
            'min_stock' => $this->min_stock,
            'last_updated' => $this->last_updated,
            'is_low_stock' => $this->stock <= $this->min_stock,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
