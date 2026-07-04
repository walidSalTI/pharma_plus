import { apiFetch } from "./apiClient";

export const placeOrder = async (pharmacyId, items, pharmacistNote = null) => {
  const body = { pharmacy_id: pharmacyId, items, pharmacist_note: pharmacistNote };
  console.log("[Order Service] Sending:", JSON.stringify(body, null, 2));
  const response = await apiFetch("/orders/hold", {
    method: "POST",
    body: JSON.stringify(body),
  });
  console.log("[Order Service] Response:", JSON.stringify(response, null, 2));
  return response.data || response;
};
