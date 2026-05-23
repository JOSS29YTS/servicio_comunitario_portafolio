// ============================================================
// ENRUTADOR: Dashboard — Estadísticas y Métricas
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const express = require('express')
const router  = express.Router()
const fs      = require('fs')
const path    = require('path')
const { Proyecto, ArchivoPdf, Usuario, Estado } = require('../models')
const authMiddleware = require('../middlewares/auth')

// Límite de disco por defecto: 500 MB (en bytes)
const LIMIT_STORAGE_BYTES = (parseInt(process.env.LIMIT_STORAGE_MB) || 500) * 1024 * 1024

// Función recursiva para calcular el tamaño real de una carpeta en disco
function getFolderSize(dirPath) {
  let totalSize = 0
  if (!fs.existsSync(dirPath)) return 0

  try {
    const files = fs.readdirSync(dirPath)
    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const stats = fs.statSync(filePath)
      if (stats.isDirectory()) {
        totalSize += getFolderSize(filePath)
      } else {
        totalSize += stats.size
      }
    }
  } catch (error) {
    console.error(`[DASHBOARD] Error al calcular tamaño de ${dirPath}:`, error.message)
  }
  return totalSize
}

// GET /api/dashboard/stats — Obtener estadísticas globales del repositorio
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // 1. Conteo total de proyectos
    const totalProyectos = await Proyecto.count()

    // 2. Conteo total de archivos PDF únicos
    const totalPdfs = await ArchivoPdf.count()

    // 3. Conteo de usuarios activos
    const estadoActivo = await Estado.findOne({ where: { estado: 'Activo' } })
    const usuariosActivos = estadoActivo 
      ? await Usuario.count({ where: { id_estado: estadoActivo.id_estado } })
      : 0

    // 4. Suma del tamaño total de archivos registrados (en bytes)
    const totalBytesDb = await ArchivoPdf.sum('tamano_bytes') || 0

    // 5. Tamaño físico real en disco de la carpeta de uploads (incluye avatares, boceto, etc.)
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
    const espacioUsadoDisco = getFolderSize(uploadsDir)

    // Límite de disco en bytes
    const limiteDiscoBytes = LIMIT_STORAGE_BYTES

    // Porcentaje de uso
    const porcentajeUso = parseFloat(((espacioUsadoDisco / limiteDiscoBytes) * 100).toFixed(2))

    res.json({
      ok: true,
      stats: {
        totalProyectos,
        totalPdfs,
        usuariosActivos,
        tamanoTotalDbBytes: parseInt(totalBytesDb),
        espacioUsadoDiscoBytes: espacioUsadoDisco,
        limiteDiscoBytes,
        porcentajeUso: porcentajeUso > 100 ? 100 : porcentajeUso,
      }
    })
  } catch (error) {
    console.error('[DASHBOARD] Error al obtener estadísticas:', error)
    res.status(500).json({
      ok:      false,
      mensaje: 'Error interno del servidor al calcular las estadísticas del dashboard.',
      error:   error.message
    })
  }
})

module.exports = router
