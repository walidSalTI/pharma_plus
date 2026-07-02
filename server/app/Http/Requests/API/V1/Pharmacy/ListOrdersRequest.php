<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Pharmacy;

use Illuminate\Foundation\Http\FormRequest;

class ListOrdersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->pharmacist !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string', 'in:pending,confirmed,ready,completed,cancelled'],
            'date_from' => ['nullable', 'date', 'before_or_equal:date_to'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
