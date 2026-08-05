import { apiFetch } from "./apiClient";

export const searchPharmaciesByMedications = async (queries, latitude, longitude) => {
  const response = await apiFetch("/patient/search", {
    method: "POST",
    body: JSON.stringify({ queries, latitude, longitude }),
  });
  return response.data || response;
};
