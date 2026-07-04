import { apiFetch } from "./apiClient";
import { setToken } from "./tokenService";

// const BASE = "/patient";

export const registerUser = async (userData) => {
  const data = await apiFetch(`/register`, {
    method: "POST",
    body: JSON.stringify(userData),
  });
  if (data.data?.token) {
    setToken(data.data.token);
  }
  return data;
};

export const loginUser = async (email, password) => {
  const data = await apiFetch(`/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.data?.token) {
    setToken(data.data.token);
  }
  return data;
};

export const logoutUser = async () => {
  const { clearToken } = await import("./tokenService");
  try {
    await apiFetch(`/logout`, { method: "POST" });
  } finally {
    clearToken();
  }
};
