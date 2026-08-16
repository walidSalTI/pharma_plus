import { apiFetch } from "./apiClient";

const BASE = "/patient/diseases";

export const getChronicDiseases = async () => {
  try {
    const response = await apiFetch(`/chronic-diseases`);
    return response.data || response;
  } catch {
    return [];
  }
};

export const getMyDiseases = async () => {
  try {
    const response = await apiFetch(BASE);
    return response.data || response;
  } catch {
    return [];
  }
};

export const addDisease = async (data) => {
  try {
    const response = await apiFetch("/patient/diseases", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data || response;
  } catch {
    return null;
  }
};

export const updateDisease = async (recordId, data) => {
  try {
    const response = await apiFetch(`${BASE}/${recordId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data || response;
  } catch {
    return null;
  }
};

export const deleteDisease = async (recordId) => {
  try {
    return await apiFetch(`${BASE}/${recordId}`, {
      method: "DELETE",
    });
  } catch {
    return null;
  }
};
