import api from "./config";

export const authApi = {
  async register(data) {
    const response = await api.post("/register", data);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post("/login", credentials);
    return response.data;
  },
};
