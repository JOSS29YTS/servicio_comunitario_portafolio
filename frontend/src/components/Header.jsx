import React from 'react'
import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PAGE_TITLES = {
  '/dashboard':      { title: 'Dashboard',          sub: 'Resumen del sistema' },
  '/proyectos':      { title: 'Proyectos',           sub: 'Todos los proyectos registrados' },
  '/nuevo-proyecto': { title: 'Nuevo Proyecto',      sub: 'Registrar un nuevo proyecto de investigación' },
  '/buscar':         { title: 'Buscar Proyectos',    sub: 'Repositorio de proyectos estudiantiles' },
  '/configuracion':  { title: 'Configuración',       sub: 'Ajustes del sistema' },
}

function formatDate(date) {
  return date.toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Header() {
  const location = useLocation()
  const { user } = useAuth()
  const page = PAGE_TITLES[location.pathname] || { title: 'Sistema', sub: '' }
  const today = formatDate(new Date())

  // Capitalize first letter
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)

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
          title="Notificaciones"
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '7px',
            height: '7px',
            background: 'var(--indigo-500)',
            borderRadius: '50%',
            border: '2px solid white',
          }} />
        </button>

        <div
          className="user-avatar"
          style={{ width: 36, height: 36, fontSize: 13, cursor: 'default' }}
          title={`${user?.nombre_completo || user?.nombre || 'Usuario'}`}
        >
          {user?.iniciales || 'U'}
        </div>
      </div>
    </header>
  )
}
