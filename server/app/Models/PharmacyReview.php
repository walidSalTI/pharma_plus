<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\PharmacyReviewFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PharmacyReview extends Model
{
    /** @use HasFactory<PharmacyReviewFactory> */
    use HasFactory, HasUuids;

    protected $table = 'pharmacy_reviews';

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function medicationOrder(): BelongsTo
    {
        return $this->belongsTo(MedicationOrder::class, 'order_id');
    }
}
