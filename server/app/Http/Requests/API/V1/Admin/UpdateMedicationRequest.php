<?php

declare(strict_types=1);

namespace App\Http\Requests\API\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $medicationId = $this->route('medication')?->id;

        return [
            'trade_name' => ['sometimes', 'string', 'max:255'],
            'barcode' => ['nullable', 'string', 'max:255', 'unique:medications,barcode,'.$medicationId],
            'manufacture_id' => ['nullable', 'string', 'exists:manufactures,id'],
            'form' => ['nullable', 'string', 'max:255'],
            'arabic_form' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string', 'max:255'],
        ];
    }
}
