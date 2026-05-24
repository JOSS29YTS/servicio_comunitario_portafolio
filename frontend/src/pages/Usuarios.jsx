import React, { useState, useEffect } from 'react'
import { Users, Shield, MoreHorizontal, UserCheck, Edit3, UserMinus, UserPlus, Trash2, X, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function formatNombre(nombre = '') {
  if (!nombre) return ''
  return nombre.toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function Usuarios() {
  const { user: currentUser } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [estados, setEstados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Menús y modales
  const [activeMenuUserId, setActiveMenuUserId] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  
  // Carga de formularios
  const [selectedRolId, setSelectedRolId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  // Sistema de notificaciones
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 4000)
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData()
  }, [])

  // Registrar clic fuera para cerrar menús contextuales
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.user-menu-container')) {
        setActiveMenuUserId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resUsers, resRoles, resEstados] = await Promise.all([
        api.get('/auth/usuarios'),
        api.get('/auth/roles'),
        api.get('/auth/estados')
      ])
      
      if (resUsers.data.ok) {
        setUsuarios(resUsers.data.usuarios)
      }
      if (resRoles.data.ok) {
        setRoles(resRoles.data.roles)
      }
      if (resEstados.data.ok) {
        setEstados(resEstados.data.estados)
      }
    } catch (err) {
      console.error('[USUARIOS] Error al cargar datos:', err)
      setError(
        err.response?.data?.mensaje || 
        'No se pudo conectar con el servidor. Verifica tu conexión.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Cambiar rol de usuario
  const handleEditRolClick = (user) => {
    setSelectedUser(user)
    setSelectedRolId(user.id_rol || '')
    setActionError(null)
    setShowRoleModal(true)
    setActiveMenuUserId(null)
  }

  const handleSaveRol = async (e) => {
    e.preventDefault()
    if (!selectedUser || !selectedRolId) return

    setActionLoading(true)
    setActionError(null)
    try {
      const res = await api.put(`/auth/usuarios/${selectedUser.id}/rol`, {
        id_rol: parseInt(selectedRolId)
      })

      if (res.data.ok) {
        // Actualizar la lista en memoria
        setUsuarios(prev => prev.map(u => 
          u.id === selectedUser.id 
            ? { 
                ...u, 
                rol: res.data.usuario.rol, 
                id_rol: res.data.usuario.id_rol 
              } 
            : u
        ))
        showToast('✔ Rol de usuario actualizado correctamente.', 'success')
        setShowRoleModal(false)
      }
    } catch (err) {
      console.error('[USUARIOS] Error al actualizar rol:', err)
      setActionError(err.response?.data?.mensaje || 'Error al actualizar el rol.')
    } finally {
      setActionLoading(false)
    }
  }

  // Activar o Suspender acceso rápido
  const handleToggleEstado = async (user) => {
    setActiveMenuUserId(null)
    
    // Determinar nuevo estado
    const estadoActivo = estados.find(e => e.estado === 'Activo')
    const estadoSuspendido = estados.find(e => e.estado === 'Suspendido')
    
    if (!estadoActivo || !estadoSuspendido) {
      showToast('Error: Configuración de estados no cargada.', 'error')
      return
    }

    const nuevoEstado = user.estado === 'Activo' ? estadoSuspendido : estadoActivo
    
    try {
      const res = await api.put(`/auth/usuarios/${user.id}/estado`, {
        id_estado: nuevoEstado.id_estado
      })

      if (res.data.ok) {
        setUsuarios(prev => prev.map(u => 
          u.id === user.id 
            ? { 
                ...u, 
                estado: res.data.usuario.estado, 
                id_estado: res.data.usuario.id_estado 
              } 
            : u
        ))
        showToast(
          `✔ Acceso de usuario ${user.estado === 'Activo' ? 'suspendido' : 'activado'} correctamente.`, 
          'success'
        )
      }
    } catch (err) {
      console.error('[USUARIOS] Error al actualizar estado:', err)
      showToast(err.response?.data?.mensaje || 'Error al actualizar el estado de la cuenta.', 'error')
    }
  }

  // Eliminar usuario
  const handleDeleteClick = (user) => {
    setSelectedUser(user)
    setActionError(null)
    setShowDeleteModal(true)
    setActiveMenuUserId(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedUser) return

    setActionLoading(true)
    setActionError(null)
    try {
      const res = await api.delete(`/auth/usuarios/${selectedUser.id}`)

      if (res.data.ok) {
        // Quitar de la lista
        setUsuarios(prev => prev.filter(u => u.id !== selectedUser.id))
        showToast('✔ Usuario eliminado correctamente del sistema.', 'success')
        setShowDeleteModal(false)
      }
    } catch (err) {
      console.error('[USUARIOS] Error al eliminar usuario:', err)
      setActionError(
        err.response?.data?.mensaje || 
        'No se pudo eliminar al usuario. Intenta nuevamente.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  // Estilo de estados
  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'Activo': return 'badge-green'
      case 'Pendiente': return 'badge-amber'
      case 'Suspendido': return 'badge-red'
      case 'Rechazado': return 'badge-red'
      default: return 'badge-navy'
    }
  }

  return (
    <div className="page-content page-enter" style={{ position: 'relative' }}>
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="toast" style={{
          borderLeft: `4px solid ${toast.type === 'success' ? 'var(--green-500)' : 'var(--red-500)'}`,
          background: 'var(--navy-900)',
          color: 'var(--white)',
          zIndex: 9999
        }}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cabecera */}
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

      {/* Manejo de estados principales */}
      {loading ? (
        <div className="card card-pad" style={{ background: 'var(--bg-card-special)', textAlign: 'center', padding: '60px 24px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', border: '3px solid rgba(99,102,241,0.1)', borderTop: '3px solid var(--indigo-500)', borderRadius: '50%', width: 36, height: 36, animation: 'spin 1s linear infinite' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Cargando usuarios de la base de datos...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div className="card card-pad" style={{ background: 'var(--bg-card-special)', textAlign: 'center', padding: '48px 24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertTriangle size={48} color="var(--red-500)" style={{ marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 8, fontWeight: 700 }}>Error al cargar usuarios</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</p>
          <button className="btn btn-indigo" onClick={fetchData}>Reintentar carga</button>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="card card-pad" style={{ background: 'var(--bg-card-special)', textAlign: 'center', padding: '64px 24px' }}>
          <Users size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No se encontraron usuarios en la base de datos.</p>
        </div>
      ) : (
        <>
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
                          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-800)' }}>
                            {u.avatar ? (
                              <img 
                                src={`${backendUrl}${u.avatar}`} 
                                alt="Avatar" 
                                className="lazy-image"
                                loading="lazy"
                                onLoad={(e) => e.target.classList.add('loaded')}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              u.iniciales
                            )}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatNombre(u.nombre)}
                            {currentUser?.id_usuario === u.id && (
                              <span style={{ fontSize: 10, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--indigo-500)', padding: '2px 6px', borderRadius: 4, marginLeft: 8, fontWeight: 500 }}>Tú</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Shield size={12} /> {u.rol || 'Sin Rol'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getEstadoBadgeClass(u.estado)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {u.estado === 'Activo' ? <UserCheck size={12} /> : <UserMinus size={12} />} {u.estado || 'Desconocido'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 24 }}>
                        <div className="user-menu-container">
                          <button 
                            className="btn btn-ghost btn-sm btn-icon" 
                            onClick={() => setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id)}
                            aria-label="Acciones de usuario"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {activeMenuUserId === u.id && (
                            <div className="user-menu-dropdown">
                              <button 
                                className="user-menu-item"
                                onClick={() => handleEditRolClick(u)}
                                disabled={currentUser?.rol === 'Subdirector' && u.rol === 'Director'}
                              >
                                <Edit3 size={14} /> Editar Rol
                              </button>
                              
                              {u.id !== currentUser?.id_usuario && (
                                <button 
                                  className="user-menu-item"
                                  onClick={() => handleToggleEstado(u)}
                                  disabled={currentUser?.rol === 'Subdirector' && u.rol === 'Director'}
                                >
                                  {u.estado === 'Activo' ? (
                                    <>
                                      <UserMinus size={14} /> Suspender Acceso
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus size={14} /> Activar Acceso
                                    </>
                                  )}
                                </button>
                              )}

                              {u.id !== currentUser?.id_usuario && (
                                <>
                                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }}></div>
                                  <button 
                                    className="user-menu-item danger"
                                    onClick={() => handleDeleteClick(u)}
                                    disabled={currentUser?.rol === 'Subdirector' && (u.rol === 'Director' || u.rol === 'Subdirector')}
                                  >
                                    <Trash2 size={14} /> Eliminar Usuario
                                  </button>
                                </>
                              )}
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
                    <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 14, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-800)' }}>
                      {u.avatar ? (
                        <img 
                          src={`${backendUrl}${u.avatar}`} 
                          alt="Avatar" 
                          className="lazy-image"
                          loading="lazy"
                          onLoad={(e) => e.target.classList.add('loaded')}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        u.iniciales
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {formatNombre(u.nombre)}
                        {currentUser?.id_usuario === u.id && (
                          <span style={{ fontSize: 10, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--indigo-500)', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>Tú</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>
                    </div>
                  </div>
                  
                  <div className="user-menu-container">
                    <button 
                      className="btn btn-ghost btn-sm btn-icon" 
                      onClick={() => setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id)}
                      aria-label="Acciones de usuario"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {activeMenuUserId === u.id && (
                      <div className="user-menu-dropdown" style={{ top: '36px', right: 0 }}>
                        <button 
                          className="user-menu-item"
                          onClick={() => handleEditRolClick(u)}
                          disabled={currentUser?.rol === 'Subdirector' && u.rol === 'Director'}
                        >
                          <Edit3 size={14} /> Editar Rol
                        </button>

                        {u.id !== currentUser?.id_usuario && (
                          <button 
                            className="user-menu-item"
                            onClick={() => handleToggleEstado(u)}
                            disabled={currentUser?.rol === 'Subdirector' && u.rol === 'Director'}
                          >
                            {u.estado === 'Activo' ? (
                              <>
                                <UserMinus size={14} /> Suspender Acceso
                              </>
                            ) : (
                              <>
                                <UserPlus size={14} /> Activar Acceso
                              </>
                            )}
                          </button>
                        )}

                        {u.id !== currentUser?.id_usuario && (
                          <>
                            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }}></div>
                            <button 
                              className="user-menu-item danger"
                              onClick={() => handleDeleteClick(u)}
                              disabled={currentUser?.rol === 'Subdirector' && (u.rol === 'Director' || u.rol === 'Subdirector')}
                            >
                              <Trash2 size={14} /> Eliminar Usuario
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Shield size={12} /> {u.rol || 'Sin Rol'}
                  </span>
                  <span className={`badge ${getEstadoBadgeClass(u.estado)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {u.estado === 'Activo' ? <UserCheck size={12} /> : <UserMinus size={12} />} {u.estado || 'Desconocido'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Banner Informativo */}
      <div style={{ marginTop: 24, padding: 16, background: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--indigo-500)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Los nuevos usuarios registrados aparecerán aquí automáticamente para su aprobación y asignación de rol.
        </p>
      </div>

      {/* MODAL: EDITAR ROL */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 440, background: 'var(--bg-card-special)', border: '1px solid var(--border-subtle)' }}>
            <div className="modal-header" style={{ borderBottomColor: 'var(--border-subtle)' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Editar Rol de Usuario</h3>
              <button 
                className="btn btn-ghost btn-sm btn-icon" 
                onClick={() => setShowRoleModal(false)}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveRol}>
              <div className="modal-body">
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Asigna un rol administrativo a <strong>{formatNombre(selectedUser.nombre)}</strong> ({selectedUser.email}).
                </p>

                {actionError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', padding: 12, color: 'var(--red-500)', fontSize: 13, marginBottom: 16 }}>
                    {actionError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8, display: 'block' }}>Rol / Cargo</label>
                  <select 
                    className="form-select"
                    value={selectedRolId}
                    onChange={(e) => setSelectedRolId(e.target.value)}
                    style={{ width: '100%', background: 'var(--navy-950)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                    required
                  >
                    <option value="" disabled>Selecciona un rol...</option>
                    {roles.map(r => (
                      <option 
                        key={r.id_rol} 
                        value={r.id_rol}
                        disabled={currentUser?.rol === 'Subdirector' && r.nombre === 'Director'}
                      >
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTopColor: 'var(--border-subtle)' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowRoleModal(false)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-indigo"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 460, background: 'var(--bg-card-special)', border: '1px solid var(--border-subtle)' }}>
            <div className="modal-header" style={{ borderBottomColor: 'var(--border-subtle)' }}>
              <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color="var(--red-500)" /> Eliminar Usuario
              </h3>
              <button 
                className="btn btn-ghost btn-sm btn-icon" 
                onClick={() => setShowDeleteModal(false)}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: 14.5, color: 'var(--text-primary)', marginBottom: 12 }}>
                ¿Estás seguro de que deseas eliminar permanentemente al usuario <strong>{formatNombre(selectedUser.nombre)}</strong> del sistema?
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Esta acción no se puede deshacer y eliminará todo su perfil. Si tiene proyectos o envíos a su nombre, el sistema impedirá su eliminación física por seguridad para mantener el historial.
              </p>

              {actionError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', padding: 14, color: 'var(--red-500)', fontSize: 13.5, marginBottom: 0, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: 4 }}>No se puede eliminar</strong>
                    {actionError}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTopColor: 'var(--border-subtle)' }}>
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-red"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                style={{ background: 'var(--red-500)', color: 'white' }}
              >
                {actionLoading ? 'Eliminando...' : 'Eliminar Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
