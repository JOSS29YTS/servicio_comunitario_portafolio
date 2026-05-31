// ============================================================
// COMPONENTE: Previsualizador de PDF Interactivo (Inline Preview)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
import React, { useState, useEffect, useRef } from 'react'
import { Download, Maximize2, Minimize2, X, FileText } from 'lucide-react'
import { descargarArchivo } from '../services/api'
import { IS_DEMO_MODE } from '../config/demoMode'

export default function PdfPreviewModal({ isOpen, fileUrl, fileName, projectTitle, onClose }) {
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    // Bloquear scroll de fondo cuando el visualizador esté activo
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !fileUrl) return null

  // Alternar pantalla completa usando la API nativa de HTML5
  const toggleFullscreen = () => {
    if (!modalRef.current) return

    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error(`Error al intentar pantalla completa: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Listener para salir de fullscreen con ESC nativo
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <div 
      className="modal-overlay" 
      style={{
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: isFullscreen ? 0 : '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="card" 
        style={{
          width: '100%',
          maxWidth: isFullscreen ? '100vw' : '1200px',
          height: isFullscreen ? '100vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: isFullscreen ? 0 : '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          background: 'var(--navy-900)',
          transform: 'scale(1)',
          animation: 'modalEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera del visualizador */}
        <div 
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(8px)',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div 
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--indigo-400)',
                padding: 8,
                borderRadius: 8,
                display: 'flex'
              }}
            >
              <FileText size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 
                style={{ 
                  fontSize: '15px', 
                  fontWeight: 700, 
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  margin: 0
                }}
                title={projectTitle}
              >
                {projectTitle}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--navy-400)', margin: '2px 0 0' }}>
                Visualizador de Documentos PDF Oficial
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              className="btn btn-secondary btn-sm"
              style={{
                gap: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
              onClick={() => descargarArchivo(fileUrl, fileName || 'documento.pdf')}
            >
              <Download size={14} />
              <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Descargar</span>
            </button>

            <button 
              className="btn btn-ghost btn-icon btn-sm"
              style={{ 
                color: 'var(--navy-300)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
              title={isFullscreen ? "Restaurar tamaño" : "Pantalla completa"}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button 
              className="btn btn-ghost btn-icon btn-sm"
              style={{ 
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                marginLeft: 4
              }}
              title="Cerrar visualizador"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Cuerpo / Contenedor del PDF */}
        <div style={{ flex: 1, position: 'relative', background: '#0f172a' }}>
          {/* Spinner de Carga */}
          {loading && (
            <div 
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: '#0f172a',
                zIndex: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 16
              }}
            >
              <div 
                style={{
                  width: 48, height: 48,
                  border: '3px solid rgba(99, 102, 241, 0.1)',
                  borderTop: '3px solid var(--indigo-500)',
                  borderRadius: '50%',
                  animation: 'spin 1s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite'
                }} 
              />
              <p style={{ color: 'var(--navy-400)', fontSize: '13px', fontWeight: 500, letterSpacing: '0.02em' }}>
                Renderizando documento de investigación...
              </p>
            </div>
          )}

          {/* Iframe que incrusta el visor de PDF nativo o simulación elegante en Demo */}
          {IS_DEMO_MODE ? (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              overflowY: 'auto',
              background: '#0b0f19'
            }}>
              <div 
                className="simulated-pdf-sheet"
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  width: '100%',
                  maxWidth: '700px',
                  minHeight: '80%',
                  borderRadius: '12px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                  padding: '40px 48px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 28,
                  textAlign: 'left',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Cabecera del Documento */}
                <div style={{ borderBottom: '2px solid var(--indigo-500, #6366f1)', paddingBottom: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--indigo-600, #4f46e5)', margin: 0 }}>
                    COLEGIO NUESTRA SEÑORA DE FÁTIMA
                  </p>
                  <h2 style={{ fontSize: 16, fontWeight: 800, margin: '4px 0 0', color: '#1e293b', letterSpacing: '-0.01em' }}>
                    REPOSITORIO ACADÉMICO COGNITIVO
                  </h2>
                </div>

                {/* Contenido Simulado */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Título del Proyecto de Investigación
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '6px 0 0', lineHeight: 1.4 }}>
                      {projectTitle}
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Autores (Bachilleres Egresados)
                      </span>
                      <p style={{ fontSize: 12.5, color: '#334155', margin: '6px 0 0', fontWeight: 600 }}>
                        Estudiante(s) Responsable(s) de la Promoción
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Tutor Académico Asesor
                      </span>
                      <p style={{ fontSize: 12.5, color: '#334155', margin: '6px 0 0', fontWeight: 600 }}>
                        Personal Docente de la Institución
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banner de Información Premium para la Demo */}
                <div style={{ 
                  background: 'rgba(99, 102, 241, 0.05)', 
                  border: '1px dashed rgba(99, 102, 241, 0.25)', 
                  borderRadius: '12px',
                  padding: '24px',
                  marginTop: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <h4 style={{ fontSize: 12, fontWeight: 800, color: '#4f46e5', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Visualización de PDF no disponible en la Demo
                    </h4>
                  </div>
                  <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    Para optimizar el uso de recursos y garantizar la velocidad de carga en esta demostración pública basada en la nube, los archivos PDF físicos no se guardan de forma permanente.
                  </p>
                  <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    No obstante, <strong>la indexación científica mediante Google Gemini AI se realizó correctamente</strong>. Puedes examinar el análisis cognitivo estructurado (problema, metodología, hallazgos y palabras clave) directamente presionando el botón <em>Ver detalles</em> del proyecto. En un despliegue local o servidor privado, el PDF original se renderizaría de forma nativa en esta sección.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <iframe 
              src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              title={projectTitle}
              width="100%"
              height="100%"
              style={{ 
                border: 'none', 
                opacity: loading ? 0 : 1,
                transition: 'opacity 0.4s ease-in-out'
              }}
              onLoad={() => setLoading(false)}
            />
          )}
        </div>
      </div>
      
      {/* Animaciones inline */}
      <style>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
