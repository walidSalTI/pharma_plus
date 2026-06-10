<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ActiveIngredient extends Model
{
    use HasUuids;

    protected $table = 'active_ingredients';

    public function chronicDiseases(): BelongsToMany
    {
        return $this->belongsToMany(ChronicDisease::class, 'active_ingredients_chronic_disease', 'active_ingredient_id', 'chronic_code');
    }

    public function medications(): BelongsToMany
    {
        return $this->belongsToMany(Medication::class, 'medication_ingredients');
    }
}
