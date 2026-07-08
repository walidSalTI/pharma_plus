<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1\Specialist;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Specialist\ReviewProposalRequest;
use App\Http\Resources\API\V1\Specialist\ProposalResource;
use App\Models\Medication;
use App\Models\MedicationProposal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProposalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $proposals = MedicationProposal::with('pharmacist.user')
            ->where('status', 'pending')
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => ProposalResource::collection($proposals),
            'meta' => [
                'current_page' => $proposals->currentPage(),
                'last_page' => $proposals->lastPage(),
                'per_page' => $proposals->perPage(),
                'total' => $proposals->total(),
            ],
        ]);
    }

    public function show(MedicationProposal $proposal): JsonResponse
    {
        return response()->json([
            'data' => new ProposalResource($proposal->load(['pharmacist.user', 'specialist.user'])),
        ]);
    }

    public function approve(ReviewProposalRequest $request, MedicationProposal $proposal): JsonResponse
    {
        $request->validated();
        $specialist = $request->user()->specialist;

        if ($proposal->status !== 'pending') {
            return response()->json(['message' => 'Proposal has already been reviewed.'], 422);
        }

        DB::transaction(function () use ($proposal, $specialist): void {
            $proposal->update([
                'status' => 'accepted',
                'specialist_id' => $specialist->id,
            ]);

            Medication::create([
                'trade_name' => $proposal->medication_name,
                'form' => $proposal->form,
                'image' => $proposal->image_url,
            ]);
        });

        return response()->json([
            'message' => 'Proposal approved and medication added to catalog.',
            'data' => new ProposalResource($proposal->fresh()->load(['pharmacist.user', 'specialist.user'])),
        ]);
    }

    public function reject(ReviewProposalRequest $request, MedicationProposal $proposal): JsonResponse
    {
        $specialist = $request->user()->specialist;

        if ($proposal->status !== 'pending') {
            return response()->json(['message' => 'Proposal has already been reviewed.'], 422);
        }

        $proposal->update([
            'status' => 'rejected',
            'specialist_id' => $specialist->id,
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return response()->json([
            'message' => 'Proposal rejected.',
            'data' => new ProposalResource($proposal->fresh()->load(['pharmacist.user', 'specialist.user'])),
        ]);
    }
}
