<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActiveIngredientsChronicDisease extends Model
{
    use HasUuids;

    protected $table = 'active_ingredients_chronic_disease';

    public function chronicDisease(): BelongsTo
    {
        return $this->belongsTo(ChronicDisease::class);
    }

    public function activeIngredient(): BelongsTo
    {
        return $this->belongsTo(ActiveIngredient::class);
    }
}
