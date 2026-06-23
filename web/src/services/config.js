import axios from "axios";

export const BaseUrl = "http://192.168.1.6:8000";

const api = axios.create({ baseURL: BaseUrl });

api.interceptors.request.use((config) => {
  let logData = config.data;
  if (config.data instanceof FormData) {
    logData = {};
    for (let [key, value] of config.data.entries()) {
      logData[key] = value instanceof File ? `[File] ${value.name} (${value.type})` : value;
    }
  }
  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, logData);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API] Error:`, error.message);
    return Promise.reject(error);
  }
);

export default api;
