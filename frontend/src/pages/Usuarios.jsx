import React, { useState } from 'react'
import { Users, Shield, MoreHorizontal, UserCheck, Edit3, UserMinus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Usuarios() {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  
  const usuarios = [
    { 
      id: 1, 
      nombre: user?.nombre_completo || 'Usuario', 
      email: user?.email || '', 
      rol: user?.rol || 'Director', 
      estado: 'Activo', 
      iniciales: user?.iniciales || 'AV',
      avatar: user?.avatar || null
    }
  ]

  return (
    <div className="page-content page-enter">
      <div className="card card-pad" style={{ background: 'var(--bg-card-special)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ padding: 8, background: 'var(--indigo-500)', borderRadius: 'var(--radius-md)', color: 'white' }}>
            <Users size={20} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Gestión de Usuarios
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginLeft: 44 }}>
          Administra los accesos y asigna roles a los miembros de la institución. Solo personal directivo puede gestionar esta sección.
        </p>
      </div>

      {/* Vista de Escritorio (Tabla) */}
      <div className="card desktop-view" style={{ background: 'var(--bg-card-special)' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo Electrónico</th>
                <th>Rol / Cargo</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {u.avatar ? (
                          <img 
                            src={`${backendUrl}${u.avatar}`} 
                            alt="Avatar" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        ) : (
                          u.iniciales
                        )}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.nombre}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Shield size={12} /> {u.rol}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <UserCheck size={12} /> {u.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 24 }}>
                    <div className="user-menu-container">
                      <button 
                        className="btn btn-ghost btn-sm btn-icon" 
                        onClick={() => setShowMenu(!showMenu)}
                        aria-label="Acciones de usuario"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {showMenu && (
                        <div className="user-menu-dropdown">
                          <button className="user-menu-item">
                            <Edit3 size={14} /> Editar Rol
                          </button>
                          <button className="user-menu-item">
                            <UserMinus size={14} /> Suspender Acceso
                          </button>
                          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }}></div>
                          <button className="user-menu-item danger">
                            <Trash2 size={14} /> Eliminar Usuario
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de Móvil (Tarjetas) */}
      <div className="mobile-view">
        {usuarios.map(u => (
          <div key={u.id} className="card card-pad" style={{ background: 'var(--bg-card-special)', marginBottom: 16, overflow: 'visible', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 14, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {u.avatar ? (
                    <img 
                      src={`${backendUrl}${u.avatar}`} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    u.iniciales
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14.5 }}>{u.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>
                </div>
              </div>
              
              <div className="user-menu-container">
                <button 
                  className="btn btn-ghost btn-sm btn-icon" 
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Acciones de usuario"
                >
                  <MoreHorizontal size={18} />
                </button>

                {showMenu && (
                  <div className="user-menu-dropdown" style={{ top: '36px', right: 0 }}>
                    <button className="user-menu-item">
                      <Edit3 size={14} /> Editar Rol
                    </button>
                    <button className="user-menu-item">
                      <UserMinus size={14} /> Suspender Acceso
                    </button>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }}></div>
                    <button className="user-menu-item danger">
                      <Trash2 size={14} /> Eliminar Usuario
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Shield size={12} /> {u.rol}
              </span>
              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <UserCheck size={12} /> {u.estado}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--indigo-500)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Los nuevos usuarios registrados aparecerán aquí automáticamente para su aprobación y asignación de rol.
        </p>
      </div>
    </div>
  )
}
