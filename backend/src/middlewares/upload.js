// ============================================================
// MIDDLEWARE: Subida y Validación de Archivos (Multer)
// Configura los límites, tipo de archivo (Solo PDF) y almacenamiento
// ============================================================
const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

// Directorio de almacenamiento desde .env o fallback
const uploadsDir = path.join(__dirname, '..', '..', process.env.UPLOADS_DIR || 'uploads')
const proyectosDir = path.join(uploadsDir, 'proyectos')

// Asegurar la existencia de las carpetas de subida
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
if (!fs.existsSync(proyectosDir)) {
  fs.mkdirSync(proyectosDir, { recursive: true })
}

// Configuración de disco y nombres de archivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, proyectosDir)
  },
  filename: (req, file, cb) => {
    // Nombre único seguro: timestamp + número aleatorio + extensión original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `proyecto-${uniqueSuffix}${ext}`)
  }
})

// Filtro de validación estricta de tipo de archivo: Solo PDF
const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf'
  const isPdfExt  = path.extname(file.originalname).toLowerCase() === '.pdf'

  if (isPdfMime && isPdfExt) {
    return cb(null, true)
  }

  // Error de validación
  cb(new Error('El archivo subido no es válido. Solo se permiten documentos en formato PDF.'))
}

// Límite de tamaño dinámico desde .env o fallback de 20MB
const maxFileSizeMb = parseInt(process.env.MAX_FILE_SIZE_MB) || 20
const limitBytes    = maxFileSizeMb * 1024 * 1024

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: limitBytes 
  },
  fileFilter: fileFilter
})

module.exports = upload
