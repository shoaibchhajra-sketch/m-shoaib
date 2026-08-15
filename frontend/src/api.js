// api.js
// Thin wrapper around axios that automatically attaches the saved
// JWT token (if any) to every request, and points at the backend.
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("booking_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
