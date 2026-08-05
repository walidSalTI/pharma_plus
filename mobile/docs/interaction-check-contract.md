# Drug Interactions & Chronic Diseases Checking — API Contract

## Purpose
Before a patient adds medications to their schedule (BrowseMedications → AddMedication),
the mobile app asks the backend to check the selected medication names for
drug–drug interactions. This is an **advisory** check: a warning never hard-blocks
the patient — Rank 0 proceeds silently, Rank 1/2 opens a warning modal, and a
network failure fails open.

## Endpoint
`POST /api/v1/interactions/check`

## Request
```json
{
  "medications": ["Panadol", "Aspirin"]
}
```

`medications` is an array of the selected medications' `trade_name` values.

## Response
```json
{
  "rank": 0,
  "conflicts": [
    {
      "medication_a": "Aspirin",
      "medication_b": "Warfarin",
      "description": "Increased bleeding risk when used together."
    }
  ],
  "message": ""
}
```

| Field      | Type   | Description                                                                 |
|------------|--------|-----------------------------------------------------------------------------|
| `rank`     | number | `0` safe, `1` caution, `2` high risk.                                       |
| `conflicts`| array  | Optional detailed conflict pairs. When present with no explicit `rank`, the app derives Rank 1. |
| `message`  | string | Optional human-readable summary shown in the modal.                         |

## Behaviour on the client
- `rank === 0` → proceed to the dosage screen silently.
- `rank >= 1` → show `InteractionAlertModal`; the patient may Cancel (abort) or
  Proceed (continue at their own risk for high risk).
- Backend unavailable / network failure → treated as `rank 0` (fail open) so the
  patient flow is never blocked.
