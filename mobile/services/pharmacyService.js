import { apiFetch } from "./apiClient";

export const getPharmacies = async (search = "") => {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await apiFetch(`/pharmacist/pharmacies/search${params}`);
  return response.data || response;
};

export const getPharmacyById = async (id) => {
  const response = await apiFetch(`/pharmacist/pharmacies/${id}`);
  return response.data || response;
};
