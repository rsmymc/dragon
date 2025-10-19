import axios from 'axios'

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
