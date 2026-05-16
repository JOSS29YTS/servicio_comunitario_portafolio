import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, Users, Tag, FileText,
  TrendingUp, Plus, ArrowRight, Download, Eye, LayoutGrid
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Estado local vacío mientras conectamos todo
  const [stats, setStats] = useState({
    totalProyectos: 0,
    promocionesDiferentes: 0,
    categorias: 0,
    pdfAlmacenados: 0
  })
  const [recientes, setRecientes] = useState([])
  const [categoriasLista, setCategoriasLista] = useState([])

  const statsRender = [
    { label: 'Total Proyectos',         value: stats.totalProyectos,        icon: FolderOpen,   color: 'emerald' },
    { label: 'Promociones Registradas', value: stats.promocionesDiferentes, icon: TrendingUp,   color: 'orange'  },
    { label: 'Categorías',              value: stats.categorias,             icon: Tag,          color: 'rose'  },
    { label: 'PDFs Almacenados',        value: stats.pdfAlmacenados,         icon: FileText,     color: 'blue' },
  ]

  return (
    <div className="page-content page-enter">
      {/* Bienvenida */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
          Bienvenido, {user?.nombre_completo ? (
            user.nombre_completo.split(' ')[0].charAt(0).toUpperCase() + 
            user.nombre_completo.split(' ')[0].slice(1).toLowerCase()
          ) : (user?.nombre ? (
            user.nombre.charAt(0).toUpperCase() + user.nombre.slice(1).toLowerCase()
          ) : 'Usuario')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Aquí tienes el resumen actualizado del repositorio académico del colegio.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statsRender.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="stat-card-watermark">
              <Icon size={120} strokeWidth={1.5} />
            </div>
            <div className="stat-icon">
              <Icon size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Tabla proyectos recientes */}
        <div className="card">
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                Proyectos Recientes
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Últimos registros en el repositorio
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/proyectos')}
            >
              Ver todos
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Estudiante(s)</th>
                  <th>Año</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recientes.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '60px 0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: 'var(--bg-icon-special)', padding: 16, borderRadius: 'var(--radius-full)' }}>
                          <FolderOpen size={32} color="var(--text-muted)" />
                        </div>
                        <div>
                          <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Sin proyectos recientes</h4>
                          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>No hay proyectos registrados aún en la plataforma.</p>
                        </div>
                        <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/nuevo-proyecto')}>
                          <Plus size={16} /> Registrar proyecto
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recientes.map(p => (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td>{p.estudiantes.join(', ')}</td>
                      <td>{p.anio}</td>
                      <td>{p.categoria}</td>
                      <td>
                        <button className="btn btn-primary btn-sm">Ver</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Acción rápida */}
          <div className="card card-pad" style={{
            background: 'var(--bg-card-special)',
            border: '2px solid var(--indigo-200)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--indigo-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ¿Tienes un nuevo proyecto?
            </p>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.3 }}>
              Registra un proyecto de investigación
            </h3>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/nuevo-proyecto')}
            >
              <Plus size={16} />
              Nuevo Proyecto
            </button>
          </div>

          {/* Categorías */}
          <div className="card card-pad">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Por Categoría
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categoriasLista.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  No hay categorías registradas.
                </div>
              ) : (
                categoriasLista.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{cat.nombre}</span>
                    <span>0</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
