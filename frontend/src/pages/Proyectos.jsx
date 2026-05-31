// ============================================================
// PAGINA: Proyectos — Registro, Listado e Interactividad
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Download, Users, FileText, Search, Filter, FolderOpen, Edit3, GraduationCap } from 'lucide-react'
import { IS_DEMO_MODE } from '../config/demoMode'
import api, { descargarArchivo } from '../services/api'
import { useAuth } from '../context/AuthContext'
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

// Modal de detalles de proyecto
function DetalleModal({ proyecto, onClose, onStudentClick, onPreviewPdf }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  
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
          {!IS_DEMO_MODE && (user?.rol === 'Director' || user?.rol === 'Subdirector') && (
            <button 
              className="btn btn-secondary"
              style={{ marginRight: 'auto', gap: 6, display: 'inline-flex', alignItems: 'center' }}
              onClick={() => {
                onClose();
                navigate(`/editar-proyecto/${proyecto.id}`);
              }}
            >
              <Edit3 size={14} />
              Editar Proyecto
            </button>
          )}
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
                <FileText size={15} />
                Visualizar PDF
              </button>
              {!IS_DEMO_MODE && (
                <button 
                  className="btn btn-secondary btn-icon"
                  title="Descargar PDF"
                  onClick={() => descargarArchivo(proyecto.rutaPdf, `${proyecto.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)}
                >
                  <Download size={15} />
                </button>
              )}
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

export default function Proyectos() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search,       setSearch]       = useState('')
  const [filterAnio,   setFilterAnio]   = useState('')
  const [filterCat,    setFilterCat]    = useState('')
  
  // Modales
  const [detalle,      setDetalle]      = useState(null)
  const [activePdf,    setActivePdf]    = useState(null)
  const [activeStudent, setActiveStudent] = useState(null)
  
  const [proyectos, setProyectos] = useState([])
  const [categoriasLista, setCategoriasLista] = useState([])
  const [aniosDisponibles, setAniosDisponibles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProyectosData = async () => {
      try {
        const [resProyectos, resCategorias] = await Promise.all([
          api.get('/proyectos?limit=100'),
          api.get('/categorias')
        ])

        if (resProyectos.data?.ok) {
          const rawProyectos = resProyectos.data.proyectos || []
          const mapped = rawProyectos.map(p => ({
            id: p.id_proyecto,
            nombre: p.titulo,
            tema: p.tema || 'General',
            descripcion: p.descripcion || '',
            anio: p.promocion?.anio || p.anio || 'N/A',
            categoria: p.categoria?.nombre || 'General',
            // Mapear objetos de estudiantes completos para clickabilidad
            estudiantes: p.estudiantes?.map(e => ({
              id_estudiante: e.id_estudiante,
              nombre_completo: e.nombre_completo,
              anio_egreso: e.anio_egreso
            })) || [],
            // Mapear tutores para estructura y compatibilidad retroactiva
            tutores: p.tutores?.map(t => ({
              id_tutor: t.id_tutor,
              nb_tutor: t.nb_tutor
            })) || [],
            tutor: p.tutores && p.tutores.length > 0 
              ? p.tutores.map(t => t.nb_tutor).join(', ') 
              : 'No asignado',
            tienePdf: p.archivos && p.archivos.length > 0,
            rutaPdf: p.archivos && p.archivos.length > 0 ? p.archivos[0].ruta_almacenamiento : null,
            resumen_ia: p.resumen_ia
          }))
          setProyectos(mapped)
          
          // Extraer años únicos
          const anios = [...new Set(mapped.map(p => Number(p.anio)).filter(Boolean))].sort((a, b) => b - a)
          setAniosDisponibles(anios)
        }

        if (resCategorias.data?.ok) {
          setCategoriasLista(resCategorias.data.categorias || [])
        }
      } catch (err) {
        console.error('[PROYECTOS] Error al cargar proyectos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProyectosData()
  }, [])

  const filtered = proyectos.filter(p => {
    const matchSearch = !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.estudiantes.some(e => e.nombre_completo.toLowerCase().includes(search.toLowerCase())) ||
      p.tutor.toLowerCase().includes(search.toLowerCase()) ||
      p.tema.toLowerCase().includes(search.toLowerCase())
    const matchAnio = !filterAnio || Number(p.anio) === Number(filterAnio)
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
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', fontSize: 12.5 }}>
                      {p.estudiantes.length > 0 ? (
                        p.estudiantes.slice(0, 2).map((est, sIdx) => (
                          <span 
                            key={est.id_estudiante} 
                            style={{ 
                              color: 'var(--indigo-500)', 
                              fontWeight: 700, 
                              cursor: 'pointer', 
                              textDecoration: 'underline',
                              hover: { color: 'var(--indigo-600)' }
                            }} 
                            onClick={() => setActiveStudent(est.id_estudiante)}
                            title="Haga clic para ver ficha académica"
                          >
                            {est.nombre_completo.split(' ')[0]}
                            {sIdx < Math.min(p.estudiantes.length, 2) - 1 ? ',' : ''}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sin autor</span>
                      )}
                      {p.estudiantes.length > 2 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                          +{p.estudiantes.length - 2}
                        </span>
                      )}
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
                        <>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            title="Visualizar PDF"
                            onClick={() => setActivePdf(p)}
                          >
                            <FileText size={15} className="text-indigo-400" />
                          </button>
                          {!IS_DEMO_MODE && (
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              title="Descargar PDF"
                              onClick={() => descargarArchivo(p.rutaPdf, `${p.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)}
                            >
                              <Download size={15} />
                            </button>
                          )}
                        </>
                      )}
                      {!IS_DEMO_MODE && (user?.rol === 'Director' || user?.rol === 'Subdirector') && (
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          title="Editar Proyecto"
                          onClick={() => navigate(`/editar-proyecto/${p.id}`)}
                        >
                          <Edit3 size={15} />
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

      {/* MODAL DETALLES DEL PROYECTO */}
      {detalle && (
        <DetalleModal 
          proyecto={detalle} 
          onClose={() => setDetalle(null)} 
          onStudentClick={(id) => setActiveStudent(id)}
          onPreviewPdf={(p) => setActivePdf(p)}
        />
      )}

      {/* PREVISUALIZADOR DE PDF INTERACTIVO EN PANTALLA COMPLETA */}
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
            // Mapear al mismo formato y abrir detalle
            const found = proyectos.find(pro => pro.id === p.id_proyecto);
            if (found) {
              setDetalle(found);
            }
          }}
        />
      )}
    </div>
  )
}
