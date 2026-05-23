import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// Derivar iniciales del nombre completo
function getIniciales(nombreCompleto = '') {
  const partes = nombreCompleto.trim().split(' ').filter(Boolean)
  if (partes.length === 0) return 'U'
  if (partes.length === 1) return partes[0][0].toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

// Función para poner en Capital Case (Nombre Apellido)
function formatNombre(nombre = '') {
  return nombre.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Decodificar JWT en el frontend sin librerías externas
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)  // mientras verifica el token guardado
  const sessionTimeoutRef     = useRef(null)

  // Función para programar proactivamente el fin de la sesión cuando el token JWT expire
  const programarExpiracionSession = (token) => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
      sessionTimeoutRef.current = null
    }

    if (!token) return

    const decoded = parseJwt(token)
    if (!decoded || !decoded.exp) return

    // exp viene en segundos, Date.now() en milisegundos
    const tiempoRestanteMs = (decoded.exp * 1000) - Date.now()

    if (tiempoRestanteMs <= 0) {
      logout()
      window.location.href = '/login?session_expired=true'
    } else {
      // Programar logout automático en el segundo exacto de expiración
      sessionTimeoutRef.current = setTimeout(() => {
        logout()
        window.location.href = '/login?session_expired=true'
      }, tiempoRestanteMs)
    }
  }

  // Al cargar la app, verificar si hay un token guardado en localStorage
  useEffect(() => {
    const token   = localStorage.getItem('token')
    const usuario = localStorage.getItem('usuario')

    if (token && usuario) {
      try {
        const decoded = parseJwt(token)
        const expirado = decoded ? (decoded.exp * 1000) - Date.now() <= 0 : true

        if (expirado) {
          localStorage.removeItem('token')
          localStorage.removeItem('usuario')
          setUser(null)
        } else {
          const parsed = JSON.parse(usuario)
          setUser({ 
            ...parsed, 
            nombre_completo: formatNombre(parsed.nombre_completo),
            rol: parsed.rol, 
            iniciales: getIniciales(parsed.nombre_completo) 
          })
          programarExpiracionSession(token)
        }
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
      }
    }
    setLoading(false)

    return () => {
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
    }
  }, [])

  // ── LOGIN: llama al backend real ──────────────────────────
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })

      if (data.ok) {
        const userData = {
          ...data.usuario,
          rol: data.usuario.rol, 
          iniciales: getIniciales(data.usuario.nombre_completo),
          nombre_completo: formatNombre(data.usuario.nombre_completo),
        }

        // Guardar token y usuario en localStorage
        localStorage.setItem('token',   data.token)
        localStorage.setItem('usuario', JSON.stringify(userData))
        setUser(userData)
        programarExpiracionSession(data.token)

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
        // En el registro del backend escolar actual, la cuenta entra en estado 'Pendiente'
        // por lo tanto no entrega un token inmediato. Pero si lo hiciera, lo manejamos de forma segura:
        if (data.token) {
          const userData = {
            ...data.usuario,
            rol: data.usuario.rol, 
            iniciales: getIniciales(data.usuario.nombre_completo),
            nombre_completo: formatNombre(data.usuario.nombre_completo),
          }

          localStorage.setItem('token',   data.token)
          localStorage.setItem('usuario', JSON.stringify(userData))
          setUser(userData)
          programarExpiracionSession(data.token)
        }

        return { success: true, mensaje: data.mensaje }
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
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
      sessionTimeoutRef.current = null
    }
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUser(null)
  }

  // ── ACTUALIZAR USUARIO EN CACHE Y ESTADO ──────────────────
  const actualizarUsuario = (nuevosDatos) => {
    const usuarioActual = localStorage.getItem('usuario')
    if (usuarioActual) {
      try {
        const parsed = JSON.parse(usuarioActual)
        const actualizado = {
          ...parsed,
          ...nuevosDatos,
          nombre_completo: formatNombre(nuevosDatos.nombre_completo || parsed.nombre_completo),
          iniciales: getIniciales(nuevosDatos.nombre_completo || parsed.nombre_completo),
        }
        localStorage.setItem('usuario', JSON.stringify(actualizado))
        setUser(actualizado)
      } catch (err) {
        console.error('Error al actualizar usuario en context:', err)
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      actualizarUsuario,
      loading,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
