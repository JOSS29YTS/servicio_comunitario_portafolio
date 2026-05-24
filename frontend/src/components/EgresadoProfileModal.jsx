// ============================================================
// COMPONENTE: Ficha Académica de Egresado (Graduate Profile Modal)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
import React, { useState, useEffect } from 'react'
import { GraduationCap, FolderGit2, Users2, X, ChevronRight, BookOpen } from 'lucide-react'
import api from '../services/api'

export default function EgresadoProfileModal({ idEstudiante, onClose, onProyectoClick }) {
  const [activeId, setActiveId] = useState(idEstudiante)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Disparar re-petición cuando cambie el activeId (soporta navegación cruzada infinita)
  useEffect(() => {
    const fetchEgresadoProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get(`/estudiantes/${activeId}`)
        if (res.data?.ok) {
          setProfile(res.data.estudiante)
        } else {
          setError('No se pudo recuperar el perfil académico.')
        }
      } catch (err) {
        console.error('[EGRESADO PROFILE] Error al cargar ficha:', err)
        setError('Error al conectar con el servidor.')
      } finally {
        setLoading(false)
      }
    }

    if (activeId) {
      fetchEgresadoProfile()
    }
  }, [activeId])

  // Sincronizar el id inicial si cambia la propiedad de entrada
  useEffect(() => {
    setActiveId(idEstudiante)
  }, [idEstudiante])

  if (!idEstudiante) return null

  // Obtener iniciales para el avatar premium
  const getInitials = (name) => {
    if (!name) return 'EG'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  // Paleta de gradientes HSL armónicos para el avatar
  const avatarGradients = [
    'linear-gradient(135deg, #4f46e5, #06b6d4)',
    'linear-gradient(135deg, #10b981, #3b82f6)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #f59e0b, #e11d48)'
  ]
  const avatarGradient = avatarGradients[activeId % avatarGradients.length]

  return (
    <div 
      className="modal-overlay"
      style={{
        zIndex: 990,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'backdropFade 0.25s ease'
      }}
      onClick={onClose}
    >
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          background: 'var(--bg-card)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera / Botón de Cierre */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px', position: 'absolute', right: 0, top: 0, zIndex: 10 }}>
          <button 
            className="btn btn-ghost btn-icon btn-sm" 
            style={{ 
              color: 'var(--text-muted)', 
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '50%'
            }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTENEDOR CON SCROLL */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 24px' }} className="custom-scrollbar">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: 16 }}>
              <div 
                style={{ 
                  width: 40, height: 40, 
                  border: '3px solid rgba(99, 102, 241, 0.1)', 
                  borderTop: '3px solid var(--indigo-500)', 
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} 
              />
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Consultando ficha académica...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--red-400)' }}>
              <p style={{ fontWeight: 600 }}>{error}</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={onClose}>Cerrar</button>
            </div>
          ) : profile ? (
            <>
              {/* Encabezado / Tarjeta de Identidad */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 24, 
                  paddingBottom: 28, 
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 24,
                  flexWrap: 'wrap'
                }}
              >
                {/* Avatar Académico */}
                <div 
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: avatarGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 24,
                    fontWeight: 800,
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {getInitials(profile.nombre_completo)}
                </div>

                {/* Info Académica */}
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span 
                      className="badge badge-indigo"
                      style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        letterSpacing: '0.05em', 
                        textTransform: 'uppercase',
                        padding: '4px 8px'
                      }}
                    >
                      Egresado
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <GraduationCap size={13} />
                      Promoción {profile.anio_egreso}
                    </span>
                  </div>
                  <h2 
                    style={{ 
                      fontSize: 22, 
                      fontWeight: 800, 
                      color: 'var(--text-primary)', 
                      marginTop: 6,
                      lineHeight: 1.2
                    }}
                  >
                    {profile.nombre_completo}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                    Ficha y Trazabilidad del Estudiante Responsable
                  </p>
                </div>

                {/* Métricas rápidas */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ background: 'var(--bg-card-special)', padding: '10px 16px', borderRadius: 10, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                      <FolderGit2 size={16} className="text-indigo-400" />
                      {profile.estadisticas.total_proyectos}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: 2 }}>Proyectos</div>
                  </div>
                  <div style={{ background: 'var(--bg-card-special)', padding: '10px 16px', borderRadius: 10, textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                      <Users2 size={16} className="text-emerald-400" />
                      {profile.estadisticas.total_coautores}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: 2 }}>Coautores</div>
                  </div>
                </div>
              </div>

              {/* GRID PRINCIPAL: PROYECTOS VS COAUTORES */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1.4fr 1fr', 
                  gap: 28,
                  alignItems: 'start'
                }}
              >
                {/* COLUMNA 1: PROYECTOS (Línea de Tiempo) */}
                <div>
                  <h3 
                    style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      color: 'var(--text-primary)', 
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <BookOpen size={15} className="text-indigo-400" />
                    Proyectos Desarrollados ({profile.proyectos.length})
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {profile.proyectos.map(p => (
                      <div 
                        key={p.id_proyecto}
                        className="card"
                        style={{
                          padding: 16,
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 12,
                          background: 'var(--bg-card)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          hover: {
                            transform: 'translateY(-2px)',
                            borderColor: 'var(--indigo-400)'
                          }
                        }}
                        onClick={() => {
                          if (onProyectoClick) {
                            onProyectoClick(p)
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                          <span 
                            className="badge badge-indigo"
                            style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px' }}
                          >
                            {p.categoria}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                            Año {p.anio}
                          </span>
                        </div>
                        <h4 
                          style={{ 
                            fontSize: 13.5, 
                            fontWeight: 700, 
                            color: 'var(--text-primary)', 
                            marginTop: 10,
                            lineHeight: 1.4
                          }}
                        >
                          {p.titulo}
                        </h4>
                        <p 
                          style={{ 
                            fontSize: 12, 
                            color: 'var(--text-secondary)', 
                            marginTop: 6,
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {p.descripcion}
                        </p>
                        
                        {p.coautores.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                            <Users2 size={11} />
                            En conjunto con: <span style={{ color: 'var(--text-secondary)' }}>{p.coautores.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUMNA 2: RED DE COAUTORES (Cruzado) */}
                <div>
                  <h3 
                    style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      color: 'var(--text-primary)', 
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Users2 size={15} className="text-emerald-400" />
                    Red de Coautores ({profile.coautores.length})
                  </h3>

                  {profile.coautores.length === 0 ? (
                    <div 
                      style={{ 
                        border: '1px dashed var(--border-subtle)', 
                        borderRadius: 12, 
                        padding: '24px 16px', 
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 12.5
                      }}
                    >
                      Este egresado no posee coautores registrados en sus proyectos.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {profile.coautores.map(co => (
                        <div 
                          key={co.id_estudiante}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'var(--bg-card-special)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 10,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => setActiveId(co.id_estudiante)} // Navegar al coautor cruzado
                          className="coauthor-badge"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div 
                              style={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: '50%', 
                                background: avatarGradients[co.id_estudiante % avatarGradients.length],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#ffffff'
                              }}
                            >
                              {getInitials(co.nombre_completo)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div 
                                style={{ 
                                  fontSize: 12.5, 
                                  fontWeight: 600, 
                                  color: 'var(--text-primary)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {co.nombre_completo}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Promo {co.anio_egreso || 'N/A'}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-muted" style={{ flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Botón de cierre en el pie */}
        <div 
          style={{ 
            padding: '16px 32px', 
            borderTop: '1px solid var(--border-subtle)', 
            display: 'flex', 
            justifyContent: 'flex-end',
            background: 'var(--bg-card-special)'
          }}
        >
          <button className="btn btn-secondary" onClick={onClose}>Cerrar Ficha</button>
        </div>
      </div>

      <style>{`
        @keyframes backdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .coauthor-badge:hover {
          border-color: var(--indigo-400) !important;
          transform: translateX(3px);
          background-color: var(--bg-card) !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
