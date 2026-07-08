<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\Admin\AssignProposalRequest;
use App\Http\Resources\API\V1\Specialist\ProposalResource;
use App\Models\MedicationProposal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProposalsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $proposals = MedicationProposal::with('pharmacist.user', 'specialist.user')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
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

    public function assign(AssignProposalRequest $request, MedicationProposal $proposal): JsonResponse
    {
        $proposal->update(['specialist_id' => $request->input('specialist_id')]);

        return response()->json([
            'message' => 'Proposal assigned to specialist.',
            'data' => new ProposalResource($proposal->fresh()->load(['pharmacist.user', 'specialist.user'])),
        ]);
    }

    public function approve(MedicationProposal $proposal): JsonResponse
    {
        if ($proposal->status !== 'pending') {
            return response()->json(['message' => 'Proposal is already processed.'], 422);
        }

        $proposal->update(['status' => 'accepted']);

        return response()->json([
            'message' => 'Proposal approved successfully.',
            'data' => new ProposalResource($proposal->fresh()->load(['pharmacist.user', 'specialist.user'])),
        ]);
    }

    public function reject(Request $request, MedicationProposal $proposal): JsonResponse
    {
        if ($proposal->status !== 'pending') {
            return response()->json(['message' => 'Proposal is already processed.'], 422);
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $proposal->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return response()->json([
            'message' => 'Proposal rejected.',
            'data' => new ProposalResource($proposal->fresh()->load(['pharmacist.user', 'specialist.user'])),
        ]);
    }
}
