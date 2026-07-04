import { apiFetch } from "./apiClient";

const BASE = "/wallet";

export const getWallet = async () => {
  const response = await apiFetch(BASE);
  return response.data || response;
};

export const addToWallet = async (data) => {
  const response = await apiFetch(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.data || response;
};

export const updateWalletItem = async (id, data) => {
  const response = await apiFetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.data || response;
};

export const toggleWalletItem = async (id, isActive) => {
  const response = await apiFetch(`${BASE}/${id}/toggle`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ is_active: isActive }),
  });
  return response.data || response;
};

export const updatePills = async (id, availablePills) => {
  const response = await apiFetch(`${BASE}/${id}/pills`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ available_pills: availablePills }),
  });
  return response.data || response;
};

export const deleteWalletItem = async (id) => {
  return apiFetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: {
      "Accept": "application/json",
    },
  });
};