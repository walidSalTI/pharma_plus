<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Doctor extends Model
{
    use HasUuids;

    protected $table = 'doctors';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function doctorAssignments(): HasMany
    {
        return $this->hasMany(DoctorAssignment::class);
    }

    public function weeklySchedules(): HasMany
    {
        return $this->hasMany(WeeklySchedule::class);
    }

    public function representativeVisits(): HasMany
    {
        return $this->hasMany(RepresentativeVisit::class);
    }
}
