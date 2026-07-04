import { api } from "./api";

export const stockApi = {
  fetchInventory: (pharmacyId, page = 1) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory`, { params: { page } }),
  fetchLowStock: (pharmacyId) => api("GET", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/low-stock`),
  addItem: (pharmacyId, data) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory`, { body: data }),
  bulkAddItems: (pharmacyId, items) => api("POST", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory`, { body: { items } }),
  updateItem: (pharmacyId, itemId, data) => api("PUT", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/${itemId}`, { body: data }),
  deleteItem: (pharmacyId, itemId) => api("DELETE", `/api/v1/pharmacist/pharmacies/${pharmacyId}/inventory/${itemId}`),
};
