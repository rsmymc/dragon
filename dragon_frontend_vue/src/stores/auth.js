import { defineStore } from 'pinia'

const ACCESS_KEY = 'access'
const REFRESH_KEY = 'refresh'
const USERNAME_KEY = 'username'

const getFromStorages = (key) =>
  localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    access: getFromStorages(ACCESS_KEY),
    refresh: getFromStorages(REFRESH_KEY),
    username: getFromStorages(USERNAME_KEY),
  }),

  getters: {
    isAuthenticated: (s) => !!s.access,
    userInitials: (s) => (s.username ? s.username.slice(0, 2).toUpperCase() : 'U'),
  },

  actions: {
    setTokens({ access, refresh }, rememberMe = false, username) {
      this.access = access || null
      this.refresh = refresh || null
      this.username = username || null

      // Choose storage based on rememberMe
      const storage = rememberMe ? localStorage : sessionStorage

      // Clear from both storages first
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

      // Set in chosen storage
      try {
        if (access) storage.setItem(ACCESS_KEY, access);
        if (refresh) storage.setItem(REFRESH_KEY, refresh);
        if (username) storage.setItem(USERNAME_KEY, username);
      } catch (e) {
        console.error("Failed to set storage:", e);
      }
    },

    logout() {
      this.setTokens({ access: null, refresh: null, username: null })
    },
  },
})
