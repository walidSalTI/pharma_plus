import { getStoredToken } from "./tokenService";

const API_BASE_URL = "http://10.193.211.133:8000/api/v1";

// تحديد وقت الانتظار بـ 15 ثانية ليتحمل بطء شبكة الـ VPN والـ Ping المرتفع
const TIMEOUT_MS = 55000; 

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

  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = await getStoredToken();
  console.log("[API] Token:", token);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log(`[API] ${method} ${url}`, { headers, body: options.body || null });

  // إعداد الـ AbortController للتحكم بالـ Timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const { headers: optHeaders, ...fetchOptions } = options;
    const response = await fetch(url, {
      headers: { ...headers, ...optHeaders },
      ...fetchOptions,
      signal: controller.signal, // ربط الإشارة بالطلب
    });

    // إلغاء التوقيت بمجرد وصول الرد بنجاح
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(
        errorBody || `Request failed with status ${response.status}`,
      );
      error.status = response.status;
      throw error;
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId); // إلغاء التوقيت في حال حدوث خطأ سريع

    if (err.name === 'AbortError') {
      console.warn(`[API] Request timed out after ${TIMEOUT_MS}ms due to slow network.`);
    } else if (err.status) {
      throw err;
    }

    console.warn(`[API] Network error (offline mode): ${method} ${url}`);
    return method === "GET" ? { data: [] } : { data: {} };
  }
};

export default apiFetch;

export { API_BASE_URL, apiFetch };