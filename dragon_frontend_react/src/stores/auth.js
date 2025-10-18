import { create } from "zustand";

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";
const USERNAME_KEY = "username";

const getFromStorages = (key) =>
  localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null;

export const authStore = create((set, get) => ({
  // --- state
  access: getFromStorages(ACCESS_KEY),
  refresh: getFromStorages(REFRESH_KEY),
  username: getFromStorages(USERNAME_KEY),

  // --- getters
  get isAuthenticated() {
    return !!get().access;
  },

  get userInitials() {
    const username = get().username;
    return username ? username.slice(0, 2).toUpperCase() : 'U';
  },

  // --- actions
  setTokens: ({ access, refresh }, rememberMe = false, username) => {

    // Update in-memory state
    set({
      access: access || null,
      refresh: refresh || null,
      username: username || null,
    });

    const storage = rememberMe ? localStorage : sessionStorage;

    // Clear tokens from BOTH storages first
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USERNAME_KEY);
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(USERNAME_KEY);
    } catch (e) {
      console.error("Failed to clear storage:", e);
    }

    // Write tokens to the chosen storage
    try {
      if (access) storage.setItem(ACCESS_KEY, access);
      if (refresh) storage.setItem(REFRESH_KEY, refresh);
      if (username) storage.setItem(USERNAME_KEY, username);
    } catch (e) {
      console.error("Failed to set storage:", e);
    }
  },

  logout: () => {
    get().setTokens({ access: null, refresh: null }, false, null);
  },
}));

// React hook for use in components
export const useAuthStore = (selector) => {
  if (selector) {
    return authStore(selector);
  }
  return authStore();
};
