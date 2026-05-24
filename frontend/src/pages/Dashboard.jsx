// ============================================================
// PAGINA: Dashboard Principal — Centro Analítico Avanzado
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, Users, Tag, FileText,
  TrendingUp, Plus, ArrowRight, Download, Eye, LayoutGrid
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// ── 1. GRÁFICO DONA INTERACTIVO (DISTRIBUCIÓN POR CATEGORÍA) ──
function DonutChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 13 }}>Sin datos temáticos registrados.</div>
  }

  const total = data.reduce((acc, curr) => acc + curr.cantidad, 0)
  
  const colors = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
  ]

  let accumulatedPercentage = 0
  const radius = 50
  const circ = 2 * Math.PI * radius

  const slices = data.map((item, idx) => {
    const percentage = item.cantidad / total
    const strokeLength = circ * percentage
    const strokeOffset = circ - (circ * accumulatedPercentage)
    accumulatedPercentage += percentage
    
    return {
      ...item,
      percentage: (percentage * 100).toFixed(1),
      strokeLength,
      strokeOffset,
      color: colors[idx % colors.length]
    }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 150, height: 150, flexShrink: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--border-subtle)" strokeWidth="10" />
          {slices.map((slice, idx) => (
            <circle
              key={slice.nombre}
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={hoveredIdx === idx ? 14 : 10}
              strokeDasharray={`${slice.strokeLength} ${circ}`}
              strokeDashoffset={slice.strokeOffset}
              style={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          width: '90px'
        }}>
          {hoveredIdx !== null ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, color: slices[hoveredIdx].color, lineHeight: 1 }}>
                {slices[hoveredIdx].percentage}%
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {slices[hoveredIdx].nombre}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {total}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>
                Temáticas
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Leyendas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
        {slices.slice(0, 5).map((slice, idx) => (
          <div 
            key={slice.nombre} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              fontSize: 12,
              opacity: hoveredIdx === null || hoveredIdx === idx ? 1 : 0.4,
              transition: 'opacity 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: slice.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slice.nombre}</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginLeft: 8 }}>{slice.cantidad}</span>
          </div>
        ))}
        {slices.length > 5 && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 14, fontStyle: 'italic' }}>
            + {slices.length - 5} áreas adicionales
          </div>
        )}
      </div>
    </div>
  )
}

// ── 2. GRÁFICO BARRAS INTERACTIVO (DISTRIBUCIÓN POR AÑO) ──
function BarChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 13 }}>Sin datos anuales registrados.</div>
  }

  const maxVal = Math.max(...data.map(d => d.cantidad), 1)
  
  return (
    <div style={{ height: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 10px 0', position: 'relative' }}>
      {data.map((item, idx) => {
        const heightPercent = (item.cantidad / maxVal) * 100
        return (
          <div 
            key={item.anio}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              flex: 1, 
              height: '100%', 
              justifyContent: 'flex-end',
              cursor: 'pointer',
              position: 'relative'
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Tooltip flotante */}
            {hoveredIdx === idx && (
              <div style={{
                position: 'absolute',
                bottom: `calc(${heightPercent}% + 28px)`,
                backgroundColor: 'var(--navy-900)',
                color: '#ffffff',
                fontSize: 10.5,
                padding: '4px 8px',
                borderRadius: 6,
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap',
                zIndex: 2,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {item.cantidad} {item.cantidad === 1 ? 'proyecto' : 'proyectos'}
              </div>
            )}
            
            {/* Barra */}
            <div 
              style={{
                width: '50%',
                maxWidth: 20,
                height: `${heightPercent}%`,
                background: hoveredIdx === idx 
                  ? 'linear-gradient(to top, #4f46e5, #818cf8)' 
                  : 'linear-gradient(to top, #1e1b4b, #4f46e5)',
                borderRadius: '4px 4px 0 0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: hoveredIdx === idx ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none'
              }}
            />
            
            {/* Año */}
            <div style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              color: hoveredIdx === idx ? 'var(--indigo-500)' : 'var(--text-secondary)', 
              marginTop: 8,
              transition: 'color 0.2s ease'
            }}>
              {item.anio}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 3. GRÁFICO LÍNEA/ÁREA INTERACTIVO (TENDENCIA MENSUAL) ──
function TrendChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 13 }}>Sin datos históricos disponibles.</div>
  }

  const maxVal = Math.max(...data.map(d => d.cantidad), 1)
  const width = 600
  const height = 120
  const padding = 20
  
  const points = data.map((item, idx) => {
    const x = padding + (idx * (width - 2 * padding)) / (data.length - 1)
    const y = height - padding - (item.cantidad / maxVal) * (height - 2 * padding)
    return { x, y, ...item }
  })

  // Generar línea del path
  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 
      ? `M ${curr.x} ${curr.y}` 
      : `${acc} L ${curr.x} ${curr.y}`
  }, '')

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Eje Base */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-subtle)" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="3 3" />

        {/* Sombras del Área */}
        <path d={areaD} fill="url(#areaGrad)" style={{ transition: 'all 0.3s ease' }} />

        {/* Línea principal */}
        <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.3s ease' }} />

        {/* Puntos de control */}
        {points.map((pt, idx) => (
          <g key={pt.mes}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredIdx === idx ? 5.5 : 3.5}
              fill={hoveredIdx === idx ? '#4f46e5' : '#6366f1'}
              stroke="#ffffff"
              strokeWidth="1.5"
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            <text
              x={pt.x}
              y={height - 4}
              textAnchor="middle"
              fill={hoveredIdx === idx ? 'var(--indigo-500)' : 'var(--text-secondary)'}
              style={{ fontSize: 9, fontWeight: 700, transition: 'fill 0.2s ease' }}
            >
              {pt.mes}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Tooltip flotante */}
      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          top: `${points[hoveredIdx].y - 32}px`,
          left: `calc(${(points[hoveredIdx].x / width) * 100}% - 40px)`,
          backgroundColor: 'var(--navy-900)',
          color: '#ffffff',
          fontSize: 10,
          padding: '4px 8px',
          borderRadius: 6,
          fontWeight: 700,
          boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          {points[hoveredIdx].mes}: {points[hoveredIdx].cantidad} {points[hoveredIdx].cantidad === 1 ? 'proyecto' : 'proyectos'}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Estado inicial enriquecido para soportar la analítica avanzada
  const [stats, setStats] = useState({
    totalProyectos: 0,
    totalPdfs: 0,
    usuariosActivos: 0,
    espacioUsadoDiscoBytes: 0,
    limiteDiscoBytes: 15360 * 1024 * 1024,
    porcentajeUso: 0,
    proyectosPorCategoria: [],
    proyectosPorAnio: [],
    tendenciaCarga: []
  })
  const [recientes, setRecientes] = useState([])
  const [categoriasLista, setCategoriasLista] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resStats, resProyectos, resCategorias] = await Promise.all([
          api.get(`/dashboard/stats?_t=${Date.now()}`),
          api.get(`/proyectos?limit=5&_t=${Date.now()}`),
          api.get(`/categorias?_t=${Date.now()}`)
        ])

        if (resStats.data?.ok) {
          setStats(resStats.data.stats)
        }

        if (resProyectos.data?.ok) {
          setRecientes(resProyectos.data.proyectos || [])
        }

        if (resCategorias.data?.ok) {
          setCategoriasLista(resCategorias.data.categorias || [])
        }
      } catch (err) {
        console.error('[DASHBOARD] Error al cargar datos del dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statsRender = [
    { label: 'Total Proyectos',         value: stats.totalProyectos,        icon: FolderOpen,   color: 'emerald' },
    { label: 'PDFs Almacenados',        value: stats.totalPdfs,             icon: FileText,     color: 'blue' },
    { label: 'Usuarios Activos',        value: stats.usuariosActivos,       icon: Users,        color: 'orange'  },
    { label: 'Espacio Usado (Drive)',   value: `${(stats.espacioUsadoDiscoBytes / 1024 / 1024).toFixed(1)} MB / 15 GB`, icon: TrendingUp,   color: 'rose'  },
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
          Aquí tienes el resumen analítico y de control del repositorio académico del colegio.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
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

      {/* CAPA ANALÍTICA AVANZADA (GRÁFICOS SVG INTERACTIVOS) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 24, 
          marginBottom: 24 
        }}
      >
        {/* Gráfico 1: Producción Científica Anual */}
        <div className="card card-pad">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>
              Producción Científica por Promoción
            </h3>
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Número de proyectos publicados por año de egreso
            </p>
          </div>
          <BarChart data={stats.proyectosPorAnio} />
        </div>
        
        {/* Gráfico 2: Distribución Temática */}
        <div className="card card-pad">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>
              Distribución Temática por Categoría
            </h3>
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              Proporción y volumen por área temática de investigación
            </p>
          </div>
          <DonutChart data={stats.proyectosPorCategoria} />
        </div>
      </div>

      {/* Gráfico 3: Carga mensual a ancho completo */}
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>
            Evolución y Carga Histórica del Repositorio
          </h3>
          <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
            Tendencia de registro de proyectos de los últimos 6 meses de gestión escolar
          </p>
        </div>
        <TrendChart data={stats.tendenciaCarga} />
      </div>

      {/* Contenido principal */}
      <div className="dashboard-layout">
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
          {recientes.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
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
            </div>
          ) : (
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
                  {recientes.map(p => (
                    <tr key={p.id_proyecto}>
                      <td style={{ fontWeight: 600 }}>{p.titulo}</td>
                      <td>{p.estudiantes?.map(e => e.nombre_completo).join(', ') || 'Sin autor'}</td>
                      <td>{p.promocion?.anio || 'N/A'}</td>
                      <td>{p.categoria?.nombre || 'General'}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/proyectos')}>Ver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                  <div key={cat.id_categoria || cat.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{cat.nombre}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>✓</span>
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
