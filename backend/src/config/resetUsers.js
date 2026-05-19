// ============================================================
// SCRIPT: resetUsers — Resetear tabla usuario e insertar cuenta única
// ============================================================
require('dotenv').config()
const bcrypt = require('bcryptjs')
const { sequelize } = require('./database')
const { Usuario, Rol, Estado } = require('../models')

async function run() {
  try {
    console.log('\n\x1b[33m⟳\x1b[0m  Iniciando reseteo de la tabla de usuarios...\n')
    
    // Desactivar temporalmente restricciones de foreign key para evitar bloqueos
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
    
    // Limpiar tabla usuario
    await Usuario.destroy({ where: {}, truncate: true, force: true })
    
    // Reactivar restricciones de foreign key
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
    
    console.log('  ✔ Tabla de usuarios limpiada por completo.')

    // Asegurar que el rol Director existe
    const [rolDirector] = await Rol.findOrCreate({ 
      where: { nombre: 'Director' },
      defaults: { nombre: 'Director' }
    })
    
    // Asegurar que el estado Activo existe
    const [estadoActivo] = await Estado.findOrCreate({ 
      where: { estado: 'Activo' },
      defaults: { estado: 'Activo' }
    })

    // Hashear la contraseña provista
    const contrasena_hash = await bcrypt.hash('React29d$', 12)

    // Crear el usuario único solicitado
    const nuevoUsuario = await Usuario.create({
      nombre_completo: 'ALEJANDRO VILLA',
      email:           'alejandrovilla2912@gmail.com',
      contrasena_hash,
      id_rol:          rolDirector.id_rol,
      id_estado:       estadoActivo.id_estado,
      telefono:        null,
      avatar:          null,
      creado_en:       new Date()
    })

    console.log('\n\x1b[32m✔\x1b[0m  Usuario administrador único configurado exitosamente:')
    console.log(`     Nombre:     ${nuevoUsuario.nombre_completo}`)
    console.log(`     Email:      ${nuevoUsuario.email}`)
    console.log(`     Contraseña: React29d$`)
    console.log(`     Rol:        Director`)
    console.log(`     Estado:     Activo`)
    console.log(`     Teléfono:   ${nuevoUsuario.telefono === null ? 'NULL (vacío)' : nuevoUsuario.telefono}`)
    console.log(`     Avatar:     ${nuevoUsuario.avatar === null ? 'NULL (vacío)' : nuevoUsuario.avatar}`)
    console.log(`     ID:         ${nuevoUsuario.id_usuario}`)
    console.log('')
    
    process.exit(0)
  } catch (error) {
    console.error('\n\x1b[31m✘\x1b[0m Error al resetear la tabla de usuarios:', error.message)
    process.exit(1)
  }
}

run()
