// ============================================================
// ENRUTADOR: Boceto — Gestión de Reglas y Pautas
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const express = require('express')
const router  = express.Router()
const fs      = require('fs')
const path    = require('path')
const authMiddleware = require('../middlewares/auth')
const checkRole      = require('../middlewares/checkRole')
const { registrarAccion } = require('../services/auditService')

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads')
const FILE_PATH   = path.join(UPLOADS_DIR, 'boceto_reglas.pdf')

// GET /api/boceto — Obtener estado y enlace del boceto
router.get('/', (req, res) => {
  try {
    const existe = fs.existsSync(FILE_PATH)
    res.json({
      ok:     true,
      existe,
      url:    existe ? '/uploads/boceto_reglas.pdf' : null,
    })
  } catch (error) {
    res.status(500).json({ 
      ok:      false, 
      mensaje: 'Error al verificar la existencia del boceto.',
      error:   error.message 
    })
  }
})

// POST /api/boceto — Cargar/Actualizar boceto PDF en Base64 (Protegido, solo Director/Subdirector)
router.post('/', authMiddleware, checkRole(['Director', 'Subdirector']), async (req, res) => {
  try {
    const { fileData } = req.body
    if (!fileData) {
      return res.status(400).json({ 
        ok:      false, 
        mensaje: 'No se recibió la información del archivo.' 
      })
    }

    // Asegurar que la carpeta de almacenamiento existe
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true })
    }

    // Extraer la cabecera del formato data URI en Base64 si existe
    const base64Data = fileData.replace(/^data:application\/pdf;base64,/, '')

    // Escribir el buffer binario en disco
    fs.writeFileSync(FILE_PATH, base64Data, 'base64')

    // Registrar auditoría de actualización de pautas
    await registrarAccion(req, 'ACTUALIZAR_BOCETO_REGLAS', 'Se cargó o actualizó el archivo PDF oficial con las reglas y pautas de investigación escolar.')

    res.json({
      ok:      true,
      mensaje: '✔ Boceto (Reglas y Pautas) del proyecto de investigación cargado exitosamente.',
      url:     '/uploads/boceto_reglas.pdf'
    })
  } catch (error) {
    res.status(500).json({ 
      ok:      false, 
      mensaje: 'Error al guardar el archivo PDF en el servidor.',
      error:   error.message 
    })
  }
})

module.exports = router
