<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Medication;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Medication>
 */
class MedicationFactory extends Factory
{
    protected $model = Medication::class;

    public function definition(): array
    {
        return [
            'trade_name' => fake()->unique()->bothify('Med-####'),
            'barcode' => fake()->unique()->ean13(),
            'form' => fake()->randomElement(['tablet', 'capsule', 'syrup', 'injection', 'cream']),
            'arabic_form' => null,
            'image' => null,
        ];
    }
}
