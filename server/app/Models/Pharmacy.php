<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pharmacy extends Model
{
    use HasUuids;

    protected $table = 'pharmacies';

    public function pharmacyOperatingHours(): HasMany
    {
        return $this->hasMany(PharmacyOperatingHour::class);
    }

    public function pharmacyInventories(): HasMany
    {
        return $this->hasMany(PharmacyInventory::class);
    }

    public function medicationOrders(): HasMany
    {
        return $this->hasMany(MedicationOrder::class);
    }

    public function pharmacyReviews(): HasMany
    {
        return $this->hasMany(PharmacyReview::class);
    }
}
