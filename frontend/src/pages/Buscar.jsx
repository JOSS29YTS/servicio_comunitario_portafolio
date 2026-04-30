import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderOpen, Tag, Users, Download, Eye, X } from 'lucide-react'
import api from '../services/api'

const CATEGORIA_COLORS = {
  'Tecnología':     'indigo',
  'Salud':          'green',
  'Medio Ambiente': 'green',
  'Transporte':     'amber',
  'Educación':      'purple',
  'Otro':           'navy',
}

export default function Buscar() {
  const navigate = useNavigate()
  const [proyectos] = useState([])
  const [categorias] = useState([])
  const [aniosDisponibles] = useState([])
  
  const [busqueda,    setBusqueda]    = useState('')
  const [filterAnio,  setFilterAnio]  = useState('')
  const [filterCat,   setFilterCat]   = useState('')
  const [filterPdf,   setFilterPdf]   = useState(false)

  const activeChips = [
    filterAnio && { key: 'anio', label: `Año: ${filterAnio}`, clear: () => setFilterAnio('') },
    filterCat  && { key: 'cat',   label: `Cat: ${filterCat}`,   clear: () => setFilterCat('') },
    filterPdf  && { key: 'pdf',   label: `Solo con PDF`,        clear: () => setFilterPdf(false) },
  ].filter(Boolean)

  const filtered = proyectos.filter(p => {
    const q = busqueda.toLowerCase()
    const match = !busqueda ||
      p.nombre.toLowerCase().includes(q) ||
      p.estudiantes.some(e => e.toLowerCase().includes(q)) ||
      p.tema.toLowerCase().includes(q)
    return match &&
      (!filterAnio || p.anio === Number(filterAnio)) &&
      (!filterCat  || p.categoria === filterCat) &&
      (!filterPdf  || p.tienePdf)
  })

  const hasSearch = busqueda.trim() !== '' || filterAnio !== '' || filterCat !== '' || filterPdf;

  return (
    <div className="page-content page-enter">

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 140px 180px auto', gap: 16, alignItems: 'center' }}>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por estudiante, título, tema..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ fontSize: 15 }}
            />
          </div>

          <select
            className="form-select"
            value={filterAnio}
            onChange={e => setFilterAnio(e.target.value)}
          >
            <option value="">Cualquier año</option>
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            className="form-select"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--navy-700)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={filterPdf} onChange={e => setFilterPdf(e.target.checked)} />
            Solo con PDF
          </label>
        </div>

        {activeChips.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--navy-500)' }}>Filtros activos:</span>
            {activeChips.map(chip => (
              <span key={chip.key} className="badge badge-indigo" style={{ padding: '6px 10px', fontSize: 12, fontWeight: 500 }}>
                {chip.label}
                <button
                  onClick={chip.clear}
                  style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: 6, cursor: 'pointer', display: 'flex' }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              onClick={() => { setBusqueda(''); setFilterAnio(''); setFilterCat(''); setFilterPdf(false); }}
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto', fontSize: 12 }}
            >
              Limpiar todos
            </button>
          </div>
        )}
      </div>

      {!hasSearch ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Search size={40} color="var(--navy-300)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy-800)', marginBottom: 8 }}>
            Escribe para comenzar a buscar
          </h3>
          <p style={{ color: 'var(--navy-500)', fontSize: 14 }}>
            Ingresa un término o selecciona un filtro arriba para encontrar proyectos
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--navy-500)' }}>
            Se encontraron <strong style={{ color: 'var(--navy-900)' }}>{filtered.length}</strong> resultados
          </div>

          {filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} className="card card-pad" style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 20,
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy-900)' }}>{p.nombre}</h3>
                  <span className="badge badge-navy" style={{ fontSize: 11 }}>{p.anio}</span>
                  <span className={`badge badge-${CATEGORIA_COLORS[p.categoria] || 'navy'}`} style={{ fontSize: 11 }}>
                    {p.categoria}
                  </span>
                </div>
                
                <p style={{ fontSize: 13.5, color: 'var(--navy-600)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.descripcion}
                </p>

                <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--navy-500)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={14} />
                    {p.estudiantes.join(', ')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag size={14} />
                    Tema: {p.tema}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/proyectos')}
                >
                  <Eye size={15} /> Ver detalles
                </button>
                {p.tienePdf && (
                  <button className="btn btn-primary">
                    <Download size={15} /> Descargar PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FolderOpen size={40} color="var(--navy-300)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy-800)', marginBottom: 8 }}>
            No hay proyectos que coincidan
          </h3>
          <p style={{ color: 'var(--navy-500)', fontSize: 14 }}>
            Prueba ajustando los filtros o los términos de búsqueda
          </p>
        </div>
      )}
        </>
      )}
    </div>
  )
}
