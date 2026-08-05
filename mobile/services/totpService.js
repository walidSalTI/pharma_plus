import { apiFetch } from "./apiClient";
import { safeGetItem, safeSetItem } from "./tokenService";

const SECRET_KEY_CACHE = "doctor_secret_key";

let cachedSecret = null;

export const getSecretKey = async () => {
  if (cachedSecret) return cachedSecret;

  try {
    const stored = await safeGetItem(SECRET_KEY_CACHE);
    if (stored) {
      cachedSecret = stored;
      return stored;
    }
  } catch {
    console.warn("[TOTP] Failed to read cached secret key");
  }

  try {
    const data = await apiFetch(`/doctor/qr/secret-key`);
    const secret = data?.data?.secret_key || data?.data?.secret || data?.secret_key || data?.secret || data?.key;
    if (secret) {
      cachedSecret = secret;
      await safeSetItem(SECRET_KEY_CACHE, secret);
      return secret;
    }
  } catch (err) {
    console.warn("[TOTP] Failed to fetch secret key:", err.message);
  }

  return null;
};

export const getTotpPayload = (doctorId, secretKey) => {
  if (!doctorId || !secretKey) return null;
  return {
    doctor_id: doctorId,
    secret_key: secretKey,
  };
};

export const clearSecretCache = () => {
  cachedSecret = null;
};
