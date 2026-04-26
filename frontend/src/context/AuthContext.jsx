import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// Derivar iniciales del nombre completo
function getIniciales(nombreCompleto = '') {
  const partes = nombreCompleto.trim().split(' ').filter(Boolean)
  if (partes.length === 0) return 'U'
  if (partes.length === 1) return partes[0][0].toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)  // mientras verifica el token guardado

  // Al cargar la app, verificar si hay un token guardado en localStorage
  useEffect(() => {
    const token   = localStorage.getItem('token')
    const usuario = localStorage.getItem('usuario')

    if (token && usuario) {
      try {
        const parsed = JSON.parse(usuario)
        setUser({ ...parsed, iniciales: getIniciales(parsed.nombre_completo) })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
      }
    }
    setLoading(false)
  }, [])

  // ── LOGIN: llama al backend real ──────────────────────────
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })

      if (data.ok) {
        const userData = {
          ...data.usuario,
          iniciales: getIniciales(data.usuario.nombre_completo),
          // El nombre siempre en MAYÚSCULAS (tal como viene del backend)
          nombre_completo: data.usuario.nombre_completo.toUpperCase(),
        }

        // Guardar token y usuario en localStorage
        localStorage.setItem('token',   data.token)
        localStorage.setItem('usuario', JSON.stringify(userData))
        setUser(userData)

        return { success: true }
      }

      return { success: false, message: data.mensaje || 'Error al iniciar sesión.' }
    } catch (error) {
      const mensaje =
        error.response?.data?.mensaje ||
        error.response?.data?.errores?.[0] ||
        'No se pudo conectar con el servidor. Verifica tu conexión.'
      return { success: false, message: mensaje }
    }
  }

  // ── REGISTRO ──────────────────────────────────────────────
  const register = async (nombre_completo, email, password) => {
    try {
      const { data } = await api.post('/auth/registro', { nombre_completo, email, password })

      if (data.ok) {
        const userData = {
          ...data.usuario,
          iniciales: getIniciales(data.usuario.nombre_completo),
          nombre_completo: data.usuario.nombre_completo.toUpperCase(),
        }

        localStorage.setItem('token',   data.token)
        localStorage.setItem('usuario', JSON.stringify(userData))
        setUser(userData)

        return { success: true }
      }

      return { success: false, message: data.mensaje || 'Error al registrar usuario.' }
    } catch (error) {
      const mensaje =
        error.response?.data?.mensaje ||
        error.response?.data?.errores?.[0] ||
        'No se pudo conectar con el servidor. Verifica tu conexión.'
      return { success: false, message: mensaje }
    }
  }

  // ── LOGOUT ────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
