export const BaseUrl = import.meta.env.VITE_API_URL || "http://10.193.211.133:8000";

function log(method, path, opts, response, durationMs) {
  const { body, params } = opts || {};
  const isFormData = body instanceof FormData;
  const groupLabel = `${method} ${path}`;
  console.group(`%c${groupLabel}`, 'font-weight:bold;color:#0b6a6a');
  console.log('Duration:', `${durationMs}ms`);
  if (params) console.log('Params:', params);
  console.log('Body:', isFormData ? '(FormData)' : body);
  if (response) {
    console.log('Status:', response.status);
    console.log('Response:', response.data);
  }
  console.groupEnd();
}

export async function api(method, path, opts = {}) {
  const { body, params } = opts;
  const start = performance.now();

  const url = new URL(BaseUrl + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }

  const headers = {};
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = "Bearer " + token;

  const isFormData = body instanceof FormData;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const payload = body ? (isFormData ? body : JSON.stringify(body)) : undefined;

  try {
    const res = await fetch(url, { method, headers, body: payload });
    const data = await res.json();
    log(method, path, opts, { status: res.status, data }, Math.round(performance.now() - start));
    if (!res.ok) {
      const err = new Error(data?.message || "Request failed");
      err.response = { data, status: res.status };
      throw err;
    }
    return data;
  } catch (err) {
    if (!err.response) {
      log(method, path, opts, { status: 0, data: err.message }, Math.round(performance.now() - start));
    }
    throw err;
  }
}
