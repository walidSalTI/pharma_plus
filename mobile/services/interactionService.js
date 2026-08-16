import { apiFetch } from "./apiClient";

export const RANKS = {
  SAFE: 0,
  CAUTION: 1,
  HIGH: 2,
  ERROR: 3,
};

const BASE = "/patient/search/precheck";

export const checkInteractions = async (medicationNames) => {
  try {
    const response = await apiFetch(BASE, {
      method: "POST",
      body: JSON.stringify({ queries: medicationNames }),
    });
    const data = response?.data || response || {};
    const conflicts = Array.isArray(data.conflicts) ? data.conflicts : [];
    const isSafe = data.is_safe === true && conflicts.length === 0;

    let rank = RANKS.SAFE;
    if (!isSafe && conflicts.length > 0) {
      const maxLevel = Math.max(
        ...conflicts.map((c) => {
          const level = Number(c.risk_level);
          return Number.isFinite(level) ? level : RANKS.CAUTION;
        }),
      );
      rank = maxLevel >= RANKS.HIGH ? RANKS.HIGH : RANKS.CAUTION;
    }

    return {
      rank,
      medications: Array.isArray(medicationNames) ? medicationNames : [],
      conflicts,
      message: response?.message || data.message || "",
      resolved: data.resolved_medications || {},
      isError: false,
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
      resolved: {},
      isError: true,
    };
  }
};

export const deriveInteractionPayload = (queries, searchResults) => {
  const conflicts = [];
  (Array.isArray(searchResults) ? searchResults : []).forEach((pharmacy) => {
    (Array.isArray(pharmacy?.medications) ? pharmacy.medications : []).forEach((med) => {
      if (Array.isArray(med.conflicts)) {
        conflicts.push(...med.conflicts);
      }
    });
  });

  const rank = conflicts.some((c) => Number(c.risk_level) >= RANKS.HIGH)
    ? RANKS.HIGH
    : conflicts.length > 0
      ? RANKS.CAUTION
      : RANKS.ERROR;

  return {
    rank,
    medications: Array.isArray(queries) ? queries : [],
    conflicts,
    message: "",
    resolved: {},
    isError: conflicts.length === 0,
  };
};
