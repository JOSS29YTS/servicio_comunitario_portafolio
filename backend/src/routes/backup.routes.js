// ============================================================
// ENRUTADOR: Respaldos y Sincronización (Backup Routes)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const express = require('express')
const router  = express.Router()
const authMiddleware = require('../middlewares/auth')
const checkRole = require('../middlewares/checkRole')
const { Usuario, Rol } = require('../models')
const { performBackup, getLastBackupInfo } = require('../utils/backupService')
const { syncLimiter } = require('../middlewares/rateLimiter')
const { registrarAccion } = require('../services/auditService')

// ============================================================
// 1. GET /api/backup/last — Obtener datos del último respaldo
// ============================================================
router.get('/last', authMiddleware, async (req, res) => {
  try {
    const backupInfo = getLastBackupInfo()
    if (!backupInfo) {
      return res.json({
        ok: true,
        mensaje: 'Pendiente de primer respaldo',
        backup: null
      })
    }
    return res.json({
      ok: true,
      backup: backupInfo
    })
  } catch (error) {
    console.error('[BACKUP ROUTES] Error al obtener info del último respaldo:', error)
    return res.status(500).json({
      ok:      false,
      mensaje: 'Error al obtener la información del último respaldo.',
      error:   error.message
    })
  }
})

// ============================================================
// 2. POST /api/backup/sincronizar — Forzar Sincronización Manual
// ============================================================
router.post('/sincronizar', authMiddleware, checkRole(['Director', 'Subdirector']), syncLimiter, async (req, res) => {
  try {
    console.log(`[BACKUP ROUTES] Sincronización manual forzada por ID usuario: ${req.usuario.id_usuario}`)

    // B. Disparar backup comprimido en ZIP y sincronización con Google Drive
    const backupInfo = await performBackup(req)

    return res.json({
      ok:      true,
      mensaje: '✔ Sincronización, compresión dual ZIP y respaldo en Google Drive completados de forma exitosa.',
      backup:  backupInfo
    })

  } catch (error) {
    console.error('[BACKUP ROUTES] Error al forzar sincronización:', error)
    return res.status(500).json({
      ok:      false,
      mensaje: 'Error interno del servidor al realizar el respaldo consolidado.',
      error:   error.message
    })
  }
})

module.exports = router
