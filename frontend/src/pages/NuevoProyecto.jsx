import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, FileText, CheckCircle,
  User, Upload, ChevronRight
} from 'lucide-react'
import api from '../services/api'

const CAMPOS_VACIO = {
  nombre:      '',
  anio:        '',
  categoria:   '',
  tema:        '',
  descripcion: '',
  estudiantes: [''],
  tutores:     [''],
  archivo:     null,
}

export default function NuevoProyecto() {
  const navigate  = useNavigate()
  const fileRef   = useRef()
  const [form, setForm]         = useState(CAMPOS_VACIO)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors]     = useState({})
  const [success, setSuccess]   = useState(false)
  const [saving, setSaving]     = useState(false)

  // Estados vacíos listos para conectarse al backend
  const [categoriasLista] = useState([])
  const [aniosDisponibles] = useState([])

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

  const setTutor = (i, value) => {
    const arr = [...form.tutores]
    arr[i] = value
    setForm(f => ({ ...f, tutores: arr }))
  }
  const addTutor = () => setForm(f => ({ ...f, tutores: [...f.tutores, ''] }))
  const removeTutor = (i) => {
    const arr = form.tutores.filter((_, idx) => idx !== i)
    setForm(f => ({ ...f, tutores: arr.length ? arr : [''] }))
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
    if (form.tutores.every(s => !s.trim())) e.tutores = 'Agrega al menos un tutor.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 1200))
    setSaving(false)
    setSuccess(true)
    setTimeout(() => navigate('/proyectos'), 2200)
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
        ¡Proyecto Registrado!
      </h2>
      <p style={{ fontSize: 14, color: 'var(--navy-500)', marginBottom: 24, textAlign: 'center', maxWidth: 360 }}>
        El proyecto ha sido guardado exitosamente en el repositorio académico.
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
        <span className="breadcrumb-current">Nuevo Proyecto</span>
      </div>

      <div className="page-header">
        <div className="page-header-left">
          <h2>Registrar Nuevo Proyecto</h2>
          <p>Completa los datos del proyecto de investigación estudiantil</p>
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

          <div className="form-group">
            <label className="form-label">Categoría <span>*</span></label>
            <div className="category-pills" style={{ marginTop: 4 }}>
              {categoriasLista.length === 0 ? (
                <span style={{ fontSize: 13, color: 'var(--navy-400)' }}>Cargando categorías...</span>
              ) : categoriasLista.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill ${form.categoria === cat.nombre ? 'selected' : ''}`}
                  onClick={() => set('categoria', cat.nombre)}
                >
                  {cat.emoji} {cat.nombre}
                </button>
              ))}
            </div>
            {errors.categoria && (
              <span className="form-hint" style={{ color: 'var(--red-500)', marginTop: 6 }}>{errors.categoria}</span>
            )}
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

        {/* ── Sección 3: Tutores ── */}
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <div className="form-section-title">
            <span className="section-number">3</span>
            Tutores
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {form.tutores.map((tut, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <User size={15} style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--navy-400)'
                  }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`Tutor ${i + 1}`}
                    value={tut}
                    onChange={e => setTutor(i, e.target.value)}
                    style={{ paddingLeft: 36 }}
                  />
                </div>
                {form.tutores.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => removeTutor(i)}
                    title="Eliminar"
                  >
                    <Trash2 size={15} color="var(--red-500)" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.tutores && (
            <span className="form-hint" style={{ color: 'var(--red-500)', marginTop: 8, display: 'block' }}>{errors.tutores}</span>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 12 }}
            onClick={addTutor}
          >
            <Plus size={14} />
            Agregar tutor
          </button>
        </div>

        {/* ── Sección 4: Descripción ── */}
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <div className="form-section-title">
            <span className="section-number">4</span>
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

        {/* ── Sección 5: PDF ── */}
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div className="form-section-title">
            <span className="section-number">5</span>
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
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                onChange={e => handleFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
          )}
          <p className="form-hint" style={{ marginTop: 8 }}>
            El PDF es opcional en este momento. Puedes cargarlo más tarde desde la lista de proyectos.
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
                Guardar Proyecto
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
