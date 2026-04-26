import React from 'react'
import { Settings, User, Database, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Configuracion() {
  const { user } = useAuth()
  return (
    <div className="page-content page-enter">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
        {/* Datos del usuario */}
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
              {user?.nombre_completo ? user.nombre_completo.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'AV'}
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>Perfil de Usuario</h3>
            <span className="badge badge-navy" style={{ marginLeft: 'auto' }}>Solo lectura</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="detail-label">Nombre</div>
              <div className="detail-value">{user?.nombre_completo || 'Usuario'}</div>
            </div>
            <div>
              <div className="detail-label">Correo</div>
              <div className="detail-value">{user?.email}</div>
            </div>

          </div>
        </div>

        {/* Info del sistema */}
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--amber-100)', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber-500)'
            }}>
              <Settings size={18} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>Información del Sistema</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="detail-label">Institución</div>
              <div className="detail-value">Colegio Nuestra Señora de Fátima</div>
            </div>
            <div>
              <div className="detail-label">Sistema</div>
              <div className="detail-value">Repositorio Académico v1.0</div>
            </div>
            <div>
              <div className="detail-label">Estado</div>
              <div className="detail-value">
                <span className="badge badge-green">🟢 Operativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Base de datos */}
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--green-100)', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-500)'
            }}>
              <Database size={18} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>Base de Datos</h3>
            <span className="badge badge-navy" style={{ marginLeft: 'auto' }}>Solo lectura</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--navy-500)', lineHeight: 1.6 }}>
            En esta fase de prototipo los datos son locales. En la versión final, el sistema
            conectará con <strong>MySQL</strong> a través de <strong>Sequelize ORM</strong> en el backend Node.js.
          </p>
        </div>

        {/* Seguridad */}
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--purple-100)', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple-500)'
            }}>
              <Shield size={18} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>Seguridad</h3>
            <span className="badge badge-green" style={{ marginLeft: 'auto' }}>JWT activo</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--navy-500)', lineHeight: 1.6 }}>
            Acceso protegido por autenticación JWT. Solo la Dirección del plantel tiene
            acceso al sistema y al material académico almacenado.
          </p>
        </div>
      </div>
    </div>
  )
}
