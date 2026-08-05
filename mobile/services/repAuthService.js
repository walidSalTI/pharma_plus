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

export const loginRep = async (email, password) => {
  const data = await apiFetch(`/rep/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data;
};

export const verifyRep2FA = async (twoFactorToken, code) => {
  const data = await apiFetch(`/rep/two-factor/verify`, {
    method: "POST",
    body: JSON.stringify({ two_factor_token: twoFactorToken, code }),
  });
  if (data.data?.token) {
    await safeSetToken(data.data.token);
    await safeSetUserRole("rep");
  }
  return data;
};

export const get2FAStatus = async () => {
  return apiFetch(`/rep/two-factor/status`);
};

export const enable2FA = async () => {
  return apiFetch(`/rep/two-factor/enable`, {
    method: "POST",
  });
};

export const confirm2FA = async (code) => {
  return apiFetch(`/rep/two-factor/confirm`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
};

export const disable2FA = async (password, code) => {
  return apiFetch(`/rep/two-factor/disable`, {
    method: "POST",
    body: JSON.stringify({ password, code }),
  });
};

export const getRecoveryCodes = async () => {
  return apiFetch(`/rep/two-factor/recovery-codes`);
};

export const logoutRep = async () => {
  try {
    await apiFetch(`/rep/logout`, { method: "POST" });
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
