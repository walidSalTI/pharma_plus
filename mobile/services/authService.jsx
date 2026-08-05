import { apiFetch } from "./apiClient";
import { setToken, setUserRole, clearToken, clearUserRole } from "./tokenService";

const safeSetToken = async (token) => {
  try { await setToken(token); } catch {}
};
const safeSetUserRole = async (role) => {
  try { await setUserRole(role); } catch {}
};
const safeClearToken = async () => {
  try { await clearToken(); } catch {}
};
const safeClearUserRole = async () => {
  try { await clearUserRole(); } catch {}
};

export const registerUser = async (userData) => {
  const data = await apiFetch(`/patient/register`, {
    method: "POST",
    body: JSON.stringify(userData),
  });
  if (data.data?.token) {
    await safeSetToken(data.data.token);
    await safeSetUserRole("patient");
  }
  return data;
};

export const loginUser = async (email, password) => {
  const data = await apiFetch(`/patient/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.data?.token) {
    await safeSetToken(data.data.token);
    await safeSetUserRole("patient");
  }
  return data;
};

export const logoutUser = async () => {
  try {
    await apiFetch(`/patient/logout`, { method: "POST" });
  } finally {
    await safeClearToken();
    await safeClearUserRole();
  }
};

export const forgotPassword = async (email) => {
  return apiFetch(`/patient/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = async (email, code, password, password_confirmation) => {
  return apiFetch(`/patient/reset-password`, {
    method: "POST",
    body: JSON.stringify({ email, code, password, password_confirmation }),
  });
};

export const sendVerificationEmail = async (email) => {
  return apiFetch(`/auth/send-verification-email`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const verifyEmailCode = async (email, token) => {
  return apiFetch(`/auth/verify-email`, {
    method: "POST",
    body: JSON.stringify({ email, token }),
  });
};
