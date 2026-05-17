// ============================================================
// RUTAS: Autenticación
// POST /api/auth/login              → Iniciar sesión
// POST /api/auth/registro           → Registrar nuevo usuario (Pendiente)
// GET  /api/auth/me                 → Datos del usuario autenticado
// POST /api/auth/logout             → Cerrar sesión (informativo)
// PUT  /api/auth/perfil             → Actualizar teléfono del perfil (Protegido)
// PUT  /api/auth/cambiar-contrasena → Cambiar contraseña (Protegido)
// ============================================================
const express  = require('express')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')

const { Usuario, Rol, Estado } = require('../models')
const authMiddleware = require('../middlewares/auth')

const router = express.Router()

// ── POST /api/auth/login ──────────────────────────────────
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Ingresa un correo electrónico válido.'),
    body('password')
      .notEmpty().withMessage('La contraseña es requerida.'),
  ],
  async (req, res) => {
    // Validar inputs
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
      return res.status(400).json({
        ok:      false,
        errores: errores.array().map(e => e.msg),
      })
    }

    const { email, password } = req.body

    try {
      // Buscar usuario por correo incluyendo su Rol y Estado
      const usuario = await Usuario.findOne({
        where: { email },
        include: [
          { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] },
          { model: Estado, as: 'estado', attributes: ['id_estado', 'estado'] }
        ]
      })

      if (!usuario) {
        return res.status(401).json({
          ok:      false,
          mensaje: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
        })
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, usuario.contrasena_hash)
      if (!passwordValida) {
        return res.status(401).json({
          ok:      false,
          mensaje: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
        })
      }

      // Capa de Seguridad: Bloquear el acceso si el estado no es 'Activo'
      if (usuario.estado && usuario.estado.estado !== 'Activo') {
        return res.status(403).json({
          ok:      false,
          mensaje: `Tu cuenta está en estado '${usuario.estado.estado}'. Por favor, espera a que la Dirección apruebe tu registro antes de ingresar.`,
        })
      }

      // Registrar la fecha y hora de la conexión actual
      await usuario.update({ ultima_conexion: new Date() })

      // Generar JWT
      const payload = {
        id_usuario:      usuario.id_usuario,
        email:           usuario.email,
        nombre_completo: usuario.nombre_completo,
      }

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      })

      return res.status(200).json({
        ok: true,
        mensaje: 'Inicio de sesión exitoso.',
        token,
        usuario: {
          id_usuario:      usuario.id_usuario,
          nombre_completo: usuario.nombre_completo,
          email:           usuario.email,
          telefono:        usuario.telefono,
          rol:             usuario.rol ? usuario.rol.nombre : null,
          estado:          usuario.estado ? usuario.estado.estado : null,
          ultima_conexion: usuario.ultima_conexion,
        },
      })
    } catch (error) {
      console.error('[AUTH] Error en login:', error)
      return res.status(500).json({
        ok:      false,
        mensaje: 'Error interno del servidor. Intenta nuevamente.',
      })
    }
  }
)

// ── POST /api/auth/registro ───────────────────────────────
router.post(
  '/registro',
  [
    body('nombre_completo').notEmpty().withMessage('El nombre es requerido.'),
    body('email').isEmail().withMessage('Ingresa un correo electrónico válido.'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  ],
  async (req, res) => {
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
      return res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) })
    }

    const { nombre_completo, email, password } = req.body

    try {
      const existe = await Usuario.findOne({ where: { email } })
      if (existe) {
        return res.status(400).json({ ok: false, mensaje: 'El correo ya está registrado.' })
      }

      const contrasena_hash = await bcrypt.hash(password, 10)

      // Buscar el rol 'Profesor' para usar como fallback seguro
      const rolProfesor = await Rol.findOne({ where: { nombre: 'Profesor' } })
      const idRolFallback = rolProfesor ? rolProfesor.id_rol : 3

      const id_rol = req.body.id_rol || idRolFallback

      // Buscar el estado 'Pendiente' para el registro inicial
      const estadoPendiente = await Estado.findOne({ where: { estado: 'Pendiente' } })
      const idEstadoFallback = estadoPendiente ? estadoPendiente.id_estado : 2

      const usuarioCreado = await Usuario.create({
        nombre_completo,
        email,
        contrasena_hash,
        id_rol,
        id_estado: idEstadoFallback,
        telefono:  null, // El teléfono inicia vacío por defecto
      })

      // Obtener el usuario completo con la asociación del Rol y Estado
      const usuario = await Usuario.findByPk(usuarioCreado.id_usuario, {
        include: [
          { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] },
          { model: Estado, as: 'estado', attributes: ['id_estado', 'estado'] }
        ]
      })

      // Como la cuenta está en estado 'Pendiente', no entregamos token de acceso inmediato
      return res.status(201).json({
        ok: true,
        mensaje: '✔ Registro solicitado exitosamente. Tu cuenta se encuentra en estado "Pendiente" y debe ser aprobada por la Dirección antes de que puedas ingresar.',
        usuario: {
          id_usuario:      usuario.id_usuario,
          nombre_completo: usuario.nombre_completo,
          email:           usuario.email,
          telefono:        usuario.telefono,
          rol:             usuario.rol ? usuario.rol.nombre : null,
          estado:          usuario.estado ? usuario.estado.estado : null,
        },
      })
    } catch (error) {
      console.error('[AUTH] Error en registro:', error)
      return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' })
    }
  }
)

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario, {
      attributes: ['id_usuario', 'nombre_completo', 'email', 'telefono', 'creado_en', 'ultima_conexion'],
      include: [
        { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] },
        { model: Estado, as: 'estado', attributes: ['id_estado', 'estado'] }
      ]
    })

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' })
    }

    return res.json({ 
      ok: true, 
      usuario: {
        id_usuario:      usuario.id_usuario,
        nombre_completo: usuario.nombre_completo,
        email:           usuario.email,
        telefono:        usuario.telefono,
        creado_en:       usuario.creado_en,
        ultima_conexion: usuario.ultima_conexion,
        rol:             usuario.rol ? usuario.rol.nombre : null,
        estado:          usuario.estado ? usuario.estado.estado : null,
      }
    })
  } catch (error) {
    console.error('[AUTH] Error en /me:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' })
  }
})

// ── POST /api/auth/logout ─────────────────────────────────
router.post('/logout', authMiddleware, (req, res) => {
  return res.json({
    ok:      true,
    mensaje: 'Sesión cerrada. Elimina el token en el cliente.',
  })
})

// ── PUT /api/auth/perfil ──────────────────────────────────
// Actualizar teléfono de contacto (Único campo del perfil por ahora, opcional)
router.put(
  '/perfil',
  authMiddleware,
  [
    body('telefono')
      .optional({ checkFalsy: true })
      .isLength({ min: 7, max: 20 }).withMessage('El teléfono debe tener entre 7 y 20 caracteres.'),
  ],
  async (req, res) => {
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
      return res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) })
    }

    const { telefono } = req.body

    try {
      const usuario = await Usuario.findByPk(req.usuario.id_usuario, {
        include: [
          { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] },
          { model: Estado, as: 'estado', attributes: ['id_estado', 'estado'] }
        ]
      })

      if (!usuario) {
        return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' })
      }

      // Guardar teléfono (si está vacío, se almacena como NULL)
      await usuario.update({ telefono: telefono || null })

      return res.json({
        ok: true,
        mensaje: '✔ Teléfono de contacto actualizado correctamente.',
        usuario: {
          id_usuario:      usuario.id_usuario,
          nombre_completo: usuario.nombre_completo,
          email:           usuario.email,
          telefono:        usuario.telefono,
          rol:             usuario.rol ? usuario.rol.nombre : null,
          estado:          usuario.estado ? usuario.estado.estado : null,
          ultima_conexion: usuario.ultima_conexion,
        }
      })
    } catch (error) {
      console.error('[AUTH] Error al actualizar perfil:', error)
      return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor al actualizar tu perfil.' })
    }
  }
)

// ── PUT /api/auth/cambiar-contrasena ──────────────────────
// Cambiar contraseña verificando que la contraseña actual sea correcta
router.put(
  '/cambiar-contrasena',
  authMiddleware,
  [
    body('contrasena_actual')
      .notEmpty().withMessage('La contraseña actual es requerida.'),
    body('contrasena_nueva')
      .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres.'),
  ],
  async (req, res) => {
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
      return res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) })
    }

    const { contrasena_actual, contrasena_nueva } = req.body

    try {
      const usuario = await Usuario.findByPk(req.usuario.id_usuario)
      if (!usuario) {
        return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' })
      }

      // Validar contraseña actual
      const passwordValida = await bcrypt.compare(contrasena_actual, usuario.contrasena_hash)
      if (!passwordValida) {
        return res.status(400).json({
          ok:      false,
          mensaje: 'La contraseña actual ingresada es incorrecta.',
        })
      }

      // Hashear la nueva contraseña y guardarla
      const contrasena_hash = await bcrypt.hash(contrasena_nueva, 10)
      await usuario.update({ contrasena_hash })

      return res.json({
        ok:      true,
        mensaje: '✔ Contraseña cambiada exitosamente.',
      })
    } catch (error) {
      console.error('[AUTH] Error al cambiar contraseña:', error)
      return res.status(500).json({ ok: false, mensaje: 'Error interno al procesar el cambio de contraseña.' })
    }
  }
)

module.exports = router
