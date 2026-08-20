import { generateSync } from "otplib";
import { apiFetch } from "./apiClient";

let cachedSecret = null;

export const getSecretKey = async ({ forceRefresh = false } = {}) => {
  if (cachedSecret && !forceRefresh) return cachedSecret;

  try {
    const data = await apiFetch(`/doctor/qr/secret-key`);
    const secret = data?.data?.secret_key || data?.data?.secret || data?.secret_key || data?.secret || data?.key;
    if (secret) {
      cachedSecret = secret;
      return secret;
    }
  } catch (err) {
    console.warn("[TOTP] Failed to fetch secret key:", err.message);
  }

  return null;
};

export const getTotpPayload = (doctorId, secretKey) => {
  if (!doctorId || !secretKey) return null;
  const code = generateSync({ secret: secretKey });
  return {
    doctor_id: doctorId,
    code,
  };
};

export const clearSecretCache = () => {
  cachedSecret = null;
};
