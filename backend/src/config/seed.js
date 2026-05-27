// ============================================================
// SCRIPT: Seed — Insertar roles y usuario administrador
// Ejecutar con: npm run db:seed
// ============================================================
require('dotenv').config()
const bcrypt = require('bcryptjs')
const { sequelize, testConnection } = require('./database')
const { Usuario, Rol, Estado, Categoria } = require('../models')

async function seed() {
  await testConnection()

  console.log('\n\x1b[33m⟳\x1b[0m  Insertando estados de cuenta predeterminados...\n')
  const estadosPredeterminados = ['Activo', 'Pendiente', 'Rechazado']
  for (const nombreEstado of estadosPredeterminados) {
    const [estInst, creadoEst] = await Estado.findOrCreate({
      where: { estado: nombreEstado },
      defaults: { estado: nombreEstado }
    })
    if (creadoEst) {
      console.log(`  ✔ Estado '${nombreEstado}' creado exitosamente (ID: ${estInst.id_estado})`)
    } else {
      console.log(`  • Estado '${nombreEstado}' ya existía en el sistema.`)
    }
  }

  console.log('\n\x1b[33m⟳\x1b[0m  Insertando roles predeterminados de la institución...\n')
  const rolesPredeterminados = ['Director', 'Subdirector', 'Profesor']
  for (const nombreRol of rolesPredeterminados) {
    const [rolInst, creadoRol] = await Rol.findOrCreate({
      where: { nombre: nombreRol },
      defaults: { nombre: nombreRol }
    })
    if (creadoRol) {
      console.log(`  ✔ Rol '${nombreRol}' creado exitosamente (ID: ${rolInst.id_rol})`)
    } else {
      console.log(`  • Rol '${nombreRol}' ya existía en el sistema.`)
    }
  }

  console.log('\n\x1b[33m⟳\x1b[0m  Insertando categorías temáticas predeterminadas...\n')
  const categoriasPredeterminadas = [
    { nombre: 'Salud y bienestar', descripcion: 'Nutrición, salud mental, adicciones, sexualidad, enfermedades' },
    { nombre: 'Medio ambiente y ecología', descripcion: 'Contaminación, reciclaje, cambio climático, biodiversidad' },
    { nombre: 'Tecnología e innovación', descripcion: 'Redes sociales, inteligencia artificial, impacto digital' },
    { nombre: 'Sociedad y cultura', descripcion: 'Identidad, género, familia, migración, tradiciones' },
    { nombre: 'Educación', descripcion: 'Métodos de aprendizaje, deserción escolar, inclusión' },
    { nombre: 'Economía y emprendimiento', descripcion: 'Microempresas, finanzas personales, mercado laboral' },
    { nombre: 'Valores y ciudadanía', descripcion: 'Corrupción, derechos humanos, participación comunitaria' },
    { nombre: 'Ciencia y experimentación', descripcion: 'Proyectos con hipótesis, laboratorio, fenómenos naturales' },
    { nombre: 'Arte y comunicación', descripcion: 'Medios, expresión artística, patrimonio cultural' },
    { nombre: 'Deporte y recreación', descripcion: 'Actividad física, rendimiento, hábitos deportivos' },
    { nombre: 'Historia y patrimonio', descripcion: 'Historia local, memoria colectiva, identidad nacional' }
  ]

  for (const cat of categoriasPredeterminadas) {
    const [catInst, creadoCat] = await Categoria.findOrCreate({
      where: { nombre: cat.nombre },
      defaults: { descripcion: cat.descripcion }
    })
    if (creadoCat) {
      console.log(`  ✔ Categoría '${cat.nombre}' creada exitosamente.`)
    } else {
      await catInst.update({ descripcion: cat.descripcion })
      console.log(`  • Categoría '${cat.nombre}' ya existía (descripción actualizada).`)
    }
  }

  console.log('\n\x1b[33m⟳\x1b[0m  Insertando usuarios de la institución...\n')

  // Obtener IDs de roles
  const rolDirector = await Rol.findOne({ where: { nombre: 'Director' } })
  const idRolDirector = rolDirector ? rolDirector.id_rol : 1

  const rolSubdirector = await Rol.findOne({ where: { nombre: 'Subdirector' } })
  const idRolSubdirector = rolSubdirector ? rolSubdirector.id_rol : 2

  // Obtener ID del estado Activo
  const estadoActivo = await Estado.findOne({ where: { estado: 'Activo' } })
  const idEstadoActivo = estadoActivo ? estadoActivo.id_estado : 1

  // ==========================================
  // 1. USUARIO DEMO PÚBLICO (ROL: SUBDIRECTOR)
  // ==========================================
  const contrasena_demo_hash = await bcrypt.hash('demo123', 12)
  const [usuarioDemo, creadoDemo] = await Usuario.findOrCreate({
    where: { email: 'demo@admin.com' },
    defaults: {
      nombre_completo: 'USUARIO DEMO',
      email:           'demo@admin.com',
      contrasena_hash: contrasena_demo_hash,
      id_rol:          idRolSubdirector,
      id_estado:       idEstadoActivo,
      creado_en:       new Date(),
    },
  })

  if (creadoDemo) {
    console.log('  ✔ Usuario Demo creado exitosamente:')
  } else {
    await usuarioDemo.update({ 
      contrasena_hash: contrasena_demo_hash, 
      nombre_completo: 'USUARIO DEMO',
      id_rol:          idRolSubdirector,
      id_estado:       idEstadoActivo
    })
    console.log('  • Usuario Demo ya existía — datos actualizados:')
  }
  console.log(`     Nombre: ${usuarioDemo.nombre_completo}`)
  console.log(`     Email:  ${usuarioDemo.email}`)
  console.log(`     Rol:    Subdirector (ID: ${usuarioDemo.id_rol})`)
  console.log(`     Estado: Activo (ID: ${usuarioDemo.id_estado})`)
  console.log(`     ID:     ${usuarioDemo.id_usuario}\n`)

  // ==========================================
  // 2. USUARIO DIRECTOR PRIVADO (ROL: DIRECTOR)
  // ==========================================
  const dirNombre = process.env.DIRECTOR_NAME || 'Alejandro Villa'
  const dirEmail = process.env.DIRECTOR_EMAIL || 'director@admin.com'
  const dirClave = process.env.DIRECTOR_PASSWORD || 'director123'
  
  const contrasena_dir_hash = await bcrypt.hash(dirClave, 12)
  const [usuarioDir, creadoDir] = await Usuario.findOrCreate({
    where: { email: dirEmail },
    defaults: {
      nombre_completo: dirNombre,
      email:           dirEmail,
      contrasena_hash: contrasena_dir_hash,
      id_rol:          idRolDirector,
      id_estado:       idEstadoActivo,
      creado_en:       new Date(),
    },
  })

  if (creadoDir) {
    console.log('  ✔ Director Privado creado exitosamente:')
  } else {
    await usuarioDir.update({ 
      contrasena_hash: contrasena_dir_hash, 
      nombre_completo: dirNombre,
      id_rol:          idRolDirector,
      id_estado:       idEstadoActivo
    })
    console.log('  • Director Privado ya existía — datos actualizados:')
  }
  console.log(`     Nombre: ${usuarioDir.nombre_completo}`)
  console.log(`     Email:  ${usuarioDir.email}`)
  console.log(`     Rol:    Director (ID: ${usuarioDir.id_rol})`)
  console.log(`     Estado: Activo (ID: ${usuarioDir.id_estado})`)
  console.log(`     ID:     ${usuarioDir.id_usuario}\n`)

  process.exit(0)
}

seed().catch(err => {
  console.error('\x1b[31m✘\x1b[0m Error en seed:', err.message)
  process.exit(1)
})
