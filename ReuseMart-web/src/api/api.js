import axios from "axios";

const api = axios.create({
  baseURL: "https://mediumvioletred-newt-905266.hostingersite.com/api",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
