import { apiFetch } from "./apiClient";

const BASE = "/patient/profile";

export const getProfile = async () => {
  const response = await apiFetch(BASE);
  return response.data || response;
};

export const updateProfile = async (data) => {
  const response = await apiFetch(BASE, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.data || response;
};

export const deleteAccount = async () => {
  return apiFetch(BASE, { method: "DELETE" });
};
