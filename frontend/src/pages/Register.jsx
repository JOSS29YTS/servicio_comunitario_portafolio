import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, BookOpen, Lock, Mail, AlertCircle, User, ArrowLeft } from 'lucide-react'

export default function Register() {
  const [nombre, setNombre]           = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPwd, setConfirmPwd]   = useState('')
  const [showPwd, setShowPwd]         = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const { register } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!nombre || !email || !password || !confirmPwd) {
      setError('Por favor completa todos los campos.')
      return
    }
    if (password !== confirmPwd) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    
    setLoading(true)
    const result = await register(nombre, email, password)
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
          <div className="login-title" style={{ fontSize: 20 }}>Registro de Usuario</div>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16,
            fontSize: 13, color: '#FCA5A5',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <User size={13} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }} />
              Nombre y Apellido
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. María Pérez"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail size={13} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }} />
              Correo Institucional
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="directora@colegiofatima.edu.ve"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={13} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }} />
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--navy-400)', display: 'flex', padding: 4,
                }}
              >
                {showPwd ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={13} style={{ display:'inline', marginRight:4, verticalAlign:'middle' }} />
              Confirmar Contraseña
            </label>
            <input
              type={showPwd ? 'text' : 'password'}
              className="form-input"
              placeholder="••••••••"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
            />
          </div>

          <button
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
                Registrando...
              </>
            ) : (
              <>
                <Lock size={16} />
                Crear Cuenta
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--navy-400)' }}>
          ¿Ya tienes cuenta?{' '}
          <span
            style={{ color: 'var(--indigo-400)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/login')}
          >
            Inicia sesión aquí
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
