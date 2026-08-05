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

export const registerDoctor = async (formData) => {
  const data = await apiFetch(`/doctor/register`, {
    method: "POST",
    body: formData,
  });
  if (data.data?.token) {
    await safeSetToken(data.data.token);
    await safeSetUserRole("doctor");
  }
  return data;
};

export const loginDoctor = async (email, password) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  const data = await apiFetch(`/doctor/login`, {
    method: "POST",
    body: formData,
  });
  return data;
};

export const verifyDoctor2FA = async (twoFactorToken, code) => {
  const data = await apiFetch(`/doctor/two-factor/verify`, {
    method: "POST",
    body: JSON.stringify({ two_factor_token: twoFactorToken, code }),
  });
  if (data.data?.token) {
    await safeSetToken(data.data.token);
    await safeSetUserRole("doctor");
  }
  return data;
};

export const get2FAStatus = async () => {
  return apiFetch(`/doctor/two-factor/status`);
};

export const enable2FA = async () => {
  return apiFetch(`/doctor/two-factor/enable`, {
    method: "POST",
  });
};

export const confirm2FA = async (code) => {
  return apiFetch(`/doctor/two-factor/confirm`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
};

export const disable2FA = async (password, code) => {
  return apiFetch(`/doctor/two-factor/disable`, {
    method: "POST",
    body: JSON.stringify({ password, code }),
  });
};

export const getRecoveryCodes = async () => {
  return apiFetch(`/doctor/two-factor/recovery-codes`);
};

export const logoutDoctor = async () => {
  try {
    await apiFetch(`/doctor/logout`, { method: "POST" });
  } finally {
    await safeClearToken();
    await safeClearUserRole();
  }
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
