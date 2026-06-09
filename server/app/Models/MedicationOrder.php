<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MedicationOrder extends Model
{
    use HasUuids;

    protected $table = 'medication_orders';

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function pharmacyReview(): HasOne
    {
        return $this->hasOne(PharmacyReview::class, 'order_id');
    }
}
