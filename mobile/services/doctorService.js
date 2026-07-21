import { apiFetch } from "./apiClient";

const BASE = "/doctor";

export const getDoctorProfile = async () => {
  const data = await apiFetch(`${BASE}/profile`);
  return data?.data || data;
};

export const updateDoctorProfile = async (profileData) => {
  const data = await apiFetch(`${BASE}/profile`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
  return data;
};

export const getDoctorWorkplaces = async () => {
  const data = await apiFetch(`${BASE}/workplaces`);
  return data?.data || data;
};

export const addWorkplace = async (workplaceData) => {
  const data = await apiFetch(`${BASE}/workplaces`, {
    method: "POST",
    body: JSON.stringify(workplaceData),
  });
  return data;
};

export const updateWorkplace = async (workplaceId, workplaceData) => {
  const data = await apiFetch(`${BASE}/workplaces/${workplaceId}`, {
    method: "PUT",
    body: JSON.stringify(workplaceData),
  });
  return data;
};

export const deleteWorkplace = async (workplaceId) => {
  const data = await apiFetch(`${BASE}/workplaces/${workplaceId}`, {
    method: "DELETE",
  });
  return data;
};
