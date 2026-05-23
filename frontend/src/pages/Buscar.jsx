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
  const [proyectos, setProyectos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [aniosDisponibles] = useState([2026, 2025, 2024, 2023, 2022])
  const [loading, setLoading] = useState(false)
  
  const [busqueda,    setBusqueda]    = useState('')
  const [filterAnio,  setFilterAnio]  = useState('')
  const [filterCat,   setFilterCat]   = useState('')
  const [filterPdf,   setFilterPdf]   = useState(false)

  // Cargar categorías iniciales desde el backend
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const res = await api.get('/categorias')
        if (res.data?.ok) {
          setCategorias(res.data.categorias || [])
        }
      } catch (err) {
        console.error('[BUSCADOR] Error al cargar categorías:', err)
      }
    }
    cargarCategorias()
  }, [])

  // Buscar en el backend de forma reactiva ante cambios con debounce
  useEffect(() => {
    const ejecutarBusqueda = async () => {
      const tieneFiltros = busqueda.trim() !== '' || filterAnio !== '' || filterCat !== '' || filterPdf
      if (!tieneFiltros) {
        setProyectos([])
        return
      }

      setLoading(true)
      try {
        const res = await api.get('/proyectos/buscar', {
          params: {
            q: busqueda.trim() || undefined,
            anio: filterAnio || undefined,
            categoria: filterCat || undefined,
            tiene_pdf: filterPdf ? true : undefined
          }
        })
        if (res.data?.ok) {
          setProyectos(res.data.proyectos || [])
        }
      } catch (err) {
        console.error('[BUSCADOR] Error al buscar proyectos:', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      ejecutarBusqueda()
    }, 300)

    return () => clearTimeout(timer)
  }, [busqueda, filterAnio, filterCat, filterPdf])

  const activeChips = [
    filterAnio && { key: 'anio', label: `Año: ${filterAnio}`, clear: () => setFilterAnio('') },
    filterCat  && { key: 'cat',   label: `Cat: ${filterCat}`,   clear: () => setFilterCat('') },
    filterPdf  && { key: 'pdf',   label: `Solo con PDF`,        clear: () => setFilterPdf(false) },
  ].filter(Boolean)

  const filtered = proyectos

  const hasSearch = busqueda.trim() !== '' || filterAnio !== '' || filterCat !== '' || filterPdf;

  return (
    <div className="page-content page-enter">

      <div className="card card-pad" style={{ marginBottom: 24, background: 'var(--bg-card-special)' }}>
        <div className="search-filters-grid">
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
            {categorias.map(c => <option key={c.id_categoria || c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={filterPdf} onChange={e => setFilterPdf(e.target.checked)} />
            Solo con PDF
          </label>
        </div>

        {activeChips.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filtros activos:</span>
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
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card-special)' }}>
          <Search size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Escribe para comenzar a buscar
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Ingresa un término o selecciona un filtro arriba para encontrar proyectos
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)' }}>
            Se encontraron <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> resultados
          </div>

          {filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(p => {
            const tienePdf = p.archivos && p.archivos.length > 0;
            const linkPdf = tienePdf ? `http://localhost:3001${p.archivos[0].ruta_almacenamiento}` : null;
            const nombreCategoria = p.categoria?.nombre || 'General';
            
            return (
              <div key={p.id_proyecto} className="card card-pad search-result-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{p.titulo}</h3>
                    <span className="badge badge-navy" style={{ fontSize: 11 }}>{p.promocion?.anio || 'N/A'}</span>
                    <span className={`badge badge-${CATEGORIA_COLORS[nombreCategoria] || 'navy'}`} style={{ fontSize: 11 }}>
                      {nombreCategoria}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.descripcion_breve || 'Sin descripción disponible.'}
                  </p>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={14} />
                      {p.estudiantes?.map(e => e.nombre_completo).join(', ') || 'Sin autor registrado'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag size={14} />
                      Tema: {p.tema || 'General'}
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
                  {tienePdf && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => window.open(linkPdf, '_blank')}
                    >
                      <Download size={15} /> Descargar PDF
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card-special)' }}>
          <FolderOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            No hay proyectos que coincidan
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Prueba ajustando los filtros o los términos de búsqueda
          </p>
        </div>
      )}
        </>
      )}
    </div>
  )
}
