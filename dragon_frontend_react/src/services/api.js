import axios from "axios";
import { authStore } from "../stores/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 15000,
});

// Attach Bearer token if present
api.interceptors.request.use((config) => {
  try {
    const { access } = authStore.getState();
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
  } catch (e) {
    /* store not ready in some edge cases */
    console.error("Request interceptor error:", e);
  }
  return config;
});

// Auto-refresh on 401 once
let isRefreshing = false;
let pending = [];

function queueRequest(cb) {
  pending.push(cb);
}

function flushQueue(newToken) {
  pending.forEach((cb) => cb(newToken));
  pending = [];
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refresh, setTokens, logout } = authStore.getState();

      if (!refresh || isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve) => {
          queueRequest((token) => {
            original.headers.Authorization = token
              ? `Bearer ${token}`
              : undefined;
            resolve(api(original));
          });
        });
      }

      try {
        isRefreshing = true;
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE}/auth/token/refresh/`,
          { refresh },
        );
        const newAccess = data.access;
        setTokens({ access: newAccess, refresh });
        isRefreshing = false;
        flushQueue(newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        isRefreshing = false;
        logout();
        flushQueue(null);
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
