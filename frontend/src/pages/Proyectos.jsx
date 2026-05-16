import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Download, Users, FileText, Search, Filter, FolderOpen } from 'lucide-react'
import api from '../services/api'

const CATEGORIA_COLORS = {
  'Tecnología':     'indigo',
  'Salud':          'green',
  'Medio Ambiente': 'green',
  'Transporte':     'amber',
  'Educación':      'purple',
  'Otro':           'navy',
}

function DetalleModal({ proyecto, onClose }) {
  if (!proyecto) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className={`badge badge-${CATEGORIA_COLORS[proyecto.categoria] || 'navy'}`} style={{ marginBottom: 8, display: 'inline-block' }}>
              {proyecto.categoria}
            </span>
            <h3 style={{ maxWidth: 460, lineHeight: 1.4 }}>{proyecto.nombre}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid" style={{ marginBottom: 20 }}>
            <div>
              <div className="detail-label">Año de Promoción</div>
              <div className="detail-value">{proyecto.anio}</div>
            </div>
            <div>
              <div className="detail-label">Fecha de Registro</div>
              <div className="detail-value">
                {new Date(proyecto.fechaRegistro || Date.now()).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div className="detail-label">Estudiante(s) Responsable(s)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {proyecto.estudiantes && proyecto.estudiantes.map(est => (
                <span key={est} className="badge badge-navy" style={{ padding: '5px 12px' }}>
                  <Users size={12} style={{ marginRight: 5 }} />
                  {est}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div className="detail-label">Tema Específico</div>
            <div className="detail-value">{proyecto.tema}</div>
          </div>
          <div>
            <div className="detail-label">Descripción del Proyecto</div>
            <div className="detail-value" style={{ marginTop: 6, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              {proyecto.descripcion}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {proyecto.tienePdf ? (
            <button className="btn btn-primary">
              <Download size={15} />
              Descargar PDF
            </button>
          ) : (
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              <FileText size={13} style={{ display:'inline', marginRight: 4 }} />
              PDF no disponible
            </span>
          )}
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

export default function Proyectos() {
  const navigate = useNavigate()
  const [search,       setSearch]       = useState('')
  const [filterAnio,   setFilterAnio]   = useState('')
  const [filterCat,    setFilterCat]    = useState('')
  const [detalle,      setDetalle]      = useState(null)
  
  const [proyectos, setProyectos] = useState([])
  const [categoriasLista, setCategoriasLista] = useState([])
  const [aniosDisponibles, setAniosDisponibles] = useState([])

  const filtered = proyectos.filter(p => {
    const matchSearch = !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.estudiantes.some(e => e.toLowerCase().includes(search.toLowerCase())) ||
      p.tema.toLowerCase().includes(search.toLowerCase())
    const matchAnio = !filterAnio || p.anio === Number(filterAnio)
    const matchCat  = !filterCat  || p.categoria === filterCat
    return matchSearch && matchAnio && matchCat
  })

  return (
    <div className="page-content page-enter">
      <div className="page-header" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => navigate('/nuevo-proyecto')}>
          <Plus size={16} />
          Nuevo Proyecto
        </button>
      </div>

      {/* Filtros */}
      <div className="card card-pad" style={{ marginBottom: 24, background: 'var(--bg-card-special)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, estudiante o tema..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 160 }}
            value={filterAnio}
            onChange={e => setFilterAnio(e.target.value)}
          >
            <option value="">Año</option>
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            className="form-select"
            style={{ width: 180 }}
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="">Categoría</option>
            {categoriasLista.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
          {(search || filterAnio || filterCat) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setFilterAnio(''); setFilterCat('') }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Conteo */}
      <div style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <Filter size={14} />
        Mostrando <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> de {proyectos.length} proyectos
      </div>

      {/* Tabla */}
      {proyectos.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FolderOpen size={30} /></div>
            <h3>Aún no hay proyectos</h3>
            <p>No hay proyectos registrados aún en la plataforma.</p>
            <button className="btn btn-primary" onClick={() => navigate('/nuevo-proyecto')}>
              <Plus size={16} />
              Crear primer proyecto
            </button>
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre del Proyecto</th>
                <th>Estudiante(s)</th>
                <th>Año</th>
                <th>Categoría</th>
                <th>PDF</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setDetalle(p)}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 600, width: 36 }}>{idx+1}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5, maxWidth: 320 }}>
                      {p.nombre}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{p.tema}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      <Users size={13} />
                      {p.estudiantes.length > 1
                        ? `${p.estudiantes[0]} +${p.estudiantes.length - 1}`
                        : p.estudiantes[0]}
                    </div>
                  </td>
                  <td><span className="badge badge-navy">{p.anio}</span></td>
                  <td>
                    <span className={`badge badge-${CATEGORIA_COLORS[p.categoria] || 'navy'}`}>
                      {p.categoria}
                    </span>
                  </td>
                  <td>
                    {p.tienePdf
                      ? <span className="badge badge-green">✓ Disponible</span>
                      : <span className="badge badge-navy">Sin PDF</span>}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Ver detalles"
                        onClick={() => setDetalle(p)}
                      >
                        <Eye size={15} />
                      </button>
                      {p.tienePdf && (
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="Descargar PDF"
                        >
                          <Download size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={30} /></div>
            <h3>Sin resultados</h3>
            <p>No se encontraron proyectos para los filtros aplicados.</p>
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilterAnio(''); setFilterCat('') }}>
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {detalle && <DetalleModal proyecto={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}
