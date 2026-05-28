import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Sun, Moon, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const PAGE_TITLES = {
  '/dashboard':      { title: 'Dashboard',          sub: 'Resumen del sistema' },
  '/proyectos':      { title: 'Proyectos',           sub: 'Todos los proyectos registrados' },
  '/nuevo-proyecto': { title: 'Nuevo Proyecto',      sub: 'Registrar un nuevo proyecto de investigación' },
  '/buscar':         { title: 'Buscar Proyectos',    sub: 'Repositorio de proyectos estudiantiles' },
  '/configuracion':  { title: 'Configuración',       sub: 'Ajustes del sistema' },
  '/notificaciones': { title: 'Notificaciones',      sub: 'Historial de actividad del sistema' },
  '/usuarios':       { title: 'Gestión de Usuarios',  sub: 'Control de acceso institucional' },
}

function formatDate(date) {
  return date.toLocaleString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const page = PAGE_TITLES[location.pathname] || { title: 'Sistema', sub: '' }
  
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  
  // Reloj dinámico en tiempo real
  const [currentTime, setCurrentTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const [notifications, setNotifications] = React.useState([])

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/auth/audit-logs')
      if (data.ok && data.logs) {
        const interestActions = [
          'CREAR_PROYECTO', 'EDITAR_PROYECTO', 'ELIMINAR_PROYECTO', 
          'REGISTRO_SOLICITADO', 'CAMBIO_ROL_USUARIO', 'CAMBIO_ESTADO_CUENTA', 
          'ELIMINAR_USUARIO', 'RESPALDO_COMPLETADO_AUTO', 'RESPALDO_COMPLETADO_MANUAL'
        ]
        const filtered = data.logs.filter(log => interestActions.includes(log.accion))
        setNotifications(filtered.slice(0, 5))
      }
    } catch (err) {
      console.error('[HEADER] Error al consultar bitácora:', err)
    }
  }

  React.useEffect(() => {
    fetchNotifications()
    const timerId = setInterval(fetchNotifications, 30000)
    return () => clearInterval(timerId)
  }, [])

  const today = formatDate(currentTime)

  // Capitalize first letter
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)

  const [isDark, setIsDark] = React.useState(
    document.documentElement.classList.contains('dark')
  )
  const [showNotifications, setShowNotifications] = React.useState(false)

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

  return (
    <header className="header">
      <button 
        className="btn btn-ghost btn-icon mobile-menu-btn" 
        onClick={onMenuClick}
        title="Abrir menú"
        aria-label="Abrir menú lateral"
      >
        <Menu size={20} />
      </button>
      <div className="header-title">
        <h1>{page.title}</h1>
        {page.sub && <p>{page.sub}</p>}
      </div>

      <div className="header-actions">
        <span className="header-date">{todayCap}</span>

        <button
          className="btn btn-ghost btn-icon"
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          onClick={toggleTheme}
          style={{ marginRight: 4 }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-icon"
            title="Notificaciones"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                background: 'var(--indigo-500)',
                borderRadius: '50%',
                border: '1.5px solid var(--bg-card-special)',
              }} />
            )}
          </button>

          {showNotifications && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h3>Notificaciones</h3>
                <span className="notif-badge">
                  {notifications.length === 0 ? 'Vacío' : `${notifications.length} Activas`}
                </span>
              </div>
              <div className="notif-body">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={24} />
                    <p>No tienes notificaciones pendientes</p>
                    <span>Te avisaremos cuando haya actividad importante</span>
                  </div>
                ) : (
                  <div className="notif-list" style={{ display: 'flex', flexDirection: 'column' }}>
                    {notifications.map((n) => {
                      const dateStr = new Date(n.fecha_hora).toLocaleTimeString('es-VE', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true 
                      })
                      return (
                        <div 
                          key={n.id_log} 
                          className="notif-item" 
                          style={{ 
                            padding: '12px 16px', 
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 4,
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }} 
                          onClick={() => {
                            navigate('/notificaciones')
                            setShowNotifications(false)
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)' }}>
                              {n.accion.replace(/_/g, ' ')}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {dateStr}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                            {n.descripcion}
                          </p>
                          <span style={{ fontSize: 10.5, color: 'var(--indigo-400)', fontWeight: 600 }}>
                            Por: {n.usuario_nombre || 'Sistema'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="notif-footer">
                <button onClick={() => {
                  navigate('/notificaciones')
                  setShowNotifications(false)
                }}>
                  Ver todo el historial
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="user-avatar"
          style={{ width: 36, height: 36, fontSize: 13, cursor: 'default', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={`${user?.nombre_completo || user?.nombre || 'Usuario'}`}
        >
          {user?.avatar ? (
            <img 
              src={`${backendUrl}${user.avatar}`} 
              alt="Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            user?.iniciales || 'U'
          )}
        </div>
      </div>
    </header>
  )
}
