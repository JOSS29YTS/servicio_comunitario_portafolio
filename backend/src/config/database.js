// ============================================================
// CONEXIÓN A LA BASE DE DATOS — Sequelize + MySQL
// Colegio Nuestra Señora de Fátima — Repositorio Académico
// ============================================================
const { Sequelize } = require('sequelize')
require('dotenv').config()

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {},
    logging: process.env.NODE_ENV === 'development'
      ? (msg) => console.log(`\x1b[36m[DB]\x1b[0m ${msg}`)
      : false,
    pool: {
      max:     5,
      min:     0,
      acquire: 30000,
      idle:    10000,
    },
    define: {
      timestamps:  false,   // cada modelo define sus propios timestamps
      underscored: true,    // snake_case en la BD
      charset:     'utf8mb4',
      collate:     'utf8mb4_unicode_ci',
    },
  }
)

// Probar la conexión
async function testConnection() {
  try {
    await sequelize.authenticate()
    console.log('\x1b[32m✔\x1b[0m Conexión a MySQL establecida correctamente.')
  } catch (error) {
    console.error('\x1b[31m✘\x1b[0m No se pudo conectar a MySQL:', error.message)
    process.exit(1)
  }
}

module.exports = { sequelize, testConnection }
