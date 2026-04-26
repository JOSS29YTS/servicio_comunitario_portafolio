import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  Search,
  Settings,
  LogOut,
  BookOpen,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',        label: 'Panel',        icon: LayoutDashboard },
  { to: '/proyectos',        label: 'Proyectos',        icon: FolderOpen },
  { to: '/buscar',           label: 'Buscar',           icon: Search },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <BookOpen size={22} color="#fff" />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Colegio NSF</span>
          <span className="sidebar-brand-sub">Repositorio Académico</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Menú Principal</span>

        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} className="nav-item-icon" />
            {label}
          </NavLink>
        ))}

        <span className="nav-section-label" style={{ marginTop: '16px' }}>Sistema</span>

        <NavLink
          to="/configuracion"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Settings size={17} className="nav-item-icon" />
          Configuración
        </NavLink>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Cerrar sesión">
          <div className="user-avatar">
            {user?.iniciales || 'DI'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.nombre_completo || user?.nombre}</div>

          </div>
          <LogOut size={15} color="var(--navy-500)" />
        </div>
      </div>
    </aside>
  )
}
