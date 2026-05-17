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

  console.log('\n\x1b[33m⟳\x1b[0m  Insertando usuario administrador...\n')

  const contrasena_hash = await bcrypt.hash('React29d$', 12)

  // Obtener ID del rol Director
  const rolDirector = await Rol.findOne({ where: { nombre: 'Director' } })
  const idRolDirector = rolDirector ? rolDirector.id_rol : 1

  // Obtener ID del estado Activo
  const estadoActivo = await Estado.findOne({ where: { estado: 'Activo' } })
  const idEstadoActivo = estadoActivo ? estadoActivo.id_estado : 1

  const [usuario, creado] = await Usuario.findOrCreate({
    where: { email: 'alejandrovilla2912@gmail.com' },
    defaults: {
      nombre_completo: 'ALEJANDRO VILLA',
      email:           'alejandrovilla2912@gmail.com',
      contrasena_hash,
      id_rol:          idRolDirector,
      id_estado:       idEstadoActivo,
      creado_en:       new Date(),
    },
  })

  if (creado) {
    console.log('\x1b[32m✔\x1b[0m  Usuario creado exitosamente:')
  } else {
    // Si ya existía, actualizar la contraseña y asegurar el rol Director y estado Activo
    await usuario.update({ 
      contrasena_hash, 
      nombre_completo: 'ALEJANDRO VILLA',
      id_rol:          idRolDirector,
      id_estado:       idEstadoActivo
    })
    console.log('\x1b[33m!\x1b[0m  Usuario ya existía — datos actualizados:')
  }

  console.log(`     Nombre: ${usuario.nombre_completo}`)
  console.log(`     Email:  ${usuario.email}`)
  console.log(`     Rol:    Director (ID: ${usuario.id_rol})`)
  console.log(`     Estado: Activo (ID: ${usuario.id_estado})`)
  console.log(`     ID:     ${usuario.id_usuario}`)
  console.log('')
  process.exit(0)
}

seed().catch(err => {
  console.error('\x1b[31m✘\x1b[0m Error en seed:', err.message)
  process.exit(1)
})
