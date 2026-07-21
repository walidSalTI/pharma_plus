import { apiFetch } from "./apiClient";
import { setToken, setUserRole, clearToken, clearUserRole } from "./tokenService";

export const registerDoctor = async (formData) => {
  const data = await apiFetch(`/doctor/register`, {
    method: "POST",
    body: formData,
  });
  if (data.data?.token) {
    setToken(data.data.token);
    setUserRole("doctor");
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
    setToken(data.data.token);
    setUserRole("doctor");
  }
  return data;
};

export const logoutDoctor = async () => {
  try {
    await apiFetch(`/doctor/logout`, { method: "POST" });
  } finally {
    clearToken();
    clearUserRole();
  }
};
