import { apiFetch } from "./apiClient";

export const getRepDashboard = async () => {
  return apiFetch(`/rep/dashboard`);
};

export const getRepSchedules = async (page = 1) => {
  return apiFetch(`/rep/schedules?page=${page}`);
};

export const getRepScheduleDetail = async (id) => {
  return apiFetch(`/rep/schedules/${id}`);
};

export const checkInVisit = async ({ doctor_id, code, latitude, longitude, schedule_id }) => {
  return apiFetch(`/rep/visits/check-in`, {
    method: "POST",
    body: JSON.stringify({ doctor_id, code, latitude, longitude, schedule_id }),
  });
};

export const getRepVisits = async (page = 1) => {
  return apiFetch(`/rep/visits?page=${page}`);
};

export const getRepVisitDetail = async (id) => {
  return apiFetch(`/rep/visits/${id}`);
};

export const updateVisitNotes = async (id, notes) => {
  const formData = new FormData();
  formData.append("notes", notes);
  return apiFetch(`/rep/visits/${id}/notes`, {
    method: "PUT",
    body: formData,
  });
};

export const getRepStats = async () => {
  return apiFetch(`/rep/visits/stats`);
};
