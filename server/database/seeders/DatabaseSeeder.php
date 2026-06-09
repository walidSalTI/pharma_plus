<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ChronicDiseaseSeeder::class,
            ActiveIngredientSeeder::class,
            ManufactureSeeder::class,
            MedicationSeeder::class,
            ActiveIngredientsChronicDiseaseSeeder::class,
            MedicationIngredientSeeder::class,
            CompositionInteractionSeeder::class,
        ]);
    }
}
