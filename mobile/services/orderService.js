import { apiFetch } from "./apiClient";

export const placeOrder = async (pharmacyId, items, pharmacistNote = null) => {
  const body = { pharmacy_id: pharmacyId, items };
  if (typeof pharmacistNote === "string" && pharmacistNote.trim() !== "") {
    body.pharmacist_note = pharmacistNote;
  }
  const response = await apiFetch("/patient/orders/hold", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return response.data || response;
};

export const getOrderStatus = async (orderId) => {
  const response = await apiFetch(`/patient/orders/${orderId}`);
  return response.data || response;
};
