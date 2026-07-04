import { apiFetch } from "./apiClient";

 const BASE = "/diseases";

export const getChronicDiseases = async () => {
  try {
    const response = await apiFetch(`/chronic-diseases`);
    return response.data || response;
  } catch {
    return [];
  }
};

export const getMyDiseases = async () => {
  const response = await apiFetch(BASE);
  return response.data || response;
};

export const addDisease = async (data) => {
  const response = await apiFetch(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data || response;
};

export const deleteDisease = async (recordId) => {
  return apiFetch(`${BASE}/${recordId}`, {
    method: "DELETE",
  });
};
