<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Pharmacy;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'medication_id' => ['required', 'string', 'exists:medications,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'min_stock' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'medication_id' => ['description' => 'UUID of the medication from the central catalog'],
            'price' => ['description' => 'Retail selling price'],
            'stock' => ['description' => 'Current stock quantity'],
            'min_stock' => ['description' => 'Minimum stock threshold for reorder alerts'],
        ];
    }
}
