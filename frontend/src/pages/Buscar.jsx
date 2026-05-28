// ============================================================
// PAGINA: Buscador Avanzado — Búsqueda Avanzada y Red Egresados
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderOpen, Tag, Users, Download, Eye, X, FileText, GraduationCap } from 'lucide-react'
import api, { descargarArchivo } from '../services/api'
import PdfPreviewModal from '../components/PdfPreviewModal'
import EgresadoProfileModal from '../components/EgresadoProfileModal'

const CATEGORIA_COLORS = {
  'Tecnología':     'indigo',
  'Salud':          'green',
  'Medio Ambiente': 'green',
  'Transporte':     'amber',
  'Educación':      'purple',
  'Otro':           'navy',
}

// Modal de detalles de proyecto reutilizado localmente
function DetalleModal({ proyecto, onClose, onStudentClick, onPreviewPdf }) {
  if (!proyecto) return null
  
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 900 }}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ animation: 'modalEnter 0.3s ease' }}>
        <div className="modal-header">
          <div>
            <span className={`badge badge-${CATEGORIA_COLORS[proyecto.categoria] || 'navy'}`} style={{ marginBottom: 8, display: 'inline-block' }}>
              {proyecto.categoria}
            </span>
            <h3 style={{ maxWidth: 460, lineHeight: 1.4, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{proyecto.nombre}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid" style={{ marginBottom: 20 }}>
            <div>
              <div className="detail-label">Año de Promoción</div>
              <div className="detail-value" style={{ fontSize: '14px', fontWeight: 700 }}>{proyecto.anio}</div>
            </div>
            <div>
              <div className="detail-label">Fecha de Registro</div>
              <div className="detail-value">
                {new Date(proyecto.fechaRegistro || Date.now()).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div className="detail-label" style={{ marginBottom: 8 }}>Estudiante(s) Responsable(s) (Coautores)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {proyecto.estudiantes && proyecto.estudiantes.length > 0 ? (
                proyecto.estudiantes.map(est => (
                  <span 
                    key={est.id_estudiante} 
                    className="badge badge-navy clickable-student" 
                    style={{ 
                      padding: '6px 12px', 
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                      border: '1px solid rgba(99, 102, 241, 0.1)'
                    }}
                    onClick={() => {
                      onClose();
                      onStudentClick(est.id_estudiante);
                    }}
                    title="Haga clic para ver la ficha académica"
                  >
                    <Users size={12} />
                    <span style={{ textDecoration: 'underline', fontWeight: 600 }}>{est.nombre_completo}</span>
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin estudiantes autores</span>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div className="detail-label" style={{ marginBottom: 8 }}>Tutor(es) Asesor(es)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {proyecto.tutores && proyecto.tutores.length > 0 ? (
                proyecto.tutores.map(tut => (
                  <span 
                    key={tut.id_tutor} 
                    className="badge badge-indigo" 
                    style={{ 
                      padding: '6px 12px', 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      color: 'var(--indigo-600)',
                      fontWeight: 600
                    }}
                  >
                    <GraduationCap size={13} />
                    <span>{tut.nb_tutor}</span>
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin tutor asignado</span>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div className="detail-label">Tema Específico</div>
            <div className="detail-value" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{proyecto.tema}</div>
          </div>
          <div>
            <div className="detail-label">Descripción del Proyecto</div>
            <div className="detail-value" style={{ marginTop: 6, lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '13.5px' }}>
              {proyecto.descripcion}
            </div>
          </div>

          {/* ANÁLISIS CIENTÍFICO CON GEMINI AI */}
          {proyecto.resumen_ia && (() => {
            let resumenObj = null;
            try {
              resumenObj = typeof proyecto.resumen_ia === 'string' 
                ? JSON.parse(proyecto.resumen_ia) 
                : proyecto.resumen_ia;
            } catch (e) {
              console.error('Error al parsear resumen_ia:', e);
            }

            if (!resumenObj || !resumenObj.resumen_estructurado) return null;
            const struct = resumenObj.resumen_estructurado;

            return (
              <div style={{ 
                marginTop: 24, 
                padding: '20px', 
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%)',
                borderRadius: '14px', 
                border: '1px solid rgba(99, 102, 241, 0.15)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 18 }}>✨</span>
                  <h4 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--indigo-400)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Indexación Científica IA (Gemini 2.0)
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {struct.problema_planteado && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        🔍 Problema Planteado
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                        {struct.problema_planteado}
                      </div>
                    </div>
                  )}

                  {struct.objetivo_general && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        🎯 Objetivo General
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                        {struct.objetivo_general}
                      </div>
                    </div>
                  )}

                  {struct.metodologia && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        🧪 Metodología de Campo
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                        {struct.metodologia}
                      </div>
                    </div>
                  )}

                  {struct.resultados_principales && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        🏆 Resultados y Hallazgos
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                        {struct.resultados_principales}
                      </div>
                    </div>
                  )}

                  {struct.conclusiones && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        🎓 Conclusiones del Autor
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                        {struct.conclusiones}
                      </div>
                    </div>
                  )}

                  {struct.palabras_clave && struct.palabras_clave.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(99, 102, 241, 0.1)', paddingTop: 12, marginTop: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 8 }}>
                        🏷️ Palabras Clave Indexadas
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {struct.palabras_clave.map(kw => (
                          <span 
                            key={kw} 
                            className="badge badge-indigo"
                            style={{ 
                              fontSize: 11, 
                              fontWeight: 600, 
                              padding: '4px 10px', 
                              borderRadius: 6,
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: 'var(--indigo-400)',
                              border: '1px solid rgba(99, 102, 241, 0.2)'
                            }}
                          >
                            #{kw.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
        <div className="modal-footer">
          {proyecto.tienePdf ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-primary"
                style={{ gap: 6, display: 'inline-flex', alignItems: 'center' }}
                onClick={() => {
                  onClose();
                  onPreviewPdf(proyecto);
                }}
              >
                <Eye size={15} />
                Visualizar PDF
              </button>
              <button 
                className="btn btn-secondary btn-icon"
                title="Descargar PDF"
                onClick={() => descargarArchivo(proyecto.rutaPdf, `${proyecto.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)}
              >
                <Download size={15} />
              </button>
            </div>
          ) : (
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <FileText size={13} />
              PDF no disponible
            </span>
          )}
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
      
      <style>{`
        .clickable-student:hover {
          background-color: var(--indigo-600) !important;
          color: #ffffff !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
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

  // Modales
  const [detalle,      setDetalle]      = useState(null)
  const [activePdf,    setActivePdf]    = useState(null)
  const [activeStudent, setActiveStudent] = useState(null)

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
            Se encontraron <strong style={{ color: 'var(--text-primary)' }}>{proyectos.length}</strong> resultados
          </div>

          {proyectos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {proyectos.map(p => {
                const tienePdf = p.archivos && p.archivos.length > 0;
                const nombreCategoria = p.categoria?.nombre || 'General';
                
                // Formatear al vuelo el objeto proyecto para el modal de detalle
                const projectObj = {
                  id: p.id_proyecto,
                  nombre: p.titulo,
                  tema: p.tema || 'General',
                  descripcion: p.descripcion || '',
                  anio: p.promocion?.anio || p.anio || 'N/A',
                  categoria: nombreCategoria,
                  estudiantes: p.estudiantes?.map(e => ({
                    id_estudiante: e.id_estudiante,
                    nombre_completo: e.nombre_completo,
                    anio_egreso: e.anio_egreso
                  })) || [],
                  tutores: p.tutores?.map(t => ({
                    id_tutor: t.id_tutor,
                    nb_tutor: t.nb_tutor
                  })) || [],
                  tutor: p.tutores && p.tutores.length > 0 
                    ? p.tutores.map(t => t.nb_tutor).join(', ') 
                    : 'No asignado',
                  tienePdf: tienePdf,
                  rutaPdf: tienePdf ? p.archivos[0].ruta_almacenamiento : null,
                  resumen_ia: p.resumen_ia
                };

                return (
                  <div key={p.id_proyecto} className="card card-pad search-result-card">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{p.titulo}</h3>
                        <span className="badge badge-navy" style={{ fontSize: 11 }}>{p.promocion?.anio || 'N/A'}</span>
                        <span className={`badge badge-${CATEGORIA_COLORS[nombreCategoria] || 'navy'}`} style={{ fontSize: 11 }}>
                          {nombreCategoria}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.descripcion_breve || 'Sin descripción disponible.'}
                      </p>

                      <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Users size={14} />
                          {p.estudiantes && p.estudiantes.length > 0 ? (
                            p.estudiantes.map((est, eIdx) => (
                              <span 
                                key={est.id_estudiante} 
                                style={{ 
                                  color: 'var(--indigo-500)', 
                                  fontWeight: 700, 
                                  cursor: 'pointer', 
                                  textDecoration: 'underline' 
                                }}
                                onClick={() => setActiveStudent(est.id_estudiante)}
                                title="Ver ficha académica"
                              >
                                {est.nombre_completo}
                                {eIdx < p.estudiantes.length - 1 ? ', ' : ''}
                              </span>
                            ))
                          ) : (
                            <span>Sin autor registrado</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <GraduationCap size={14} />
                          Tutor: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{projectObj.tutor}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Tag size={14} />
                          Tema: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{p.tema || 'General'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setDetalle(projectObj)}
                      >
                        <Eye size={15} /> Ver detalles
                      </button>
                      {tienePdf && (
                        <>
                          <button
                            className="btn btn-secondary"
                            style={{ gap: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setActivePdf(projectObj)}
                          >
                            <Eye size={15} className="text-indigo-400" /> Visualizar PDF
                          </button>
                          <button 
                            className="btn btn-primary"
                            onClick={() => descargarArchivo(p.archivos[0].ruta_almacenamiento, `${p.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)}
                          >
                            <Download size={15} /> Descargar PDF
                          </button>
                        </>
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

      {/* MODAL DETALLES DEL PROYECTO */}
      {detalle && (
        <DetalleModal 
          proyecto={detalle} 
          onClose={() => setDetalle(null)} 
          onStudentClick={(id) => setActiveStudent(id)}
          onPreviewPdf={(p) => setActivePdf(p)}
        />
      )}

      {/* VISUALIZADOR DE PDF INTERACTIVO EN PANTALLA COMPLETA */}
      {activePdf && (
        <PdfPreviewModal
          isOpen={!!activePdf}
          fileUrl={activePdf.rutaPdf}
          fileName={`${activePdf.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
          projectTitle={activePdf.nombre}
          onClose={() => setActivePdf(null)}
        />
      )}

      {/* FICHA ACADÉMICA DE EGRESADO */}
      {activeStudent && (
        <EgresadoProfileModal
          idEstudiante={activeStudent}
          onClose={() => setActiveStudent(null)}
          onProyectoClick={(p) => {
            setActiveStudent(null);
            // Mapear y abrir detalle
            setDetalle(p);
          }}
        />
      )}
    </div>
  )
}
