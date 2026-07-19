// src/stores/auth.js
import { defineStore } from 'pinia'
import { me as fetchMeApi } from '@/services/auth'

const ACCESS_KEY = 'access'
const REFRESH_KEY = 'refresh'
const USERNAME_KEY = 'username'

const getFromStorages = (key) => localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    access: getFromStorages(ACCESS_KEY),
    refresh: getFromStorages(REFRESH_KEY),
    username: getFromStorages(USERNAME_KEY),
    person: null, // { id, name } from /auth/me/ — not persisted, refetched when a token exists
  }),

  getters: {
    isAuthenticated: (s) => !!s.access,
    userInitials: (s) => (s.username ? s.username.slice(0, 2).toUpperCase() : 'U'),
    myPersonId: (s) => s.person?.id ?? null,
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
        localStorage.removeItem(ACCESS_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USERNAME_KEY)
        sessionStorage.removeItem(ACCESS_KEY)
        sessionStorage.removeItem(REFRESH_KEY)
        sessionStorage.removeItem(USERNAME_KEY)
      } catch (e) {
        console.error('Failed to clear storage:', e)
      }

      // Set in chosen storage
      try {
        if (access) storage.setItem(ACCESS_KEY, access)
        if (refresh) storage.setItem(REFRESH_KEY, refresh)
        if (username) storage.setItem(USERNAME_KEY, username)
      } catch (e) {
        console.error('Failed to set storage:', e)
      }
    },

    // Fetch the current user's person (id + name) from /auth/me/.
    // Call after login and once on app boot when a token already exists.
    async fetchMe() {
      if (!this.access) {
        this.person = null
        return null
      }
      try {
        const data = await fetchMeApi()
        this.person = data.person ?? null
        return this.person
      } catch (e) {
        console.error('Failed to fetch me:', e)
        this.person = null
        return null
      }
    },

    logout() {
      this.person = null
      this.setTokens({ access: null, refresh: null, username: null })
    },
  },
})
