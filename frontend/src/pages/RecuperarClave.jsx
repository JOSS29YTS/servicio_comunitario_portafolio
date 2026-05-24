// ============================================================
// VISTA: Recuperar Contraseña (Password Recovery Request)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// ============================================================
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function RecuperarClave() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/auth/recuperar-clave', { email: email.trim() })
      if (res.data?.ok) {
        setSuccess(true)
      } else {
        setError(res.data?.mensaje || 'Error al procesar la solicitud.')
      }
    } catch (err) {
      console.error('[RECUPERAR CLAVE] Error:', err)
      setError(
        err.response?.data?.mensaje || 
        'No se pudo conectar con el servidor. Intenta de nuevo.'
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
      {/* Círculos decorativos premium de fondo */}
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
          <p style={{ fontSize: '13px', color: 'var(--navy-300)', marginTop: '6px' }}>Repositorio Académico Colegio NSF</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{
              width: '64px', height: '64px', background: 'rgba(16,185,129,0.1)', 
              border: '1px solid rgba(16,185,129,0.2)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyOrigin: 'center', 
              margin: '0 auto 24px', color: '#10b981', justifyContent: 'center'
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--white)', marginBottom: '12px' }}>Enlace Enviado</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--navy-200)', lineHeight: '1.6', marginBottom: '28px' }}>
              Si tu correo electrónico está registrado en el repositorio institucional, recibirás un enlace seguro para restablecer tu contraseña en los próximos minutos.
            </p>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={16} /> Volver al Inicio de Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--navy-200)', lineHeight: '1.6', margin: '0 0 4px 0', textAlign: 'center' }}>
              Ingresa el correo electrónico institucional de tu cuenta. Te enviaremos un enlace temporal seguro para generar una nueva clave.
            </p>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#ef4444',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--navy-200)', fontWeight: 600, fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--navy-400)'
                }} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="ejemplo@colegionsf.edu.ve"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 42px',
                    background: 'var(--navy-950)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: 'var(--white)',
                    fontSize: '14px'
                  }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !email.trim()}
              style={{
                justifyContent: 'center',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                marginTop: '8px'
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: '8px'
                  }} />
                  Enviando enlace...
                </>
              ) : 'Enviar Enlace de Recuperación'}
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
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} /> Volver al Login
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
