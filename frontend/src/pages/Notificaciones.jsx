import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ArrowLeft, ChevronRight } from 'lucide-react'

export default function Notificaciones() {
  const navigate = useNavigate()
  // Lista de ejemplo vacía para el futuro
  const notificaciones = []

  return (
    <div className="page-content page-enter">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Sistema</span>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <span className="breadcrumb-current">Notificaciones</span>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h2>Notificaciones</h2>
          <p>Historial de actividad y alertas del sistema</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>

      <div className="card" style={{ background: 'var(--bg-card-special)' }}>
        {notificaciones.length === 0 ? (
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
          <div className="table-container" style={{ border: 'none' }}>
            {/* Aquí irá la tabla de notificaciones cuando haya datos */}
          </div>
        )}
      </div>
    </div>
  )
}
