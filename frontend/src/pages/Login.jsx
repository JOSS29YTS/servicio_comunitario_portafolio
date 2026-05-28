import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { IS_DEMO_MODE, DEMO_EMAIL } from '../config/demoMode'
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowLeft, Sun, Moon, Play } from 'lucide-react'

export default function Login() {
  const [email, setEmail]       = useState(IS_DEMO_MODE ? DEMO_EMAIL : '')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

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

  const { login, loginDemo } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const queryParams = new URLSearchParams(location.search)
  const sessionExpired = queryParams.get('session_expired') === 'true'

  const isBusy = loading || demoLoading

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

  const handleDemoLogin = async () => {
    setError('')
    setDemoLoading(true)
    const result = await loginDemo()
    setDemoLoading(false)
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

      <button
        className="btn-theme-toggle-floating"
        title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        onClick={toggleTheme}
        type="button"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="login-card">
        <div className="login-header" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <div className="login-logo" style={{ width: 40, height: 40, margin: 0 }}>
              <img src="/logo_fatima.svg" alt="Colegio NSF" />
            </div>
            <div className="login-school-name" style={{ margin: 0, fontSize: 15, textAlign: 'left', lineHeight: 1.2 }}>
              Colegio Nuestra<br/>Señora de Fátima
            </div>
          </div>
          <div className="login-title" style={{ fontSize: 20 }}>
            {IS_DEMO_MODE ? 'Demostración del Sistema' : 'Acceso al Sistema'}
          </div>
        </div>

        {IS_DEMO_MODE && (
          <div style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--navy-200)',
            lineHeight: 1.5,
          }}>
            Modo demostración — cuenta de prueba con permisos limitados (Subdirector).
            Usa el botón de abajo para explorar el sistema sin registrarte.
          </div>
        )}

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

        {IS_DEMO_MODE && (
          <button
            type="button"
            className="btn btn-primary btn-lg login-btn"
            style={{ marginBottom: 16, width: '100%' }}
            disabled={isBusy}
            onClick={handleDemoLogin}
          >
            {demoLoading ? (
              <>
                <span style={{
                  width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)',
                  borderTop: '2.5px solid white', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', display: 'inline-block'
                }} />
                Entrando...
              </>
            ) : (
              <>
                <Play size={16} />
                Probar demo
              </>
            )}
          </button>
        )}

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
              placeholder={IS_DEMO_MODE ? DEMO_EMAIL : 'directora@colegiofatima.edu.ve'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus={!IS_DEMO_MODE}
              readOnly={IS_DEMO_MODE}
              style={IS_DEMO_MODE ? { opacity: 0.85, cursor: 'not-allowed' } : undefined}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>
                <Lock size={13} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }} />
                Contraseña
              </label>
              {!IS_DEMO_MODE && (
                <span
                  onClick={() => navigate('/recuperar-clave')}
                  style={{ fontSize: '12.5px', color: 'var(--indigo-400)', cursor: 'pointer', fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--indigo-300)'}
                  onMouseLeave={e => e.target.style.color = 'var(--indigo-400)'}
                >
                  ¿Olvidaste tu contraseña?
                </span>
              )}
            </div>
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

          {IS_DEMO_MODE && (
          )}

          <button
            id="login-submit"
            type="submit"
            className={`btn btn-lg login-btn ${IS_DEMO_MODE ? 'btn-ghost' : 'btn-primary'}`}
            disabled={isBusy}
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
                {IS_DEMO_MODE ? 'Iniciar con contraseña' : 'Iniciar Sesión'}
              </>
            )}
          </button>
        </form>

        {!IS_DEMO_MODE && (
          <div className="login-register-prompt">
            ¿No tienes cuenta?{' '}
            <span
              className="login-register-link"
              onClick={() => navigate('/registro')}
            >
              Regístrate aquí
            </span>
          </div>
        )}

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
          {IS_DEMO_MODE
            ? 'Entorno de demostración — los datos pueden restablecerse periódicamente'
            : 'Acceso restringido exclusivamente a la Dirección del plantel'}
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
