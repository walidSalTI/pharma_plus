<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\PharmacyInventoryFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PharmacyInventory extends Model
{
    /** @use HasFactory<PharmacyInventoryFactory> */
    use HasFactory, HasUuids;

    protected $table = 'pharmacy_inventories';

    public function pharmacy(): BelongsTo
    {
        return $this->belongsTo(Pharmacy::class);
    }

    public function medication(): BelongsTo
    {
        return $this->belongsTo(Medication::class);
    }
}
