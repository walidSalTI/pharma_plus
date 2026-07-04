import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

let memoryToken = null;

export const setToken = async (newToken) => {
  memoryToken = newToken;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
  } catch {
    console.warn("[Token] Failed to persist token to SecureStore");
  }
};

export const getStoredToken = async () => {
  if (memoryToken) return memoryToken;
  try {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (stored) {
      memoryToken = stored;
    }
    return stored;
  } catch {
    return memoryToken;
  }
};

export const clearToken = async () => {
  memoryToken = null;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    console.warn("[Token] Failed to clear token from SecureStore");
  }
};
