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

    // Asegurar que el rol Subdirector existe
    const [rolSubdirector] = await Rol.findOrCreate({ 
      where: { nombre: 'Subdirector' },
      defaults: { nombre: 'Subdirector' }
    })
    
    // Asegurar que el estado Activo existe
    const [estadoActivo] = await Estado.findOrCreate({ 
      where: { estado: 'Activo' },
      defaults: { estado: 'Activo' }
    })

    // ==========================================
    // 1. USUARIO DEMO PÚBLICO (ROL: SUBDIRECTOR)
    // ==========================================
    const contrasena_demo_hash = await bcrypt.hash('demo123', 12)
    const usuarioDemo = await Usuario.create({
      nombre_completo: 'USUARIO DEMO',
      email:           'demo@admin.com',
      contrasena_hash: contrasena_demo_hash,
      id_rol:          rolSubdirector.id_rol,
      id_estado:       estadoActivo.id_estado,
      telefono:        null,
      avatar:          null,
      creado_en:       new Date()
    })

    console.log('\n\x1b[32m✔\x1b[0m  Usuario Demo configurado exitosamente:')
    console.log(`     Nombre:     ${usuarioDemo.nombre_completo}`)
    console.log(`     Email:      ${usuarioDemo.email}`)
    console.log(`     Contraseña: demo123`)
    console.log(`     Rol:        Subdirector`)
    console.log(`     Estado:     Activo`)
    console.log(`     ID:         ${usuarioDemo.id_usuario}\n`)

    // ==========================================
    // 2. USUARIO DIRECTOR PRIVADO (ROL: DIRECTOR)
    // ==========================================
    const dirNombre = process.env.DIRECTOR_NAME || 'Alejandro Villa'
    const dirEmail = process.env.DIRECTOR_EMAIL || 'director@admin.com'
    const dirClave = process.env.DIRECTOR_PASSWORD || 'director123'
    
    const contrasena_dir_hash = await bcrypt.hash(dirClave, 12)
    const usuarioDir = await Usuario.create({
      nombre_completo: dirNombre,
      email:           dirEmail,
      contrasena_hash: contrasena_dir_hash,
      id_rol:          rolDirector.id_rol,
      id_estado:       estadoActivo.id_estado,
      telefono:        null,
      avatar:          null,
      creado_en:       new Date()
    })

    console.log('\x1b[32m✔\x1b[0m  Director Privado configurado exitosamente:')
    console.log(`     Nombre:     ${usuarioDir.nombre_completo}`)
    console.log(`     Email:      ${usuarioDir.email}`)
    console.log(`     Contraseña: ${dirClave}`)
    console.log(`     Rol:        Director`)
    console.log(`     Estado:     Activo`)
    console.log(`     ID:         ${usuarioDir.id_usuario}\n`)
    
    process.exit(0)
  } catch (error) {
    console.error('\n\x1b[31m✘\x1b[0m Error al resetear la tabla de usuarios:', error.message)
    process.exit(1)
  }
}

run()
