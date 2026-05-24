// ============================================================
// ENRUTADOR: Boletines y Envío de Proyectos (Bulletin Routes)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const express = require('express')
const router  = express.Router()
const { body, validationResult } = require('express-validator')
const authMiddleware = require('../middlewares/auth')
const checkRole      = require('../middlewares/checkRole')
const { sequelize }  = require('../config/database')
const { Envio, DestinatarioEnvio, Proyecto, ArchivoPdf, Categoria, Promocion, Usuario } = require('../models')
const { sendProjectEmail } = require('../utils/emailService')
const { registrarAccion } = require('../services/auditService')

// ============================================================
// 1. GET /api/boletines/historial — Ver historial de envíos
// ============================================================
router.get('/historial', authMiddleware, checkRole(['Director', 'Subdirector']), async (req, res) => {
  try {
    const historial = await Envio.findAll({
      order: [['enviado_en', 'DESC']],
      include: [
        { 
          model: Proyecto, 
          as: 'proyecto', 
          attributes: ['id_proyecto', 'titulo', 'tema'],
          include: [
            { model: Categoria, as: 'categoria', attributes: ['id_categoria', 'nombre'] },
            { model: Promocion, as: 'promocion', attributes: ['id_promocion', 'anio'] },
            { model: ArchivoPdf, as: 'archivos', attributes: ['id_archivo', 'nombre_archivo', 'ruta_almacenamiento'] }
          ]
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id_usuario', 'nombre_completo', 'email']
        },
        {
          model: DestinatarioEnvio,
          as: 'destinatarios',
          attributes: ['id_destinatario', 'email', 'nombre']
        }
      ]
    })

    return res.json({
      ok: true,
      count: historial.length,
      historial
    })
  } catch (error) {
    console.error('[BOLETIN ROUTES] Error al obtener el historial de envíos:', error)
    return res.status(500).json({
      ok:      false,
      mensaje: 'Error interno al obtener el historial de envíos de boletines.',
      error:   error.message
    })
  }
})

// ============================================================
// 2. POST /api/boletines/enviar — Compartir proyecto por correo
// ============================================================
router.post(
  '/enviar',
  authMiddleware,
  [
    body('id_proyecto')
      .isInt().withMessage('El ID del proyecto debe ser un número entero válido.'),
    body('destinatarios')
      .isArray({ min: 1 }).withMessage('Debes indicar al menos un destinatario en un array.'),
    body('destinatarios.*.email')
      .isEmail().withMessage('Cada destinatario debe tener un correo electrónico válido.'),
    body('destinatarios.*.nombre')
      .optional({ checkFalsy: true }).isString().withMessage('El nombre debe ser una cadena de texto.')
  ],
  async (req, res) => {
    // Validar parámetros de entrada
    const errores = validationResult(req)
    if (!errores.isEmpty()) {
      return res.status(400).json({
        ok: false,
        errores: errores.array().map(e => e.msg)
      })
    }

    const { id_proyecto, motivo, destinatarios } = req.body
    const t = await sequelize.transaction()

    try {
      // A. Buscar el proyecto y cargar sus relaciones necesarias para el email
      const proyecto = await Proyecto.findByPk(id_proyecto, {
        include: [
          { model: Categoria, as: 'categoria', attributes: ['nombre'] },
          { model: Promocion, as: 'promocion', attributes: ['anio'] },
          { model: ArchivoPdf, as: 'archivos', attributes: ['nombre_archivo', 'ruta_almacenamiento'] }
        ]
      })

      if (!proyecto) {
        await t.rollback()
        return res.status(404).json({
          ok:      false,
          mensaje: 'Proyecto de investigación no encontrado.'
        })
      }

      // B. Registrar la cabecera del envío en la base de datos
      const nuevoEnvio = await Envio.create({
        id_proyecto:  proyecto.id_proyecto,
        id_usuario:   req.usuario.id_usuario,
        motivo:       motivo || null
      }, { transaction: t })

      // C. Registrar cada destinatario asociado al envío en la tabla pivote
      const destinatariosCreados = []
      for (const dest of destinatarios) {
        const destObj = await DestinatarioEnvio.create({
          id_envio: nuevoEnvio.id_envio,
          email:    dest.email.trim(),
          nombre:   dest.nombre ? dest.nombre.trim() : null
        }, { transaction: t })
        destinatariosCreados.push(destObj)
      }

      // D. Disparar el envío real/simulado del correo electrónico
      const resultadosEnvio = await sendProjectEmail(proyecto, destinatarios, motivo)

      // Registrar auditoría de boletín informativo enviado
      await registrarAccion(req, 'ENVIAR_BOLETIN_PROYECTO', `Se envió por correo el proyecto '${proyecto.titulo}' a ${destinatarios.length} destinatario(s).`, { id_proyecto, destinatarios: destinatarios.map(d => d.email) })

      // E. Confirmar la transacción en la BD
      await t.commit()

      return res.status(201).json({
        ok:           true,
        mensaje:      `✔ Proyecto compartido exitosamente con ${destinatarios.length} destinatario(s).`,
        envio:        nuevoEnvio,
        destinatarios: destinatariosCreados,
        despacho:     resultadosEnvio
      })

    } catch (error) {
      await t.rollback()
      console.error('[BOLETIN ROUTES] Error al enviar boletín:', error)
      return res.status(500).json({
        ok:      false,
        mensaje: 'Error interno al procesar el envío del boletín informativo.',
        error:   error.message
      })
    }
  }
)

module.exports = router
