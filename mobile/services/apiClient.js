import { getStoredToken, clearToken } from "./tokenService";
import { emitUnauthorized } from "./authEvents";

const API_BASE_URL = "https://pharmaplus.tech/api/v1";

const TIMEOUT_MS = 15000; 

const isValidApiUrl = () => {
  return API_BASE_URL && !API_BASE_URL.includes("YOUR_API_URL");
};

const apiFetch = async (path, options = {}) => {
  if (!isValidApiUrl()) {
    throw new Error(
      "API_BASE_URL not configured. Set a valid backend URL in services/apiClient.js",
    );
  }

  const url = `${API_BASE_URL}${path}`;
  const method = options.method || "GET";

  const isFormData = options.body instanceof FormData;
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  const token = await getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (__DEV__) {
    const logHeaders = { ...headers };
    if (logHeaders["Authorization"]) {
      logHeaders["Authorization"] = "Bearer ***";
    }
    console.log("[API] REQUEST", method, url);
    console.log("[API] HEADERS", logHeaders);
    if (options.body && !isFormData) {
      console.log(
        "[API] BODY",
        typeof options.body === "string" ? options.body : JSON.stringify(options.body, null, 2),
      );
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const { headers: optHeaders, ...fetchOptions } = options;
    const response = await fetch(url, {
      headers: { ...headers, ...optHeaders },
      ...fetchOptions,
      signal: controller.signal, 
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      if (__DEV__) {
        console.log("[API] ERROR", method, url, "->", response.status, errorBody);
      }
      const error = new Error(
        errorBody || `Request failed with status ${response.status}`,
      );
      error.status = response.status;
      try {
        error.data = JSON.parse(errorBody);
      } catch {
        error.data = null;
      }
      throw error;
    }

    const data = await response.json();

    if (__DEV__) {
      console.log("[API] RESPONSE", method, url, "->", response.status, data);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (__DEV__) {
      console.log("[API] FAILED", method, url, "->", err?.message || err);
    }

    if (err.name === "AbortError") {
      throw new Error("Request timed out. Check your connection and try again.");
    }

    if (err.status === 401) {
      await clearToken();
      emitUnauthorized();
    }
    throw err;
  }
};

export default apiFetch;

export { API_BASE_URL, apiFetch };