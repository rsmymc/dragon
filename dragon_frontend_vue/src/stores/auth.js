// src/stores/auth.js
import { defineStore } from "pinia";

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";
const USERNAME_KEY = "username";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    access: localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY) || null,
    refresh: localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY) || null,
    username: localStorage.getItem(USERNAME_KEY) || sessionStorage.getItem(USERNAME_KEY) || null,
  }),

  getters: {
    isAuthenticated: (s) => !!s.access,
    userInitials: (s) => s.username ? s.username.slice(0, 2).toUpperCase() : 'U'
  },

  actions: {
    setTokens({ access, refresh }, rememberMe = false, username) {
      this.access = access || null;
      this.refresh = refresh || null;
      this.username = username || null;

      // Choose storage based on rememberMe
      const storage = rememberMe ? localStorage : sessionStorage;

      // Clear from both storages first
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(REFRESH_KEY);

      // Set in chosen storage
      if (access) storage.setItem(ACCESS_KEY, access);
      if (refresh) storage.setItem(REFRESH_KEY, refresh);

      storage.setItem(USERNAME_KEY, username);
    },

    logout() {
      this.setTokens({ access: null, refresh: null, username: null });
    },
  },
});
