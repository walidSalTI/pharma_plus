<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompositionInteraction extends Model
{
    use HasUuids;

    protected $table = 'composition_interactions';

    public function composition(): BelongsTo
    {
        return $this->belongsTo(ActiveIngredient::class, 'composition_id');
    }

    public function interactionComposition(): BelongsTo
    {
        return $this->belongsTo(ActiveIngredient::class, 'interaction_composition_id');
    }
}
