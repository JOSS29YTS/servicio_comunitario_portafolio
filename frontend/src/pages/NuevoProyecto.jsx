import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, FileText, CheckCircle,
  User, Upload, ChevronRight
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const CAMPOS_VACIO = {
  nombre:      '',
  anio:        '',
  categoria:   '',
  tema:        '',
  descripcion: '',
  estudiantes: [''],
  archivo:     null,
}

export default function NuevoProyecto() {
  const navigate  = useNavigate()
  const { id }    = useParams()
  const fileRef   = useRef()
  const { user }  = useAuth()
  
  const [form, setForm]         = useState({
    ...CAMPOS_VACIO,
    archivoExistenteNombre: null
  })
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors]     = useState({})
  const [success, setSuccess]   = useState(false)
  const [saving, setSaving]     = useState(false)

  // Estados vacíos cargados dinámicamente desde el backend
  const [categoriasLista, setCategoriasLista] = useState([])
  const [aniosDisponibles] = useState([2026, 2025, 2024, 2023])
  
  const [bocetoUrl, setBocetoUrl] = useState(null)
  const [uploadingBoceto, setUploadingBoceto] = useState(false)

  // Cargar estado inicial del boceto, las categorías y los datos previos si es edición
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Cargar boceto
        const resBoceto = await api.get('/boceto')
        if (resBoceto.data?.ok && resBoceto.data?.existe) {
          setBocetoUrl(resBoceto.data.url)
        }

        // Cargar categorías reales desde el backend
        const resCat = await api.get('/categorias')
        if (resCat.data?.ok) {
          setCategoriasLista(resCat.data.categorias || [])
        }

        // Si hay un id, estamos en modo Edición → Cargar el proyecto del backend
        if (id) {
          const resProyecto = await api.get(`/proyectos/${id}`)
          if (resProyecto.data?.ok) {
            const p = resProyecto.data.proyecto
            setForm({
              nombre: p.titulo || '',
              anio: p.promocion?.anio || p.anio || '',
              categoria: p.categoria?.nombre || p.categoria || '',
              tema: p.tema || '',
              descripcion: p.descripcion_breve || p.descripcion || '',
              estudiantes: p.estudiantes?.map(e => e.nombre_completo) || [''],
              archivo: null,
              archivoExistenteNombre: p.archivos && p.archivos.length > 0 ? p.archivos[0].nombre_archivo : null
            })
          }
        }
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err)
      }
    }
    cargarDatosIniciales()
  }, [id])

  // Subir/Actualizar boceto PDF en Base64
  const handleBocetoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      alert('Por favor, selecciona un archivo PDF válido.')
      return
    }

    setUploadingBoceto(true)
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result
        const res = await api.post('/boceto', { fileData: base64Data })
        if (res.data?.ok) {
          setBocetoUrl(res.data.url)
          alert('¡Boceto del Proyecto de Investigación actualizado con éxito! 📄')
        }
      } catch (err) {
        console.error('Error al subir boceto:', err)
        alert('Hubo un error al subir el boceto. Por favor intenta nuevamente.')
      } finally {
        setUploadingBoceto(false)
      }
    }
  }

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }))
  }

  const setEstudiante = (i, value) => {
    const arr = [...form.estudiantes]
    arr[i] = value
    setForm(f => ({ ...f, estudiantes: arr }))
  }
  const addEstudiante = () => setForm(f => ({ ...f, estudiantes: [...f.estudiantes, ''] }))
  const removeEstudiante = (i) => {
    const arr = form.estudiantes.filter((_, idx) => idx !== i)
    setForm(f => ({ ...f, estudiantes: arr.length ? arr : [''] }))
  }



  const handleFile = (file) => {
    if (file && file.type === 'application/pdf') {
      set('archivo', file)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim())    e.nombre      = 'El nombre del proyecto es requerido.'
    if (!form.anio)             e.anio        = 'Selecciona el año de promoción.'
    if (!form.categoria)        e.categoria   = 'Selecciona una categoría.'
    if (!form.tema.trim())      e.tema        = 'El tema específico es requerido.'
    if (!form.descripcion.trim()) e.descripcion = 'La descripción es requerida.'
    if (form.estudiantes.every(s => !s.trim())) e.estudiantes = 'Agrega al menos un estudiante.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('titulo', form.nombre.trim())
      formData.append('anio', form.anio)
      formData.append('categoria', form.categoria)
      formData.append('tema', form.tema.trim())
      formData.append('descripcion_breve', form.descripcion.trim())

      // Filtrar estudiantes vacíos
      const estudiantesFiltrados = form.estudiantes.map(s => s.trim()).filter(Boolean)
      formData.append('estudiantes', JSON.stringify(estudiantesFiltrados))

      if (form.archivo) {
        formData.append('archivo_pdf', form.archivo)
      }

      let res
      if (id) {
        res = await api.put(`/proyectos/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        res = await api.post('/proyectos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      if (res.data?.ok) {
        setSuccess(true)
        setTimeout(() => navigate('/proyectos'), 2200)
      } else {
        alert(res.data?.mensaje || 'Error al guardar el proyecto en el servidor.')
      }
    } catch (error) {
      console.error('[NUEVO PROYECTO] Error al guardar:', error)
      const msg = error.response?.data?.mensaje || 'No se pudo conectar con el servidor para guardar el proyecto.'
      alert(msg)
    } finally {
      setSaving(false)
    }
  }

  if (success) return (
    <div className="page-content page-enter" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh'
    }}>
      <div style={{
        width: 88, height: 88, background: 'var(--green-100)', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        color: 'var(--green-500)'
      }}>
        <CheckCircle size={44} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy-900)', marginBottom: 8 }}>
        {id ? '¡Proyecto Actualizado!' : '¡Proyecto Registrado!'}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--navy-500)', marginBottom: 24, textAlign: 'center', maxWidth: 360 }}>
        {id ? 'El proyecto ha sido modificado y guardado exitosamente.' : 'El proyecto ha sido guardado exitosamente en el repositorio académico.'}
      </p>
      <p style={{ fontSize: 13, color: 'var(--navy-400)' }}>Redirigiendo a proyectos...</p>
    </div>
  )

  return (
    <div className="page-content page-enter">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Proyectos</span>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <span className="breadcrumb-current">{id ? 'Editar Proyecto' : 'Nuevo Proyecto'}</span>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h2>{id ? 'Editar Proyecto Estudiantil' : 'Registrar Nuevo Proyecto'}</h2>
          <p>{id ? 'Modifica los datos del proyecto de investigación seleccionado' : 'Completa los datos del proyecto de investigación estudiantil'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/proyectos')}>
          <ArrowLeft size={15} />
          Volver
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Sección 1: Información general ── */}
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <div className="form-section-title">
            <span className="section-number">1</span>
            Información del Proyecto
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Nombre del Proyecto <span>*</span></label>
            <input
              id="campo-nombre"
              type="text"
              className="form-input"
              placeholder="Ej: Sistema de Gestión de Inventario para la Cantina Escolar"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              style={errors.nombre ? { borderColor: 'var(--red-500)' } : {}}
            />
            {errors.nombre && <span className="form-hint" style={{ color: 'var(--red-500)' }}>{errors.nombre}</span>}
          </div>

          <div className="form-row" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Año de Promoción <span>*</span></label>
              <select
                id="campo-anio"
                className="form-select"
                value={form.anio}
                onChange={e => set('anio', e.target.value)}
                style={errors.anio ? { borderColor: 'var(--red-500)' } : {}}
              >
                <option value="">Seleccionar año...</option>
                {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.anio && <span className="form-hint" style={{ color: 'var(--red-500)' }}>{errors.anio}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Tema Específico <span>*</span></label>
              <input
                id="campo-tema"
                type="text"
                className="form-input"
                placeholder="Ej: Automatización comercial"
                value={form.tema}
                onChange={e => set('tema', e.target.value)}
                style={errors.tema ? { borderColor: 'var(--red-500)' } : {}}
              />
              {errors.tema && <span className="form-hint" style={{ color: 'var(--red-500)' }}>{errors.tema}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Categoría <span>*</span></label>
            <select
              id="campo-categoria"
              className="form-select"
              value={form.categoria}
              onChange={e => set('categoria', e.target.value)}
              style={errors.categoria ? { borderColor: 'var(--red-500)' } : {}}
            >
              <option value="">Seleccionar categoría...</option>
              {categoriasLista.map(cat => (
                <option key={cat.id_categoria || cat.id} value={cat.nombre}>
                  {cat.nombre}
                </option>
              ))}
            </select>
            {errors.categoria && <span className="form-hint" style={{ color: 'var(--red-500)' }}>{errors.categoria}</span>}
          </div>

          {/* Fila del Voceto de Investigación */}
          <div className="form-group" style={{ 
            marginTop: 20, 
            padding: '16px 20px', 
            background: 'rgba(99, 102, 241, 0.03)', 
            borderRadius: 'var(--radius-md)', 
            border: '1px dashed var(--indigo-200)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Voceto del Proyecto (Pautas y Reglas)</h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Lineamientos oficiales establecidos por la dirección escolar para la elaboración del proyecto.</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {bocetoUrl ? (
                  <a 
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${bocetoUrl}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-secondary btn-sm"
                    style={{ gap: 6, padding: '6px 14px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center' }}
                  >
                    <FileText size={14} /> Descargar Voceto (Reglas)
                  </a>
                ) : (
                  <span style={{ fontSize: 12.5, color: 'var(--navy-400)', fontStyle: 'italic' }}>Sin voceto cargado</span>
                )}

                {(user?.rol === 'Director' || user?.rol === 'Subdirector') && (
                  <label 
                    className={`btn btn-primary btn-sm ${uploadingBoceto ? 'disabled' : ''}`} 
                    style={{ gap: 6, padding: '6px 14px', fontSize: 12.5, cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center' }}
                  >
                    <Upload size={14} /> {uploadingBoceto ? 'Subiendo...' : (bocetoUrl ? 'Actualizar' : 'Subir Voceto')}
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      style={{ display: 'none' }} 
                      onChange={handleBocetoUpload} 
                      disabled={uploadingBoceto}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sección 2: Estudiantes ── */}
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <div className="form-section-title">
            <span className="section-number">2</span>
            Estudiantes Responsables
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {form.estudiantes.map((est, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <User size={15} style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--navy-400)'
                  }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Estudiante ${i + 1}`}
                    value={est}
                    onChange={e => setEstudiante(i, e.target.value)}
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                {form.estudiantes.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => removeEstudiante(i)}
                    title="Eliminar"
                  >
                    <Trash2 size={15} color="var(--red-500)" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.estudiantes && (
            <span className="form-hint" style={{ color: 'var(--red-500)', marginTop: 8, display: 'block' }}>{errors.estudiantes}</span>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 12 }}
            onClick={addEstudiante}
          >
            <Plus size={14} />
            Agregar estudiante
          </button>
        </div>

        {/* ── Sección 3: Descripción ── */}
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <div className="form-section-title">
            <span className="section-number">3</span>
            Descripción del Proyecto
          </div>
          <div className="form-group">
            <label className="form-label">Descripción Breve <span>*</span></label>
            <textarea
              id="campo-descripcion"
              className="form-textarea"
              placeholder="Describe brevemente el proyecto: objetivo, metodología y resultados principales..."
              rows={4}
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              style={errors.descripcion ? { borderColor: 'var(--red-500)' } : {}}
            />
            <span className="form-hint">
              {form.descripcion.length} / 500 caracteres recomendados
              {errors.descripcion && <span style={{ color: 'var(--red-500)', marginLeft: 8 }}>{errors.descripcion}</span>}
            </span>
          </div>
        </div>

        {/* ── Sección 4: PDF ── */}
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div className="form-section-title">
            <span className="section-number">4</span>
            Archivo del Proyecto (PDF)
          </div>

          {form.archivo ? (
            <div className="file-selected">
              <FileText size={20} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{form.archivo.name}</div>
                <div style={{ fontSize: 11.5, opacity: 0.7 }}>
                  {(form.archivo.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => set('archivo', null)}
                style={{ color: '#065F46' }}
              >
                <Trash2 size={14} /> Quitar
              </button>
            </div>
          ) : form.archivoExistenteNombre ? (
            <div className="file-selected" style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'var(--indigo-200)' }}>
              <FileText size={20} color="var(--indigo-500)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{form.archivoExistenteNombre}</div>
                <div style={{ fontSize: 11.5, color: 'var(--indigo-500)', fontWeight: 500 }}>
                  PDF registrado previamente. Haz clic abajo si deseas reemplazarlo.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fileRef.current?.click()}
                style={{ color: 'var(--indigo-600)' }}
              >
                Reemplazar PDF
              </button>
            </div>
          ) : (
            <div
              className={`drop-zone${dragOver ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => fileRef.current?.click()}
            >
              <div className="drop-zone-icon">
                <Upload size={26} />
              </div>
              <div className="drop-zone-title">Arrastra el PDF aquí o haz clic para seleccionar</div>
              <div className="drop-zone-sub">Solo archivos PDF · Máximo 20 MB</div>
            </div>
          )}
          
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            onChange={e => handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <p className="form-hint" style={{ marginTop: 8 }}>
            El PDF es opcional en este momento. {id ? 'Si no subes uno nuevo, se conservará el ya registrado.' : 'Puedes cargarlo más tarde desde la lista de proyectos.'}
          </p>
        </div>

        {/* ── Botones de acción ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/proyectos')}
          >
            Cancelar
          </button>
          <button
            id="btn-guardar-proyecto"
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <span style={{
                  width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', display: 'inline-block'
                }} />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                {id ? 'Guardar Cambios' : 'Guardar Proyecto'}
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
