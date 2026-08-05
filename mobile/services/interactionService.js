import { apiFetch } from "./apiClient";

export const RANKS = {
  SAFE: 0,
  CAUTION: 1,
  HIGH: 2,
  ERROR: 3,
};

const BASE = "/interactions/check";

export const checkInteractions = async (medicationNames) => {
  try {
    const response = await apiFetch(BASE, {
      method: "POST",
      body: JSON.stringify({ medications: medicationNames }),
    });
    const data = response?.data || response || {};
    const conflicts = Array.isArray(data.conflicts) ? data.conflicts : [];
    return {
      rank: Number(data.rank) || (conflicts.length > 0 ? RANKS.CAUTION : RANKS.SAFE),
      medications: Array.isArray(medicationNames) ? medicationNames : [],
      conflicts,
      message: data.message || "",
    };
  } catch {
    // Fail closed: if the safety check cannot be performed, do not treat the
    // combination as safe. The caller must surface an explicit warning and the
    // user can only proceed at their own risk.
    return {
      rank: RANKS.ERROR,
      medications: Array.isArray(medicationNames) ? medicationNames : [],
      conflicts: [],
      message: "",
      isError: true,
    };
  }
};
