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

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir archivos PDF subidos
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'))
)

// ── Rutas de la API ───────────────────────────────────────
app.use('/api/auth', authRoutes)

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
