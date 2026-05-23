// ============================================================
// SERVICIO: API — Cliente Axios hacia el backend
// Base URL: http://localhost:3001/api
// ============================================================
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Interceptor de Request ────────────────────────────────
// Adjunta el JWT automáticamente a cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Interceptor de Response ───────────────────────────────
// Si el token expiró o es inválido (401 o 403), limpia y redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      // Evitar bucle infinito si ya estamos en la página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session_expired=true'
      }
    }
    return Promise.reject(error)
  }
)

export default api
