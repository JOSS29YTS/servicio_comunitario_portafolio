// ============================================================
// RUTAS: Autenticación
// POST /api/auth/login    → Iniciar sesión
// POST /api/auth/registro → Registrar nuevo usuario
// GET  /api/auth/me       → Datos del usuario autenticado
// POST /api/auth/logout   → Cerrar sesión (informativo)
// ============================================================
const express  = require('express')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')

const { Usuario } = require('../models')
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
      // Buscar usuario por correo
      const usuario = await Usuario.findOne({ where: { email } })
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

      // Actualizar último acceso
      await usuario.update({ ultimo_acceso: new Date() })

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

      const usuario = await Usuario.create({
        nombre_completo,
        email,
        contrasena_hash,
      })

      const payload = {
        id_usuario:      usuario.id_usuario,
        email:           usuario.email,
        nombre_completo: usuario.nombre_completo,
      }

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      })

      return res.status(201).json({
        ok: true,
        mensaje: 'Registro exitoso.',
        token,
        usuario: {
          id_usuario:      usuario.id_usuario,
          nombre_completo: usuario.nombre_completo,
          email:           usuario.email,
        },
      })
    } catch (error) {
      console.error('[AUTH] Error en registro:', error)
      return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' })
    }
  }
)

// ── GET /api/auth/me ──────────────────────────────────────
// Requiere token válido — devuelve datos del usuario actual
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario, {
      attributes: ['id_usuario', 'nombre_completo', 'email', 'creado_en', 'ultimo_acceso'],
    })

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' })
    }

    return res.json({ ok: true, usuario })
  } catch (error) {
    console.error('[AUTH] Error en /me:', error)
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' })
  }
})

// ── POST /api/auth/logout ─────────────────────────────────
// El logout se maneja en el frontend eliminando el token
// Este endpoint es informativo/semántico
router.post('/logout', authMiddleware, (req, res) => {
  return res.json({
    ok:      true,
    mensaje: 'Sesión cerrada. Elimina el token en el cliente.',
  })
})

module.exports = router
