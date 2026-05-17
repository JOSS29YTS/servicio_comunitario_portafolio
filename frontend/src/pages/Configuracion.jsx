import React, { useState, useEffect } from 'react'
import { 
  Settings, User, Database, Shield, Camera, 
  Key, Bell, Globe, Activity, HardDrive, 
  FileText, Users, Mail, ExternalLink, RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Configuracion() {
  const { user, actualizarUsuario } = useAuth()
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [telefono, setTelefono] = useState('')
  const [loading, setLoading] = useState(false)

  // Sincronizar el teléfono con los datos cargados del usuario
  useEffect(() => {
    if (user) {
      setTelefono(user.telefono || '')
    }
  }, [user])

  const toggleNotifications = async () => {
    if (!notifEnabled) {
      // Pedir permiso al navegador
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotifEnabled(true)
        // Enviar notificación de prueba
        new Notification('¡Sistema Activado! 🔔', {
          body: 'Las notificaciones de escritorio para el Repositorio Académico están funcionando correctamente.',
          icon: '/logo_fatima.svg'
        })
      } else {
        alert('Para activar las notificaciones, debes permitir el acceso en la configuración de tu navegador.')
      }
    } else {
      setNotifEnabled(false)
    }
  }

  // Guardar cambios del perfil (teléfono)
  const handleSaveProfile = async () => {
    if (isEditing) {
      setLoading(true)
      try {
        const { data } = await api.put('/auth/perfil', { telefono })
        if (data.ok) {
          actualizarUsuario({ telefono: data.usuario.telefono })
          setIsEditing(false)
        }
      } catch (error) {
        const mensaje = 
          error.response?.data?.mensaje || 
          error.response?.data?.errores?.[0] || 
          'No se pudo actualizar el perfil.'
        alert(mensaje)
      } finally {
        setLoading(false)
      }
    } else {
      setIsEditing(true)
    }
  }

  // Formatear marca de tiempo de última conexión
  const formatConexion = (fechaIso) => {
    if (!fechaIso) return 'Hoy'
    try {
      const date = new Date(fechaIso)
      return date.toLocaleString('es-VE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } catch (e) {
      return 'Hoy'
    }
  }

  return (
    <div className="page-content page-enter">
      <div className="config-grid">
        
        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Perfil del Usuario */}
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div className="avatar-edit-container">
                <div className="user-avatar">
                  {user?.iniciales || 'AV'}
                </div>
                <button className="avatar-edit-btn" title="Cambiar foto">
                  <Camera size={14} />
                </button>
              </div>
              <button 
                className={`btn ${isEditing ? 'btn-primary' : 'btn-secondary'}`}
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? 'Guardando...' : (isEditing ? 'Guardar' : 'Editar Perfil')}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div className="detail-label">Nombre Completo</div>
                  <div className="detail-value">{user?.nombre_completo}</div>
                </div>
                <div>
                  <div className="detail-label">Teléfono</div>
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="form-input" 
                      value={telefono} 
                      onChange={e => setTelefono(e.target.value)}
                      placeholder="Ej: 0412-1234567"
                      style={{ padding: '4px 8px', height: 'auto', fontSize: 13.5 }}
                    />
                  ) : (
                    <div 
                      className="detail-value" 
                      style={{ 
                        color: user?.telefono ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontStyle: user?.telefono ? 'normal' : 'italic'
                      }}
                    >
                      {user?.telefono || 'No registrado'}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div className="detail-label">Correo</div>
                  <div className="detail-value">{user?.email}</div>
                </div>
                <div>
                  <div className="detail-label">Último Acceso</div>
                  <div className="detail-value" style={{ fontSize: 12.5 }}>
                    {user?.ultima_conexion ? formatConexion(user.ultima_conexion) : 'Hoy'}
                  </div>
                </div>
              </div>

              <div>
                <div className="detail-label">Rol / Cargo</div>
                <div className="detail-value">
                  <span className="badge badge-indigo">{user?.rol || 'Director'}</span>
                </div>
              </div>
            </div>
            
            <button className="btn btn-ghost" style={{ marginTop: 24, width: '100%', justifyContent: 'center', gap: 8 }}>
              <Key size={16} /> Cambiar Contraseña
            </button>
          </div>

          {/* Preferencias */}
          <div className="card card-pad">
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={18} color="var(--indigo-500)" /> Preferencias del Sistema
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="stat-row">
                <div className="stat-label">
                  <Bell size={16} /> Notificaciones de escritorio
                </div>
                <label className="switch">
                  <input type="checkbox" checked={notifEnabled} onChange={toggleNotifications} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="stat-row">
                <div className="stat-label">
                  <Globe size={16} /> Idioma del sistema
                </div>
                <div className="stat-value">Español (VE)</div>
              </div>
              <div className="stat-row" style={{ borderBottom: 'none' }}>
                <div className="stat-label">
                  <Activity size={16} /> Registro de actividad
                </div>
                <span className="badge badge-green">Activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Estadísticas de Impacto */}
          <div className="card card-pad">
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 20 }}>
              Estadísticas de Impacto
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="stat-row">
                <div className="stat-label"><FileText size={16} color="var(--indigo-500)" /> Proyectos Registrados</div>
                <div className="stat-value">0</div>
              </div>
              <div className="stat-row">
                <div className="stat-label"><Database size={16} color="var(--green-500)" /> Documentos (PDFs)</div>
                <div className="stat-value">0</div>
              </div>
              <div className="stat-row">
                <div className="stat-label"><Users size={16} color="var(--purple-500)" /> Usuarios Activos</div>
                <div className="stat-value">1</div>
              </div>
              <div className="stat-row" style={{ borderBottom: 'none' }}>
                <div className="stat-label"><HardDrive size={16} color="var(--amber-500)" /> Almacenamiento</div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stat-value">0 MB</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>de 500 MB usados</div>
                </div>
              </div>
            </div>
          </div>

          {/* Estado Técnico */}
          <div className="card card-pad">
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 20 }}>
              Estado Técnico y DB
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-500)', boxShadow: '0 0 10px var(--green-500)' }}></div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: 600 }}>Base de Datos Conectada</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>MySQL 8.0</span>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: 'rgba(99, 102, 241, 0.05)', 
                borderRadius: 'var(--radius-md)', 
                border: '1px dashed var(--indigo-500)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Último Respaldo</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>Pendiente de primer respaldo</div>
                  </div>
                  <div style={{ color: 'var(--indigo-500)' }}>
                    <RefreshCw size={18} />
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                   Forzar Sincronización
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                <span>Sesión actual expira en:</span>
                <span style={{ fontWeight: 600, color: 'var(--indigo-500)' }}>08:00:00</span>
              </div>
            </div>
          </div>

          {/* Desarrollo y Soporte (Alejandro Villa) */}
          <div className="card card-pad" style={{ 
            background: 'var(--bg-card-special)', 
            border: '1px solid var(--indigo-500)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: -10, right: -10, opacity: 0.05, transform: 'rotate(20deg)'
            }}>
              <Settings size={100} color="var(--indigo-500)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36, background: 'var(--indigo-500)', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
              }}>
                <User size={18} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Desarrollo y Soporte</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="detail-label">Desarrollador</div>
                <div className="detail-value">Alejandro Villa</div>
              </div>
              <div>
                <div className="detail-label">Contacto</div>
                <div className="detail-value" style={{ color: 'var(--indigo-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} /> alejandrovilla2912@gmail.com
                </div>
              </div>
              <a 
                href="mailto:alejandrovilla2912@gmail.com" 
                className="btn btn-primary" 
                style={{ marginTop: 8, justifyContent: 'center', gap: 8 }}
              >
                Contactar Soporte <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
