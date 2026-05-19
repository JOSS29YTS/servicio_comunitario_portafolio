import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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

export default function Header() {
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
          </button>

          {showNotifications && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h3>Notificaciones</h3>
                <span className="notif-badge">Vacio</span>
              </div>
              <div className="notif-body">
                <div className="notif-empty">
                  <Bell size={24} />
                  <p>No tienes notificaciones pendientes</p>
                  <span>Te avisaremos cuando haya actividad importante</span>
                </div>
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
