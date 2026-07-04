import { api } from "./api";

export const requestsApi = {
  getAll: (pharmacyId, params = {}) =>
    api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/orders`, { params }),

  updateStatus: (pharmacyId, orderId, status) =>
    api("PATCH", `/api/v1/pharmacist/pharmacies/${pharmacyId}/orders/${orderId}/status`, {
      body: { status },
    }),
};