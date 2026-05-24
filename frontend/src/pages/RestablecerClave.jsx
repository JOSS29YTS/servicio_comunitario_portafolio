// ============================================================
// VISTA: Restablecer Contraseña (Password Reset Action Form)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// ============================================================
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import api from '../services/api'

export default function RestablecerClave() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Parámetros de la URL
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Extraer parámetros de la URL al cargar
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const tokenParam = queryParams.get('token')
    const emailParam = queryParams.get('email')

    if (!tokenParam || !emailParam) {
      setError('El enlace de seguridad es inválido. Por favor, solicita un nuevo correo de recuperación.')
    } else {
      setToken(tokenParam)
      setEmail(emailParam)
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token || !email) return

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/auth/restablecer-clave', {
        email,
        token,
        password
      })

      if (res.data?.ok) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3500)
      } else {
        setError(res.data?.mensaje || 'Error al restablecer la contraseña.')
      }
    } catch (err) {
      console.error('[RESTABLECER CLAVE] Error:', err)
      setError(
        err.response?.data?.mensaje || 
        'El enlace ha expirado o es inválido. Por favor, solicita una nueva recuperación.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container page-enter" style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top right, var(--navy-900), var(--navy-950))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Círculos decorativos premium */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0) 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-10%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(239,68,68,0.04) 0%, rgba(239,68,68,0) 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div className="login-card" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(30, 27, 75, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 10
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="/logo_fatima.svg" 
            alt="Colegio NSF" 
            style={{ width: '80px', height: '80px', margin: '0 auto 16px', display: 'block', filter: 'drop-shadow(0 4px 12px rgba(99,102,241,0.2))' }} 
          />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--white)', margin: 0 }}>Restablecer Contraseña</h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-300)', marginTop: '6px' }}>Crea una nueva contraseña de acceso</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{
              width: '64px', height: '64px', background: 'rgba(16,185,129,0.1)', 
              border: '1px solid rgba(16,185,129,0.2)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', margin: '0 auto 24px', 
              color: '#10b981', justifyContent: 'center'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--white)', marginBottom: '12px' }}>¡Contraseña Actualizada!</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--navy-200)', lineHeight: '1.6', marginBottom: '24px' }}>
              Tu contraseña ha sido restablecida exitosamente. Ahora tu cuenta es segura y está lista.
            </p>
            <p style={{ fontSize: '12.5px', color: 'var(--navy-400)' }}>
              Redirigiendo a la pantalla de login en unos segundos...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#ef4444',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Input Nueva Contraseña */}
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--navy-200)', fontWeight: 600, fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--navy-400)'
                }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    background: 'var(--navy-950)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: 'var(--white)',
                    fontSize: '14px'
                  }}
                  required
                  disabled={loading || !token}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    color: 'var(--navy-400)', cursor: 'pointer', padding: 0, display: 'flex'
                  }}
                  tabIndex="-1"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--navy-200)', fontWeight: 600, fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                Confirmar Nueva Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--navy-400)'
                }} />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    background: 'var(--navy-950)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: 'var(--white)',
                    fontSize: '14px'
                  }}
                  required
                  disabled={loading || !token}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    color: 'var(--navy-400)', cursor: 'pointer', padding: 0, display: 'flex'
                  }}
                  tabIndex="-1"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !token || !password || !confirmPassword}
              style={{
                justifyContent: 'center',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                marginTop: '12px'
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: '8px'
                  }} />
                  Procesando cambios...
                </>
              ) : 'Confirmar Nueva Contraseña'}
            </button>

            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => navigate('/login')}
              disabled={loading}
              style={{ 
                justifyContent: 'center', 
                fontSize: '13px', 
                color: 'var(--navy-300)',
              }}
            >
              Volver al Login
            </button>
          </form>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
