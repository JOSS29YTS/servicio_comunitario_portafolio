import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ArrowLeft, ChevronRight, Activity, Calendar, User, RefreshCw, AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function Notificaciones() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/auth/audit-logs')
      if (data.ok) {
        setLogs(data.logs || [])
      } else {
        setError(data.mensaje || 'Error al obtener la bitácora.')
      }
    } catch (err) {
      console.error('[NOTIFICACIONES] Error:', err)
      setError('No se pudo conectar con el servidor. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getBadgeClass = (accion = '') => {
    const act = accion.toUpperCase()
    if (act.includes('ELIMINAR') || act.includes('FALLIDO') || act.includes('BLOQUEADO')) {
      return 'badge-red'
    }
    if (act.includes('CREAR') || act.includes('REGISTRO') || act.includes('RESPALDO')) {
      return 'badge-green'
    }
    if (act.includes('EDITAR') || act.includes('CAMBIO')) {
      return 'badge-indigo'
    }
    return 'badge-navy'
  }

  const formatFecha = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return date.toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    } catch (e) {
      return isoString
    }
  }

  return (
    <div className="page-content page-enter">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Sistema</span>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <span className="breadcrumb-current">Bitácora del Sistema</span>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h2>Bitácora del Sistema</h2>
          <p>Historial de actividad administrativa y auditoría en tiempo real</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={fetchLogs} 
            disabled={loading}
            title="Refrescar historial"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refrescar
          </button>
          <button className="btn btn-secondary btn-icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} />
            Volver
          </button>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--bg-card-special)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--indigo-500)', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Cargando bitácora de auditoría...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={40} style={{ color: 'var(--red-500)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Error al cargar datos</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 400 }}>{error}</p>
            <button className="btn btn-primary" onClick={fetchLogs} style={{ marginTop: 8 }}>Reintentar</button>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ 
              width: 60, height: 60, background: 'var(--bg-icon-special)', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', margin: '0 auto 20px', color: 'var(--text-muted)' 
            }}>
              <Bell size={30} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              No hay actividad registrada
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 300, margin: '0 auto' }}>
              Cuando ocurran eventos importantes en el repositorio, aparecerán listados en esta sección.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--navy-100)' }}>
                  <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Acción</th>
                  <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descripción</th>
                  <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Responsable</th>
                  <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Fecha y Hora</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr 
                    key={log.id_log} 
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.25s' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      <span className={`badge ${getBadgeClass(log.accion)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <Activity size={11} />
                        {log.accion.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.5, maxWidth: '400px' }}>
                      {log.descripcion}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={12} className="text-muted" />
                          {log.usuario_nombre || 'Sistema'}
                        </span>
                        {log.usuario_email && (
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                            {log.usuario_email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} />
                        {formatFecha(log.fecha_hora)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
