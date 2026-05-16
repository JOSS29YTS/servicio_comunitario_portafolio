import React from 'react'
import { Bell, Calendar, User, Info, Search } from 'lucide-react'

export default function Notificaciones() {
  // Lista de ejemplo vacía para el futuro
  const notificaciones = []

  return (
    <div className="page-content page-enter">
      <div className="card card-pad" style={{ background: 'var(--bg-card-special)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Historial de Notificaciones
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Consulta la actividad reciente y alertas del sistema.
        </p>
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
