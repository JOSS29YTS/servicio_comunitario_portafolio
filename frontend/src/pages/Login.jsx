import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, BookOpen, Lock, Mail, AlertCircle, ArrowLeft, Sun, Moon } from 'lucide-react'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  )

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Detectar si la sesión expiró
  const queryParams = new URLSearchParams(location.search)
  const sessionExpired = queryParams.get('session_expired') === 'true'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Por favor completa todos los campos.')
      return
    }
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-bg-glow" />

      {/* Botón flotante para cambiar de tema */}
      <button
        className="btn-theme-toggle-floating"
        title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        onClick={toggleTheme}
        type="button"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="login-card">
        {/* Logo e identidad del colegio */}
        <div className="login-header" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <div className="login-logo" style={{ width: 40, height: 40, margin: 0 }}>
              <img src="/logo_fatima.svg" alt="Colegio NSF" />
            </div>
            <div className="login-school-name" style={{ margin: 0, fontSize: 15, textAlign: 'left', lineHeight: 1.2 }}>
              Colegio Nuestra<br/>Señora de Fátima
            </div>
          </div>
          <div className="login-title" style={{ fontSize: 20 }}>Acceso al Sistema</div>
        </div>

        {/* Sesión Expirada */}
        {sessionExpired && !error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: 13,
            color: '#FDE047',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, color: '#F59E0B' }} />
            Tu sesión ha expirado por inactividad o límite de tiempo. Por favor ingresa de nuevo.
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: 13,
            color: '#FCA5A5',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Formulario */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <Mail size={13} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }} />
              Correo Institucional
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="directora@colegiofatima.edu.ve"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={13} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }} />
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--navy-400)',
                  display: 'flex',
                  padding: 4,
                }}
              >
                {showPwd ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTop: '2.5px solid white', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', display: 'inline-block'
                }} />
                Verificando...
              </>
            ) : (
              <>
                <Lock size={16} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>


        <div className="login-register-prompt">
          ¿No tienes cuenta?{' '}
          <span
            className="login-register-link"
            onClick={() => navigate('/registro')}
          >
            Regístrate aquí
          </span>
        </div>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
          <span
            style={{ color: 'var(--navy-400)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
            onClick={() => navigate('/')}
            className="login-back-home"
          >
            <ArrowLeft size={14} />
            Volver al Inicio
          </span>
        </div>

        <div className="login-footer">
          <Lock size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
          Acceso restringido exclusivamente a la Dirección del plantel
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
