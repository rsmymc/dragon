// src/stores/auth.js
import { create } from 'zustand';

const ACCESS_KEY = 'access';
const REFRESH_KEY = 'refresh';
const USERNAME_KEY = 'username';

// Helper to get from either storage (like Vue version)
const getFromStorages = (key) =>
  localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null;

// Create the store (equivalent to defineStore in Vue)
export const authStore = create((set, get) => ({
  // ========== STATE (same as Vue) ==========
  access: getFromStorages(ACCESS_KEY),
  refresh: getFromStorages(REFRESH_KEY),
  username: getFromStorages(USERNAME_KEY),

  // ========== GETTERS (as functions, NOT ES6 getters) ==========

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!get().access;
  },

  // Get user initials
  userInitials: () => {
    const username = get().username;
    return username ? username.slice(0, 2).toUpperCase() : 'U';
  },

  // ========== ACTIONS (same logic as Vue) ==========

  setTokens: ({ access, refresh }, rememberMe = false, username) => {
    // Update state (like Vue's this.access = ...)
    set({
      access: access || null,
      refresh: refresh || null,
      username: username || null,
    });

    // Choose storage based on rememberMe (EXACT same as Vue)
    const storage = rememberMe ? localStorage : sessionStorage;

    // Clear from both storages first (EXACT same as Vue)
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USERNAME_KEY);
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(USERNAME_KEY);
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }

    // Set in chosen storage (EXACT same as Vue)
    try {
      if (access) storage.setItem(ACCESS_KEY, access);
      if (refresh) storage.setItem(REFRESH_KEY, refresh);
      if (username) storage.setItem(USERNAME_KEY, username);
    } catch (e) {
      console.error('Failed to set storage:', e);
    }
  },

  logout: () => {
    // Just call setTokens with null values
    // setTokens already handles clearing storage
    get().setTokens({ access: null, refresh: null }, false, null);
  },
}));

// ========== HOOK FOR COMPONENTS (same as Vue's useAuthStore()) ==========
export const useAuthStore = (selector) => {
  if (selector) {
    return authStore(selector);
  }
  return authStore();
};
