import axios from 'axios'
import api from '@/services/api.js'

export async function login(username, password) {
  // Use a plain axios call to avoid interceptors on the auth endpoint
  const { data } = await axios.post(
    `${import.meta.env.VITE_API_BASE}/auth/token/`,
    { username, password },
    { timeout: 15000 },
  )
  // data = { access, refresh }
  return data
}

export async function register(payload) {
  // payload: { username, password, name, email?, phone? }
  const { data } = await axios.post(`${import.meta.env.VITE_API_BASE}/auth/register/`, payload, {
    timeout: 15000,
  })
  // data = { access, refresh, user, person }
  return data
}

export async function me() {
  // Goes through the configured api instance — interceptor attaches the
  // Bearer token and handles 401 refresh automatically.
  const { data } = await api.get('/auth/me/')
  // data = { id, username, email, is_staff, is_superuser, person: { id, name } | null }
  return data
}
