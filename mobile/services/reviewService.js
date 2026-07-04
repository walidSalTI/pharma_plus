import { apiFetch } from "./apiClient";

export const addReview = async (pharmacyId, orderId, rating, availabilityRating, comment) => {
  const response = await apiFetch(`/reviews/${pharmacyId}`, {
    method: "POST",
    body: JSON.stringify({
      order_id: orderId,
      rating: String(rating),
      availability_rating: String(availabilityRating),
      comment,
    }),
  });
  return response.data || response;
};
