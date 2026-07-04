import { api } from "./api";

export const medicationApi = {
  fetchAll: (params = {}) => api("GET", "/api/v1/medications", { params }),
};
