// ============================================================
// SCRIPT: Sincronizar modelos con la base de datos MySQL
// Ejecutar con: npm run db:sync
// ============================================================
require('dotenv').config()
const { sequelize, testConnection } = require('./database')

// Importar todos los modelos para que se registren
require('../models')

async function sync() {
  await testConnection()

  console.log('\n\x1b[33m⟳\x1b[0m  Sincronizando modelos con la base de datos...\n')

  // alter:true actualiza las tablas existentes sin borrar datos
  // Usar force:true SOLO en desarrollo para resetear todo
  await sequelize.sync({ alter: true })

  console.log('\n\x1b[32m✔\x1b[0m  Base de datos sincronizada correctamente.')
  console.log('\x1b[36mTablas creadas/actualizadas:\x1b[0m')
  console.log('  • estado')
  console.log('  • rol')
  console.log('  • usuario')
  console.log('  • categoria')
  console.log('  • promocion')
  console.log('  • proyecto')
  console.log('  • estudiante')
  console.log('  • proyecto_estudiante')
  console.log('  • archivo_pdf')
  console.log('  • envio')
  console.log('  • destinatario_envio')

  process.exit(0)
}

sync().catch(err => {
  console.error('\x1b[31m✘\x1b[0m Error al sincronizar:', err)
  process.exit(1)
})
