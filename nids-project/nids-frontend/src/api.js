import axios from "axios";

export const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

// Create a shared axios client so we have consistent baseURL, timeout and can
// add interceptors later if needed.
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 7000,
});

export const getAlerts = async () => {
  const res = await apiClient.get(`/api/alerts`);
  return res.data;
};

export const getHealth = async () => {
  const res = await apiClient.get(`/api/health`);
  return res.data;
};

export const predict = async (payload) => {
  const res = await apiClient.post(`/api/predict`, payload);
  return res.data;
};

const api = {
  API_BASE,
  apiClient,
  getAlerts,
  getHealth,
  predict,
};

export default api;
