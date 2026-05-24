// ============================================================
// APP — Servidor Express
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const path    = require('path')

const { testConnection } = require('./config/database')
require('./models')   // registra modelos y asociaciones
require('./config/backupScheduler') // inicializa planificador de respaldos

// Rutas
const authRoutes = require('./routes/auth.routes')

// ── Inicializar Express ───────────────────────────────────
const app  = express()
const PORT = process.env.PORT || 3001

// ── Middlewares globales ──────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Servir archivos PDF subidos con soporte robusto de CORS para permitir descargas AJAX/Blob desde el frontend
app.use(
  '/uploads',
  cors({
    origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods:     ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition', 'Content-Length']
  }),
  express.static(path.join(__dirname, '..', 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  })
)

// Middleware global para deshabilitar la caché en las respuestas de la API
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const bocetoRoutes = require('./routes/boceto.routes')
const categoriaRoutes = require('./routes/categoria.routes')
const dashboardRoutes = require('./routes/dashboard.routes')
const proyectoRoutes = require('./routes/proyecto.routes')
const backupRoutes = require('./routes/backup.routes')
const boletinRoutes = require('./routes/boletin.routes')
const estudianteRoutes = require('./routes/estudiante.routes')

app.use('/api/auth', authRoutes)
app.use('/api/boceto', bocetoRoutes)
app.use('/api/categorias', categoriaRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/proyectos', proyectoRoutes)
app.use('/api/backup', backupRoutes)
app.use('/api/boletines', boletinRoutes)
app.use('/api/estudiantes', estudianteRoutes)

// Ruta de salud — verificar que el servidor está corriendo
app.get('/api/health', (req, res) => {
  res.json({
    ok:        true,
    mensaje:   '✔ Servidor funcionando correctamente.',
    sistema:   'Repositorio Académico — Colegio NSF',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    ok:      false,
    mensaje: `Ruta ${req.method} ${req.originalUrl} no encontrada.`,
  })
})

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status || 500).json({
    ok:      false,
    mensaje: err.message || 'Error interno del servidor.',
  })
})

// ── Arrancar servidor ─────────────────────────────────────
async function start() {
  await testConnection()

  app.listen(PORT, () => {
    console.log('')
    console.log('\x1b[35m╔══════════════════════════════════════════╗\x1b[0m')
    console.log('\x1b[35m║  Repositorio Académico — Servidor        ║\x1b[0m')
    console.log('\x1b[35m║  Colegio Nuestra Señora de Fátima        ║\x1b[0m')
    console.log('\x1b[35m╚══════════════════════════════════════════╝\x1b[0m')
    console.log(`\x1b[32m✔\x1b[0m  API corriendo en: \x1b[36mhttp://localhost:${PORT}/api\x1b[0m`)
    console.log(`\x1b[32m✔\x1b[0m  Health check:     \x1b[36mhttp://localhost:${PORT}/api/health\x1b[0m`)
    console.log(`\x1b[32m✔\x1b[0m  Modo:             \x1b[33m${process.env.NODE_ENV || 'development'}\x1b[0m`)
    console.log('')
  })
}

start()
