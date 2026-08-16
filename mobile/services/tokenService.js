import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const ROLE_KEY = "user_role";
const USER_NAME_KEY = "user_name";

let memoryToken = null;
let memoryRole = null;
let memoryUserName = null;
const memoryCache = {};

export const safeGetItem = async (key) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryCache[key] ?? null;
  }
};

export const safeSetItem = async (key, value) => {
  memoryCache[key] = value;
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    console.warn(`[Token] Failed to persist ${key} to SecureStore`);
  }
};

const safeDeleteItem = async (key) => {
  delete memoryCache[key];
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    console.warn(`[Token] Failed to delete ${key} from SecureStore`);
  }
};

export const setToken = async (newToken) => {
  memoryToken = newToken;
  await safeSetItem(TOKEN_KEY, newToken);
};

export const getStoredToken = async () => {
  if (memoryToken) return memoryToken;
  const stored = await safeGetItem(TOKEN_KEY);
  if (stored) memoryToken = stored;
  return stored;
};

export const clearToken = async () => {
  memoryToken = null;
  await safeDeleteItem(TOKEN_KEY);
};

export const setUserRole = async (role) => {
  memoryRole = role;
  await safeSetItem(ROLE_KEY, role);
};

export const getUserRole = async () => {
  if (memoryRole) return memoryRole;
  const stored = await safeGetItem(ROLE_KEY);
  if (stored) memoryRole = stored;
  return stored;
};

export const clearUserRole = async () => {
  memoryRole = null;
  await safeDeleteItem(ROLE_KEY);
};

export const setUserName = async (name) => {
  memoryUserName = name;
  await safeSetItem(USER_NAME_KEY, name);
};

export const getUserName = async () => {
  if (memoryUserName !== null) return memoryUserName;
  const stored = await safeGetItem(USER_NAME_KEY);
  if (stored !== null && stored !== undefined) memoryUserName = stored;
  return stored;
};

export const clearUserName = async () => {
  memoryUserName = null;
  await safeDeleteItem(USER_NAME_KEY);
};

const PENDING_2FA_TOKEN_KEY = "pending_2fa_token";
const PENDING_2FA_ROLE_KEY = "pending_2fa_role";
const PENDING_VERIFY_EMAIL_KEY = "pending_verify_email";
const PENDING_VERIFY_ROLE_KEY = "pending_verify_role";
const PENDING_RESET_EMAIL_KEY = "pending_reset_email";

export const setPending2FA = async (token, role) => {
  await safeSetItem(PENDING_2FA_TOKEN_KEY, token);
  await safeSetItem(PENDING_2FA_ROLE_KEY, role);
};

export const getPending2FAToken = async () => {
  return safeGetItem(PENDING_2FA_TOKEN_KEY);
};

export const getPending2FARole = async () => {
  return safeGetItem(PENDING_2FA_ROLE_KEY);
};

export const clearPending2FA = async () => {
  await safeDeleteItem(PENDING_2FA_TOKEN_KEY);
  await safeDeleteItem(PENDING_2FA_ROLE_KEY);
};

export const setPendingVerifyEmail = async (email, role) => {
  await safeSetItem(PENDING_VERIFY_EMAIL_KEY, email);
  await safeSetItem(PENDING_VERIFY_ROLE_KEY, role);
};

export const getPendingVerifyEmail = async () => {
  return safeGetItem(PENDING_VERIFY_EMAIL_KEY);
};

export const getPendingVerifyRole = async () => {
  return safeGetItem(PENDING_VERIFY_ROLE_KEY);
};

export const clearPendingVerify = async () => {
  await safeDeleteItem(PENDING_VERIFY_EMAIL_KEY);
  await safeDeleteItem(PENDING_VERIFY_ROLE_KEY);
};

export const setPendingResetEmail = async (email) => {
  await safeSetItem(PENDING_RESET_EMAIL_KEY, email);
};

export const getPendingResetEmail = async () => {
  return safeGetItem(PENDING_RESET_EMAIL_KEY);
};

export const clearPendingResetEmail = async () => {
  await safeDeleteItem(PENDING_RESET_EMAIL_KEY);
};
