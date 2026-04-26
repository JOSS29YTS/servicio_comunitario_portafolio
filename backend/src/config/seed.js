// ============================================================
// SCRIPT: Seed — Insertar usuario administrador
// Ejecutar con: npm run db:seed
// ============================================================
require('dotenv').config()
const bcrypt = require('bcryptjs')
const { sequelize, testConnection } = require('./database')
const { Usuario } = require('../models')

async function seed() {
  await testConnection()

  console.log('\n\x1b[33m⟳\x1b[0m  Insertando usuario administrador...\n')

  const contrasena_hash = await bcrypt.hash('React29d$', 12)

  const [usuario, creado] = await Usuario.findOrCreate({
    where: { email: 'alejandrovilla2912@gmail.com' },
    defaults: {
      nombre_completo: 'ALEJANDRO VILLA',
      email:           'alejandrovilla2912@gmail.com',
      contrasena_hash,
      creado_en:       new Date(),
    },
  })

  if (creado) {
    console.log('\x1b[32m✔\x1b[0m  Usuario creado exitosamente:')
  } else {
    // Si ya existía, actualizar la contraseña por si acaso
    await usuario.update({ contrasena_hash, nombre_completo: 'ALEJANDRO VILLA' })
    console.log('\x1b[33m!\x1b[0m  Usuario ya existía — datos actualizados:')
  }

  console.log(`     Nombre: ${usuario.nombre_completo}`)
  console.log(`     Email:  ${usuario.email}`)
  console.log(`     ID:     ${usuario.id_usuario}`)
  console.log('')
  process.exit(0)
}

seed().catch(err => {
  console.error('\x1b[31m✘\x1b[0m Error en seed:', err.message)
  process.exit(1)
})
