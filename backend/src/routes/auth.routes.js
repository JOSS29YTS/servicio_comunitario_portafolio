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
const fs       = require('fs')
const path     = require('path')
const crypto   = require('crypto')

const { Usuario, Rol, Estado } = require('../models')
const authMiddleware = require('../middlewares/auth')
const checkRole      = require('../middlewares/checkRole')
const { authLimiter } = require('../middlewares/rateLimiter')
const { sendRecoveryEmail } = require('../utils/emailService')
const { registrarAccion } = require('../services/auditService')

const router = express.Router()

// ── POST /api/auth/login ──────────────────────────────────
router.post(
  '/login',
  authLimiter,
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
        await registrarAccion(req, 'LOGIN_FALLIDO', `Intento de inicio de sesión con correo no registrado`, { email })
        return res.status(401).json({
          ok:      false,
          mensaje: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
        })
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, usuario.contrasena_hash)
      if (!passwordValida) {
        await registrarAccion(req, 'LOGIN_FALLIDO', `Contraseña incorrecta intentada para usuario: ${email}`, { id_usuario: usuario.id_usuario, email })
        return res.status(401).json({
          ok:      false,
          mensaje: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
        })
      }

      // Capa de Seguridad: Bloquear el acceso si el estado no es 'Activo'
      if (usuario.estado && usuario.estado.estado !== 'Activo') {
        await registrarAccion(req, 'LOGIN_BLOQUEADO', `Intento de acceso bloqueado. Estado: ${usuario.estado.estado}`, { id_usuario: usuario.id_usuario, email, estado: usuario.estado.estado })
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

      // Registrar auditoría de Login Exitoso
      await registrarAccion({ usuario: { id_usuario: usuario.id_usuario, nombre_completo: usuario.nombre_completo, email: usuario.email }, ip: req.ip, headers: req.headers, socket: req.socket }, 'LOGIN_EXITOSO', `Inicio de sesión exitoso. Rol: ${usuario.rol?.nombre || 'Sin Rol'}`)

      return res.status(200).json({
        ok: true,
        mensaje: 'Inicio de sesión exitoso.',
        token,
        usuario: {
          id_usuario:      usuario.id_usuario,
          nombre_completo: usuario.nombre_completo,
          email:           usuario.email,
          telefono:        usuario.telefono,
          avatar:          usuario.avatar,
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
  authLimiter,
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

      // Registrar auditoría de solicitud de registro
      await registrarAccion(req, 'REGISTRO_SOLICITADO', `Registro de cuenta solicitado por nuevo usuario: ${nombre_completo} (${email})`, { id_usuario_creado: usuario.id_usuario, rol: usuario.rol?.nombre })

      // Como la cuenta está en estado 'Pendiente', no entregamos token de acceso inmediato
      return res.status(201).json({
        ok: true,
        mensaje: '✔ Registro solicitado exitosamente. Tu cuenta se encuentra en estado "Pendiente" y debe ser aprobada por la Dirección antes de que puedas ingresar.',
        usuario: {
          id_usuario:      usuario.id_usuario,
          nombre_completo: usuario.nombre_completo,
          email:           usuario.email,
          telefono:        usuario.telefono,
          avatar:          usuario.avatar,
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

// ── POST /api/auth/recuperar-clave ────────────────────────
router.post(
  '/recuperar-clave',
  authLimiter,
  [
    body('email').isEmail().withMessage('Ingresa un correo electrónico válido.')
  ],
  async (req, res) => {
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
      return res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) })
    }

    const { email } = req.body

    try {
      const usuario = await Usuario.findOne({ where: { email } })
      if (!usuario) {
        // Respuesta genérica para evitar enumeración de cuentas
        await registrarAccion(req, 'RECUPERACION_SOLICITADA_FALLIDA', `Intento de recuperación para correo no registrado: ${email}`)
        return res.json({
          ok: true,
          mensaje: 'Si tu correo electrónico está registrado en el repositorio, recibirás un enlace de recuperación en los próximos minutos.'
        })
      }

      // Generar token criptográfico seguro
      const token = crypto.randomBytes(32).toString('hex')
      const expiracion = new Date(Date.now() + 60 * 60 * 1000) // 1 hora de validez

      await usuario.update({
        token_recuperacion: token,
        expiracion_recuperacion: expiracion
      })

      // Enviar correo
      await sendRecoveryEmail(usuario.email, usuario.nombre_completo, token)

      await registrarAccion(req, 'RECUPERACION_SOLICITADA', `Enlace de recuperación de clave enviado al correo: ${email}`, { id_usuario_solicitante: usuario.id_usuario })

      return res.json({
        ok: true,
        mensaje: 'Si tu correo electrónico está registrado en el repositorio, recibirás un enlace de recuperación en los próximos minutos.'
      })
    } catch (error) {
      console.error('[AUTH] Error en recuperar-clave:', error)
      return res.status(500).json({ ok: false, mensaje: 'Error interno al procesar tu solicitud.' })
    }
  }
)

// ── POST /api/auth/restablecer-clave ──────────────────────
router.post(
  '/restablecer-clave',
  authLimiter,
  [
    body('email').isEmail().withMessage('Ingresa un correo electrónico válido.'),
    body('token').notEmpty().withMessage('El token de seguridad es requerido.'),
    body('password').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres.')
  ],
  async (req, res) => {
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
      return res.status(400).json({ ok: false, errores: errores.array().map(e => e.msg) })
    }

    const { email, token, password } = req.body

    try {
      const { Op } = require('sequelize')
      const usuario = await Usuario.findOne({
        where: {
          email,
          token_recuperacion: token,
          expiracion_recuperacion: {
            [Op.gt]: new Date()
          }
        }
      })

      if (!usuario) {
        await registrarAccion(req, 'RESTABLECIMIENTO_FALLIDO', `Token inválido o expirado para el correo: ${email}`)
        return res.status(400).json({
          ok: false,
          mensaje: 'El token de seguridad es inválido o ha expirado. Por favor, solicita un nuevo enlace de recuperación.'
        })
      }

      // Hashear nueva contraseña
      const contrasena_hash = await bcrypt.hash(password, 10)

      // Limpiar token
      await usuario.update({
        contrasena_hash,
        token_recuperacion: null,
        expiracion_recuperacion: null
      })

      await registrarAccion({ usuario: { id_usuario: usuario.id_usuario, nombre_completo: usuario.nombre_completo, email: usuario.email }, ip: req.ip, headers: req.headers, socket: req.socket }, 'RESTABLECIMIENTO_EXITOSO', 'Contraseña restablecida de forma segura')

      return res.json({
        ok: true,
        mensaje: '✔ Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.'
      })
    } catch (error) {
      console.error('[AUTH] Error en restablecer-clave:', error)
      return res.status(500).json({ ok: false, mensaje: 'Error interno en el servidor.' })
    }
  }
)

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario, {
      attributes: ['id_usuario', 'nombre_completo', 'email', 'telefono', 'avatar', 'creado_en', 'ultima_conexion'],
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
        avatar:          usuario.avatar,
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
          avatar:          usuario.avatar,
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

// ── PUT /api/auth/avatar ──────────────────────────────────
// Cargar/Actualizar imagen de avatar del usuario (Base64 ligero)
router.put('/avatar', authMiddleware, async (req, res) => {
  try {
    const { fileData } = req.body
    if (!fileData) {
      return res.status(400).json({ ok: false, mensaje: 'No se recibió la información de la imagen.' })
    }

    // 1. Validar estrictamente que sea un Data-URI de imagen válido
    const match = fileData.match(/^data:image\/(png|jpeg|jpg|webp);base64,/)
    if (!match) {
      return res.status(400).json({ ok: false, mensaje: 'El archivo enviado no es una imagen válida.' })
    }

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
    const base64Data = fileData.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '')

    // 2. Buscar usuario para obtener su estado actual
    const usuario = await Usuario.findByPk(req.usuario.id_usuario)
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' })
    }

    // 3. Crear directorio de avatares si no existe
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
    const avatarsDir = path.join(uploadsDir, 'avatars')
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true })
    }

    // 4. Limpieza física del avatar anterior
    if (usuario.avatar) {
      const fileSubPath = usuario.avatar.replace(/^\/uploads/, '') // Ej: "/avatars/user_1_123.jpg"
      const absolutePath = path.join(uploadsDir, fileSubPath)
      try {
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath)
        }
      } catch (err) {
        console.error('[AVATAR] Error al eliminar archivo anterior:', err.message)
      }
    }

    // 5. Escribir el nuevo archivo de imagen comprimida en disco
    const fileName = `user_${usuario.id_usuario}_${Date.now()}.${ext}`
    const filePath = path.join(avatarsDir, fileName)
    fs.writeFileSync(filePath, base64Data, 'base64')

    // 6. Guardar la ruta relativa del avatar en la base de datos
    const relativeUrl = `/uploads/avatars/${fileName}`
    await usuario.update({ avatar: relativeUrl })

    // 7. Retornar el usuario actualizado
    const usuarioActualizado = await Usuario.findByPk(usuario.id_usuario, {
      include: [
        { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] },
        { model: Estado, as: 'estado', attributes: ['id_estado', 'estado'] }
      ]
    })

    return res.json({
      ok: true,
      mensaje: '✔ Imagen de perfil cargada y actualizada exitosamente.',
      usuario: {
        id_usuario:      usuarioActualizado.id_usuario,
        nombre_completo: usuarioActualizado.nombre_completo,
        email:           usuarioActualizado.email,
        telefono:        usuarioActualizado.telefono,
        avatar:          usuarioActualizado.avatar,
        rol:             usuarioActualizado.rol ? usuarioActualizado.rol.nombre : null,
        estado:          usuarioActualizado.estado ? usuarioActualizado.estado.estado : null,
        ultima_conexion: usuarioActualizado.ultima_conexion,
      }
    })
  } catch (error) {
    console.error('[AVATAR] Error al subir avatar:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error al procesar y guardar la imagen de perfil.' })
  }
})

// ── DELETE /api/auth/avatar ───────────────────────────────
// Eliminar imagen de avatar personalizada y volver a las iniciales
router.delete('/avatar', authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario)
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' })
    }

    // 1. Si tiene un avatar registrado, eliminar físicamente el archivo del disco
    if (usuario.avatar) {
      const fileSubPath = usuario.avatar.replace(/^\/uploads/, '')
      const absolutePath = path.join(__dirname, '..', '..', 'uploads', fileSubPath)
      try {
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath)
        }
      } catch (err) {
        console.error('[AVATAR] Error al eliminar archivo físico:', err.message)
      }
    }

    // 2. Actualizar campo avatar a NULL en la base de datos
    await usuario.update({ avatar: null })

    // 3. Retornar el usuario con avatar: null
    const usuarioActualizado = await Usuario.findByPk(usuario.id_usuario, {
      include: [
        { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] },
        { model: Estado, as: 'estado', attributes: ['id_estado', 'estado'] }
      ]
    })

    return res.json({
      ok: true,
      mensaje: '✔ Imagen de perfil eliminada. Se han restaurado las iniciales por defecto.',
      usuario: {
        id_usuario:      usuarioActualizado.id_usuario,
        nombre_completo: usuarioActualizado.nombre_completo,
        email:           usuarioActualizado.email,
        telefono:        usuarioActualizado.telefono,
        avatar:          usuarioActualizado.avatar,
        rol:             usuarioActualizado.rol ? usuarioActualizado.rol.nombre : null,
        estado:          usuarioActualizado.estado ? usuarioActualizado.estado.estado : null,
        ultima_conexion: usuarioActualizado.ultima_conexion,
      }
    })
  } catch (error) {
    console.error('[AVATAR] Error al eliminar avatar:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar la imagen de perfil.' })
  }
})

// ============================================================
// ENDPOINTS DE ADMINISTRACIÓN DE USUARIOS
// ============================================================

// ── GET /api/auth/usuarios ───────────────────────────────
// Obtener todos los usuarios de la base de datos (Protegido, solo Director/Subdirector)
router.get('/usuarios', authMiddleware, checkRole(['Director', 'Subdirector']), async (req, res) => {
  try {

    const usuarios = await Usuario.findAll({
      attributes: ['id_usuario', 'nombre_completo', 'email', 'telefono', 'avatar', 'creado_en', 'ultima_conexion'],
      include: [
        { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] },
        { model: Estado, as: 'estado', attributes: ['id_estado', 'estado'] }
      ],
      order: [['id_usuario', 'ASC']]
    })

    // Función para obtener iniciales
    const getIniciales = (nombreCompleto = '') => {
      const partes = nombreCompleto.trim().split(' ').filter(Boolean)
      if (partes.length === 0) return 'U'
      if (partes.length === 1) return partes[0][0].toUpperCase()
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
    }

    const usuariosMapeados = usuarios.map(u => ({
      id: u.id_usuario,
      nombre: u.nombre_completo,
      email: u.email,
      telefono: u.telefono,
      avatar: u.avatar,
      rol: u.rol ? u.rol.nombre : null,
      id_rol: u.rol ? u.rol.id_rol : null,
      estado: u.estado ? u.estado.estado : null,
      id_estado: u.estado ? u.estado.id_estado : null,
      creado_en: u.creado_en,
      ultima_conexion: u.ultima_conexion,
      iniciales: getIniciales(u.nombre_completo)
    }))

    return res.json({
      ok: true,
      usuarios: usuariosMapeados
    })
  } catch (error) {
    console.error('[AUTH] Error al obtener usuarios:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error interno al obtener la lista de usuarios.' })
  }
})

// ── GET /api/auth/roles ──────────────────────────────────
// Obtener todos los roles disponibles (Protegido, solo Director/Subdirector)
router.get('/roles', authMiddleware, checkRole(['Director', 'Subdirector']), async (req, res) => {
  try {
    const roles = await Rol.findAll({ order: [['id_rol', 'ASC']] })
    return res.json({ ok: true, roles })
  } catch (error) {
    console.error('[AUTH] Error al obtener roles:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error interno al obtener los roles.' })
  }
})

// ── GET /api/auth/estados ────────────────────────────────
// Obtener todos los estados de cuenta disponibles (Protegido, solo Director/Subdirector)
router.get('/estados', authMiddleware, checkRole(['Director', 'Subdirector']), async (req, res) => {
  try {
    const estados = await Estado.findAll({ order: [['id_estado', 'ASC']] })
    return res.json({ ok: true, estados })
  } catch (error) {
    console.error('[AUTH] Error al obtener estados:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error interno al obtener los estados.' })
  }
})

// ── PUT /api/auth/usuarios/:id/rol ───────────────────────
// Actualizar el rol de un usuario (Protegido, solo Director/Subdirector)
router.put('/usuarios/:id/rol', authMiddleware, checkRole(['Director', 'Subdirector']), async (req, res) => {
  const { id } = req.params
  const { id_rol } = req.body

  try {
    // Validar que el rol existe
    const rolExiste = await Rol.findByPk(id_rol)
    if (!rolExiste) {
      return res.status(400).json({ ok: false, mensaje: 'El rol seleccionado no es válido.' })
    }

    // Buscar el usuario a actualizar
    const usuario = await Usuario.findByPk(id)
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' })
    }

    // Impedir que un usuario cambie su propio rol
    if (parseInt(id) === req.usuario.id_usuario) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No puedes cambiar el rol de tu propia cuenta.'
      })
    }

    // Impedir que un Subdirector cambie el rol de un Director
    const usuarioRolActual = await Rol.findByPk(usuario.id_rol)
    if (req.usuario.rol === 'Subdirector' && usuarioRolActual?.nombre === 'Director') {
      return res.status(403).json({
        ok: false,
        mensaje: 'No tienes permisos para modificar el rol de un Director.'
      })
    }

    await usuario.update({ id_rol })

    // Obtener usuario actualizado con asociaciones
    const usuarioActualizado = await Usuario.findByPk(id, {
      include: [
        { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] },
        { model: Estado, as: 'estado', attributes: ['id_estado', 'estado'] }
      ]
    })

    // Registrar auditoría de cambio de rol
    await registrarAccion(req, 'CAMBIO_ROL_USUARIO', `Rol de usuario ${usuarioActualizado.nombre_completo} actualizado a '${usuarioActualizado.rol?.nombre || 'Sin Rol'}'.`, { id_usuario_afectado: id, nuevo_rol: usuarioActualizado.rol?.nombre })

    return res.json({
      ok: true,
      mensaje: '✔ Rol de usuario actualizado exitosamente.',
      usuario: {
        id: usuarioActualizado.id_usuario,
        nombre: usuarioActualizado.nombre_completo,
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono,
        avatar: usuarioActualizado.avatar,
        rol: usuarioActualizado.rol ? usuarioActualizado.rol.nombre : null,
        id_rol: usuarioActualizado.rol ? usuarioActualizado.rol.id_rol : null,
        estado: usuarioActualizado.estado ? usuarioActualizado.estado.estado : null,
        id_estado: usuarioActualizado.estado ? usuarioActualizado.estado.id_estado : null,
      }
    })
  } catch (error) {
    console.error('[AUTH] Error al actualizar rol:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error interno al actualizar el rol del usuario.' })
  }
})

// ── PUT /api/auth/usuarios/:id/estado ────────────────────
// Actualizar el estado de cuenta de un usuario (Protegido, solo Director/Subdirector)
router.put('/usuarios/:id/estado', authMiddleware, checkRole(['Director', 'Subdirector']), async (req, res) => {
  const { id } = req.params
  const { id_estado } = req.body

  try {
    // Validar que el estado existe
    const estadoExiste = await Estado.findByPk(id_estado)
    if (!estadoExiste) {
      return res.status(400).json({ ok: false, mensaje: 'El estado seleccionado no es válido.' })
    }

    // Buscar el usuario a actualizar
    const usuario = await Usuario.findByPk(id)
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' })
    }

    // Impedir que un Subdirector cambie el estado de un Director
    const usuarioRolActual = await Rol.findByPk(usuario.id_rol)
    if (req.usuario.rol === 'Subdirector' && usuarioRolActual?.nombre === 'Director') {
      return res.status(403).json({
        ok: false,
        mensaje: 'No tienes permisos para modificar el estado de un Director.'
      })
    }

    // Impedir desactivarse a uno mismo
    if (parseInt(id) === req.usuario.id_usuario) {
      return res.status(400).json({ ok: false, mensaje: 'No puedes cambiar el estado de tu propia cuenta.' })
    }

    await usuario.update({ id_estado })

    // Obtener usuario actualizado con asociaciones
    const usuarioActualizado = await Usuario.findByPk(id, {
      include: [
        { model: Rol, as: 'rol', attributes: ['id_rol', 'nombre'] },
        { model: Estado, as: 'estado', attributes: ['id_estado', 'estado'] }
      ]
    })

    // Registrar auditoría de cambio de estado
    await registrarAccion(req, 'CAMBIO_ESTADO_CUENTA', `Estado de cuenta de ${usuarioActualizado.nombre_completo} cambiado a '${estadoExiste.estado}'.`, { id_usuario_afectado: id, nuevo_estado: estadoExiste.estado })

    return res.json({
      ok: true,
      mensaje: `✔ Estado de usuario actualizado a "${estadoExiste.estado}" exitosamente.`,
      usuario: {
        id: usuarioActualizado.id_usuario,
        nombre: usuarioActualizado.nombre_completo,
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono,
        avatar: usuarioActualizado.avatar,
        rol: usuarioActualizado.rol ? usuarioActualizado.rol.nombre : null,
        id_rol: usuarioActualizado.rol ? usuarioActualizado.rol.id_rol : null,
        estado: usuarioActualizado.estado ? usuarioActualizado.estado.estado : null,
        id_estado: usuarioActualizado.estado ? usuarioActualizado.estado.id_estado : null,
      }
    })
  } catch (error) {
    console.error('[AUTH] Error al actualizar estado:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error interno al actualizar el estado del usuario.' })
  }
})

// ── DELETE /api/auth/usuarios/:id ────────────────────────
// Eliminar un usuario (Protegido, solo Director/Subdirector con validación de dependencias)
router.delete('/usuarios/:id', authMiddleware, checkRole(['Director', 'Subdirector']), async (req, res) => {
  const { id } = req.params

  try {
    // Impedir eliminarse a uno mismo
    if (parseInt(id) === req.usuario.id_usuario) {
      return res.status(400).json({ ok: false, mensaje: 'No puedes eliminar tu propia cuenta.' })
    }

    // Buscar el usuario a eliminar
    const usuario = await Usuario.findByPk(id)
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' })
    }

    // Impedir que un Subdirector elimine a un Director o a otro Subdirector
    const usuarioRolActual = await Rol.findByPk(usuario.id_rol)
    if (req.usuario.rol === 'Subdirector' && 
        (usuarioRolActual?.nombre === 'Director' || usuarioRolActual?.nombre === 'Subdirector')) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No tienes permisos para eliminar a otros directores o subdirectores.'
      })
    }

    // VALIDACIÓN DE INTEGRIDAD REFERENCIAL
    // 1. Verificar si tiene proyectos registrados
    const { Proyecto, Envio } = require('../models')
    const tieneProyectos = await Proyecto.findOne({ where: { registrado_por: id } })
    if (tieneProyectos) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No se puede eliminar al usuario porque tiene proyectos registrados a su nombre. Te sugerimos "Suspender" su acceso en su lugar.'
      })
    }

    // 2. Verificar si tiene envíos asociados
    const tieneEnvios = await Envio.findOne({ where: { id_usuario: id } })
    if (tieneEnvios) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No se puede eliminar al usuario porque tiene registros de envíos de boletines a su nombre. Te sugerimos "Suspender" su acceso en su lugar.'
      })
    }

    // Proceder a eliminar el avatar físico del disco si existe
    if (usuario.avatar) {
      const fileSubPath = usuario.avatar.replace(/^\/uploads/, '')
      const path = require('path')
      const fs = require('fs')
      const absolutePath = path.join(__dirname, '..', '..', 'uploads', fileSubPath)
      try {
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath)
        }
      } catch (err) {
        console.error('[DELETE USUARIO] Error al eliminar archivo de avatar anterior:', err.message)
      }
    }

    // Eliminar físicamente de la base de datos
    await usuario.destroy()

    // Registrar auditoría de eliminación de usuario
    await registrarAccion(req, 'ELIMINAR_USUARIO', `Usuario eliminado permanentemente: ${usuario.nombre_completo} (${usuario.email})`, { id_usuario_eliminado: id, nombre: usuario.nombre_completo, email: usuario.email })

    return res.json({
      ok: true,
      mensaje: '✔ Usuario eliminado correctamente del sistema.'
    })
  } catch (error) {
    console.error('[AUTH] Error al eliminar usuario:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error interno al procesar la eliminación del usuario.' })
  }
})

// ── GET /api/auth/audit-logs ─────────────────────────────
// Obtener los últimos 50 registros de auditoría (Protegido, excluyendo IP por seguridad)
router.get('/audit-logs', authMiddleware, async (req, res) => {
  try {
    const { AuditLog } = require('../models')
    const logs = await AuditLog.findAll({
      attributes: { exclude: ['ip_direccion'] },
      limit: 50,
      order: [['fecha_hora', 'DESC']]
    })
    return res.json({ ok: true, logs })
  } catch (error) {
    console.error('[AUTH] Error al consultar logs:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error al consultar los registros de auditoría.' })
  }
})

module.exports = router
