import axios from "axios";
import {
  shouldRetry,
  getRetryDelay,
  showErrorToast
} from "./errorHandler";

export const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

// Create a shared axios client with enhanced error handling and retry logic
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 7000,
  headers: {
    "Content-Type": "application/json",
  }
});

// Request interceptor for logging and request metadata
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp for debugging retries
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for retries and error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    
    // If there's no config, this is not a request error
    if (!config) {
      showErrorToast(error);
      return Promise.reject(error);
    }

    // Initialize or increment retry count
    config.retryCount = config.retryCount || 0;

    // Check if we should retry
    if (shouldRetry(error) && config.retryCount < 3) {
      config.retryCount += 1;

      // Add exponential backoff delay
      const delay = getRetryDelay(config.retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Only show toast for non-health check endpoints
      if (!config.url.includes("/health")) {
        showErrorToast(error, { hideToast: config.retryCount < 3 });
      }

      return apiClient(config);
    }

    // If we're here, we've exhausted retries or shouldn't retry
    showErrorToast(error);
    return Promise.reject(error);
  }
);

// API endpoint wrappers with enhanced error handling
export const getAlerts = async () => {
  try {
    const res = await apiClient.get(`/api/alerts`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    throw error;
  }
};

export const getHealth = async () => {
  try {
    const res = await apiClient.get(`/api/health`);
    return res.data;
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
};

export const predict = async (payload) => {
  try {
    const res = await apiClient.post(`/api/predict`, payload);
    return res.data;
  } catch (error) {
    console.error("Prediction failed:", error);
    throw error;
  }
};

export const getSystemStats = async () => {
  try {
    const res = await apiClient.get(`/api/system`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch system stats:", error);
    throw error;
  }
};

const api = {
  API_BASE,
  apiClient,
  getAlerts,
  getHealth,
  predict,
  getSystemStats,
};

export default api;