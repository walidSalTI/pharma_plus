import { apiFetch } from "./apiClient";

// export const FORM_LABELS = {
//   tab: "Tablet",
//   cap: "Capsule",
//   syrup: "Syrup",
//   vial: "Vial",
//   "eye-drops": "Eye Drops",
//   "eye-oint": "Eye Ointment",
//   "coated-tab": "Coated Tablet",
//   Tablet: "Tablet",
//   Capsule: "Capsule",
//   Inhaler: "Inhaler",
// };

// export const getMedications = async () => {
//   const response = await apiFetch("/medications");
//   return response.data || response;
// };

export const searchMedications = async (name) => {
  const response = await apiFetch(`/medications?name=${encodeURIComponent(name)}`);
  return response.data || response;
};

export const getMedicationsPage = async (params = {}) => {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")),
  ).toString();
  const response = await apiFetch(`/medications${query ? `?${query}` : ""}`);
  return { data: response.data || [], meta: response.meta || null };
};
