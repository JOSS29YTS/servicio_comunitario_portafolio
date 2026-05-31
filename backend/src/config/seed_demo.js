// ============================================================
// SCRIPT: Seed Demo — Llenar la base de datos Aiven/Local con
// datos ficticios premium de alta calidad en español para demostración.
// Ejecutar con: npm run db:seed:demo
// ============================================================
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { sequelize, testConnection } = require('./database')
const { 
  Usuario, Rol, Estado, Categoria, Promocion, 
  Tutor, Estudiante, Proyecto, ProyectoTutor, 
  ProyectoEstudiante, ArchivoPdf, Envio, DestinatarioEnvio, AuditLog 
} = require('../models')

// Función auxiliar para crear PDFs de simulación válidos
function crearPdfDemo(filePath, titulo, autores, tutor) {
  const contentStream = `BT
/F1 16 Tf
50 750 Td
(Colegio Nuestra Senora de Fatima) Tj
/F1 12 Tf
0 -30 Td
(REPOSITORIO ACADEMICO - PORTAFOLIO DE PROYECTOS) Tj
/F1 11 Tf
0 -40 Td
(Titulo del Proyecto:) Tj
0 -20 Td
(${titulo.substring(0, 65)}) Tj
${titulo.length > 65 ? `0 -15 Td (${titulo.substring(65, 130)}) Tj` : ''}
${titulo.length > 130 ? `0 -15 Td (${titulo.substring(130, 195)}) Tj` : ''}
0 -40 Td
(Autores: ${autores.join(', ')}) Tj
0 -20 Td
(Tutor Asesor: ${tutor}) Tj
0 -40 Td
(Documento PDF de simulacion para el modo demostracion.) Tj
0 -20 Td
(El sistema completo admite la indexacion automatica de documentos reales) Tj
0 -15 Td
(mediante la API de Google Gemini, extrayendo resumenes y metadatos) Tj
0 -15 Td
(de forma inteligente a la base de datos en tiempo de ejecucion.) Tj
ET`;

  const streamLength = Buffer.byteLength(contentStream);

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [ 0 0 612 792 ] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000305 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${305 + 50 + streamLength}
%%EOF`;

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, pdf);
}

async function seedDemo() {
  await testConnection()

  console.log('\n\x1b[33m⟳\x1b[0m  Limpiando tablas de la base de datos para simulación limpia...\n')
  
  // Desactivar restricciones de Foreign Key temporalmente para truncar limpiamente
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')

  // Truncar todas las tablas relacionales para evitar duplicados
  await AuditLog.destroy({ where: {}, truncate: true, force: true })
  await DestinatarioEnvio.destroy({ where: {}, truncate: true, force: true })
  await Envio.destroy({ where: {}, truncate: true, force: true })
  await ArchivoPdf.destroy({ where: {}, truncate: true, force: true })
  await ProyectoEstudiante.destroy({ where: {}, truncate: true, force: true })
  await ProyectoTutor.destroy({ where: {}, truncate: true, force: true })
  await Proyecto.destroy({ where: {}, truncate: true, force: true })
  await Estudiante.destroy({ where: {}, truncate: true, force: true })
  await Tutor.destroy({ where: {}, truncate: true, force: true })
  await Promocion.destroy({ where: {}, truncate: true, force: true })
  await Usuario.destroy({ where: {}, truncate: true, force: true })
  await Categoria.destroy({ where: {}, truncate: true, force: true })
  await Rol.destroy({ where: {}, truncate: true, force: true })
  await Estado.destroy({ where: {}, truncate: true, force: true })

  // Reactivar restricciones de Foreign Key
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
  console.log('  ✔ Limpieza de tablas completada.')

  // 1. ESTADOS DE CUENTA
  console.log('\n\x1b[33m⟳\x1b[0m  Creando estados de cuenta...')
  const estados = {}
  for (const nombreEstado of ['Activo', 'Pendiente', 'Rechazado']) {
    const estado = await Estado.create({ estado: nombreEstado })
    estados[nombreEstado] = estado.id_estado
    console.log(`  ✔ Estado '${nombreEstado}' creado (ID: ${estado.id_estado})`)
  }

  // 2. ROLES
  console.log('\n\x1b[33m⟳\x1b[0m  Creando roles de usuario...')
  const roles = {}
  for (const nombreRol of ['Director', 'Subdirector', 'Profesor']) {
    const rol = await Rol.create({ nombre: nombreRol })
    roles[nombreRol] = rol.id_rol
    console.log(`  ✔ Rol '${nombreRol}' creado (ID: ${rol.id_rol})`)
  }

  // 3. CATEGORÍAS TEMÁTICAS
  console.log('\n\x1b[33m⟳\x1b[0m  Creando categorías...')
  const categorias = {}
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
    const categoria = await Categoria.create(cat)
    categorias[cat.nombre] = categoria.id_categoria
    console.log(`  ✔ Categoría '${cat.nombre}' creada (ID: ${categoria.id_categoria})`)
  }

  // 4. USUARIOS
  console.log('\n\x1b[33m⟳\x1b[0m  Creando usuarios institucionales...')
  const contrasenaHash = await bcrypt.hash('demo123', 12)
  const directorClaveHash = await bcrypt.hash(process.env.DIRECTOR_PASSWORD || 'director123', 12)

  const usuarioDemo = await Usuario.create({
    nombre_completo: 'Usuario Demo',
    email: 'demo@admin.com',
    contrasena_hash: contrasenaHash,
    id_rol: roles['Subdirector'],
    id_estado: estados['Activo'],
    creado_en: new Date(),
    ultima_conexion: new Date()
  })
  console.log(`  ✔ Usuario Demo creado (demo@admin.com / demo123)`)

  const usuarioDirector = await Usuario.create({
    nombre_completo: process.env.DIRECTOR_NAME || 'Alejandro Villa',
    email: process.env.DIRECTOR_EMAIL || 'director@admin.com',
    contrasena_hash: directorClaveHash,
    id_rol: roles['Director'],
    id_estado: estados['Activo'],
    creado_en: new Date(),
    ultima_conexion: new Date(Date.now() - 3600000 * 2) // Hace 2 horas
  })
  console.log(`  ✔ Director Privado creado (${usuarioDirector.email} / ${process.env.DIRECTOR_PASSWORD || 'director123'})`)

  // 5. PROMOCIONES
  console.log('\n\x1b[33m⟳\x1b[0m  Creando años de promoción...')
  const promociones = {}
  const anios = [2022, 2023, 2024, 2025]
  for (const anio of anios) {
    const promo = await Promocion.create({
      anio,
      descripcion: `Promoción de Bachilleres del año ${anio}`
    })
    promociones[anio] = promo.id_promocion
    console.log(`  ✔ Promoción año ${anio} creada (ID: ${promo.id_promocion})`)
  }

  // 6. TUTORES
  console.log('\n\x1b[33m⟳\x1b[0m  Creando profesores tutores...')
  const tutoresNombres = [
    'Profa. Carmen Julia García',
    'Prof. Roberto Mendoza',
    'Profa. Teresa de Jesús Gómez',
    'Ing. Carlos Hernández',
    'Lic. Beatriz Elena Colmenares'
  ]
  const tutores = []
  for (const nombre of tutoresNombres) {
    const tutor = await Tutor.create({ nb_tutor: nombre })
    tutores.push(tutor)
    console.log(`  ✔ Tutor '${nombre}' creado (ID: ${tutor.id_tutor})`)
  }

  // 7. ESTUDIANTES
  console.log('\n\x1b[33m⟳\x1b[0m  Creando estudiantes egresados...')
  const estudiantesInfo = [
    { nombre_completo: 'Sofía Martínez', anio_egreso: 2024 },
    { nombre_completo: 'Daniel Gómez', anio_egreso: 2024 },
    { nombre_completo: 'Gabriel Silva', anio_egreso: 2024 },
    { nombre_completo: 'María Alejandra Rojas', anio_egreso: 2023 },
    { nombre_completo: 'Andrea Hernández', anio_egreso: 2023 },
    { nombre_completo: 'Valeria López', anio_egreso: 2023 },
    { nombre_completo: 'Sebastián Álvarez', anio_egreso: 2025 },
    { nombre_completo: 'Camila Fernández', anio_egreso: 2025 },
    { nombre_completo: 'José Manuel Blanco', anio_egreso: 2025 },
    { nombre_completo: 'Isabella Castro', anio_egreso: 2022 },
    { nombre_completo: 'Santiago Torres', anio_egreso: 2022 },
    { nombre_completo: 'Natalia Díaz', anio_egreso: 2022 },
    { nombre_completo: 'Juan Pablo Pérez', anio_egreso: 2024 },
    { nombre_completo: 'Valentina Vargas', anio_egreso: 2024 },
    { nombre_completo: 'Diego Salazar', anio_egreso: 2023 },
    { nombre_completo: 'Mariana Méndez', anio_egreso: 2023 },
    { nombre_completo: 'Elena Castellanos', anio_egreso: 2025 },
    { nombre_completo: 'Laura Rodríguez', anio_egreso: 2025 },
    { nombre_completo: 'Carlos Eduardo Ortiz', anio_egreso: 2022 },
    { nombre_completo: 'Moisés David Rincón', anio_egreso: 2024 },
    { nombre_completo: 'Gabriela Escalona', anio_egreso: 2024 },
    { nombre_completo: 'Ricardo Cabrera', anio_egreso: 2023 },
    { nombre_completo: 'Adriana Colina', anio_egreso: 2023 },
    { nombre_completo: 'Fabiola Rosales', anio_egreso: 2025 }
  ]
  const estudiantes = []
  for (const est of estudiantesInfo) {
    const estudiante = await Estudiante.create(est)
    estudiantes.push(estudiante)
  }
  console.log(`  ✔ ${estudiantes.length} estudiantes registrados correctamente.`)

  // 8. PROYECTOS PREPARADOS
  console.log('\n\x1b[33m⟳\x1b[0m  Creando proyectos de investigación con metadatos de IA (Gemini)...')
  
  const proyectosSeeds = [
    {
      titulo: 'Diseño e instalación de un sistema de captación de agua de lluvia para el riego de áreas verdes escolares',
      tema: 'Desarrollo sustentable y captación pluvial',
      descripcion_breve: 'Este proyecto consistió en diseñar y montar un prototipo funcional de recolección de agua pluvial utilizando materiales de bajo costo y botellas PET recicladas. El agua recolectada se destinó al mantenimiento del huerto escolar y áreas verdes del Colegio, reduciendo significativamente el consumo de agua potable.',
      categoria_nombre: 'Medio ambiente y ecología',
      anio_egreso: 2024,
      estudiantes_indices: [0, 1, 2], // Sofía Martínez, Daniel Gómez, Gabriel Silva
      tutor_indice: 3, // Ing. Carlos Hernández
      resumen_ia: {
        tema_especifico: "Desarrollo sustentable y captación pluvial",
        resumen_estructurado: {
          problema_planteado: "El alto consumo de agua potable para el riego de las áreas verdes del colegio, lo que incrementaba los costos operativos y el impacto ecológico durante la temporada de sequía.",
          objetivo_general: "Diseñar e implementar un sistema artesanal de recolección de agua de lluvia como alternativa sustentable para el riego escolar.",
          metodologia: "Investigación de campo y diseño de ingeniería básica. Se recolectaron tuberías de PVC en desuso y envases de plástico de 5 litros. Se instalaron canaletas en los techos del pabellón B y se conectaron a tres tanques de almacenamiento con capacidad total de 600 litros.",
          resultados_principales: "Se logró recolectar un promedio de 450 litros semanales durante los meses de lluvia, cubriendo el 80% de la demanda de riego del huerto escolar. Se redujo la huella de carbono institucional y se generó conciencia ecológica.",
          conclusiones: "Los sistemas de captación pluvial caseros son altamente viables y replicables en comunidades escolares, promoviendo el cuidado de los recursos naturales a un costo mínimo.",
          palabras_clave: ["Captación pluvial", "Reciclaje", "Sustentabilidad", "Huerto escolar"]
        }
      }
    },
    {
      titulo: 'Campaña digital interactiva contra el ciberacoso y para la promoción de la ciudadanía digital en estudiantes de secundaria',
      tema: 'Seguridad digital y prevención del ciberacoso',
      descripcion_breve: 'Desarrollo de un sitio web interactivo y charlas guiadas en las aulas del Colegio Nuestra Señora de Fátima para educar a los jóvenes sobre los peligros del ciberacoso, la protección de la privacidad en línea y la importancia de construir una huella digital positiva.',
      categoria_nombre: 'Tecnología e innovación',
      anio_egreso: 2023,
      estudiantes_indices: [3, 4, 5], // María Alejandra Rojas, Andrea Hernández, Valeria López
      tutor_indice: 0, // Profa. Carmen Julia García
      resumen_ia: {
        tema_especifico: "Seguridad digital y prevención del ciberacoso",
        resumen_estructurado: {
          problema_planteado: "El incremento de casos no reportados de acoso cibernético entre estudiantes de educación media, derivado del uso no supervisado de redes sociales y la falta de información preventiva.",
          objetivo_general: "Fomentar la sana convivencia digital a través de una campaña interactiva y formativa orientada a estudiantes de secundaria.",
          metodologia: "Metodología mixta con encuestas diagnósticas virtuales, diseño de una página informativa usando herramientas interactivas, y realización de talleres lúdicos presenciales enfocados en empatía virtual.",
          resultados_principales: "Se capacitaron a 180 estudiantes. El 92% de los participantes demostró mayor capacidad para identificar conductas de ciberacoso en una prueba posterior y aprendió canales seguros de denuncia en el colegio.",
          conclusiones: "La educación activa en ciudadanía digital es indispensable en la era moderna para empoderar a los jóvenes, mitigando los riesgos del entorno virtual de forma constructiva.",
          palabras_clave: ["Ciberacoso", "Redes sociales", "Prevención", "Ciudadanía digital"]
        }
      }
    },
    {
      titulo: 'Programa formativo en finanzas personales y habilidades de emprendimiento para familias de la comunidad Fátima',
      tema: 'Educación financiera y microemprendimiento',
      descripcion_breve: 'Creación y facilitación de un manual práctico con talleres sobre presupuesto familiar, ahorro programado y creación de modelos de negocio sencillos para padres de familia y pequeños comerciantes de los alrededores de la institución.',
      categoria_nombre: 'Economía y emprendimiento',
      anio_egreso: 2025,
      estudiantes_indices: [6, 7, 8], // Sebastián Álvarez, Camila Fernández, José Manuel Blanco
      tutor_indice: 4, // Lic. Beatriz Elena Colmenares
      resumen_ia: {
        tema_especifico: "Educación financiera y microemprendimiento",
        resumen_estructurado: {
          problema_planteado: "La inestabilidad financiera familiar y la falta de conocimientos básicos de contabilidad que limitaban la sostenibilidad de los microemprendimientos locales de la comunidad de Fátima.",
          objetivo_general: "Desarrollar capacidades de presupuesto familiar y estructuración de modelos de negocios básicos en representantes de la comunidad.",
          metodologia: "Investigación participativa de campo. Se diseñaron 5 módulos interactivos sobre flujo de caja, ahorro familiar y técnicas básicas de ventas. Se impartieron talleres presenciales los sábados durante dos meses.",
          resultados_principales: "Asistencia de 35 familias. El 80% implementó un registro diario de gastos en casa. Dos participantes lograron reestructurar sus precios de venta obteniendo un margen de ganancia real un 15% superior.",
          conclusiones: "La educación financiera de base tiene un efecto transformador inmediato en la economía doméstica y empodera a los emprendedores populares para tomar decisiones comerciales más seguras.",
          palabras_clave: ["Presupuesto familiar", "Emprendimiento", "Educación financiera", "Desarrollo local"]
        }
      }
    },
    {
      titulo: 'Creación de un herbario escolar interactivo para la valorización de la flora medicinal autóctona',
      tema: 'Botánica y medicina tradicional',
      descripcion_breve: 'Investigación y clasificación científica de especies vegetales con propiedades medicinales cultivadas en la región. Se diseñaron fichas técnicas con códigos QR instalados en el jardín botánico de la escuela para que los alumnos accedan a información sobre sus usos y dosis seguras.',
      categoria_nombre: 'Ciencia y experimentación',
      anio_egreso: 2022,
      estudiantes_indices: [9, 10, 11], // Isabella Castro, Santiago Torres, Natalia Díaz
      tutor_indice: 2, // Profa. Teresa de Jesús Gómez
      resumen_ia: {
        tema_especifico: "Botánica y medicina tradicional",
        resumen_estructurado: {
          problema_planteado: "La pérdida del conocimiento tradicional sobre el uso de plantas medicinales locales y el desinterés de los jóvenes por las disciplinas botánicas tradicionales.",
          objetivo_general: "Catalogar las especies botánicas medicinales del colegio y crear un sistema digitalizado de consulta para toda la comunidad educativa.",
          metodologia: "Recolección y secado de muestras vegetales, clasificación taxonómica con apoyo de expertos, diseño de una base de datos en línea y generación de códigos QR físicos instalados en los maceteros del jardín escolar.",
          resultados_principales: "Se catalogaron con éxito 24 especies botánicas medicinales. Se realizaron visitas guiadas tecnológicas para alumnos de primaria, dinamizando la asignatura de ciencias biológicas.",
          conclusiones: "La integración de tecnologías de la información con el estudio de las ciencias naturales incrementa notablemente la motivación estudiantil y contribuye a rescatar el patrimonio biocultural.",
          palabras_clave: ["Herbario", "Plantas medicinales", "Códigos QR", "Biodiversidad local"]
        }
      }
    },
    {
      titulo: 'Estudio del impacto del ruido ambiental en los niveles de concentración de los estudiantes de educación básica',
      tema: 'Contaminación acústica y rendimiento académico',
      descripcion_breve: 'Monitoreo con decibelímetros de los niveles de ruido en las aulas de clase y su correlación con la fatiga auditiva y dificultades de atención en alumnos de 1er a 6to grado. Propuesta de barreras acústicas ecológicas basadas en plantas trepadoras.',
      categoria_nombre: 'Salud y bienestar',
      anio_egreso: 2024,
      estudiantes_indices: [12, 13, 19], // Juan Pablo Pérez, Valentina Vargas, Moisés David Rincón
      tutor_indice: 1, // Prof. Roberto Mendoza
      resumen_ia: {
        tema_especifico: "Contaminación acústica y rendimiento académico",
        resumen_estructurado: {
          problema_planteado: "El constante ruido provocado por el tráfico vehicular de la avenida adyacente que interrumpe las actividades docentes y genera cansancio mental en los niños.",
          objetivo_general: "Evaluar los niveles de ruido ambiental dentro de las aulas y proponer una solución natural de atenuación acústica.",
          metodologia: "Investigación de campo cuantitativa. Se realizaron mediciones de ruido durante tres semanas en diferentes horarios lectivos. Se aplicaron encuestas de percepción cognitiva a profesores y alumnos.",
          resultados_principales: "Se registraron picos de hasta 78 dB en las aulas externas, excediendo el límite recomendado por la OMS (55 dB). Se determinó una relación directa entre el ruido de tráfico y los errores en tareas de atención sostenida.",
          conclusiones: "Es urgente intervenir arquitectónica o ecológicamente las aulas expuestas. La barrera verde propuesta es una alternativa viable para mitigar la contaminación sonora y embellecer el plantel.",
          palabras_clave: ["Contaminación acústica", "Rendimiento escolar", "Salud auditiva", "Barreras verdes"]
        }
      }
    },
    {
      titulo: 'Manual interactivo de valores ciudadanos y resolución pacífica de conflictos para escolares de primaria',
      tema: 'Convivencia pacífica y mediación escolar',
      descripcion_breve: 'Diseño de historietas didácticas y dinámicas de mediación de conflictos en el patio escolar, capacitando a alumnos voluntarios como "Mediadores de Paz" para disminuir la violencia verbal y fomentar el diálogo.',
      categoria_nombre: 'Valores y ciudadanía',
      anio_egreso: 2023,
      estudiantes_indices: [14, 15, 21], // Diego Salazar, Mariana Méndez, Ricardo Cabrera
      tutor_indice: 2, // Profa. Teresa de Jesús Gómez
      resumen_ia: {
        tema_especifico: "Convivencia pacífica y mediación escolar",
        resumen_estructurado: {
          problema_planteado: "El aumento de discusiones y violencia verbal en los recreos debido a la falta de herramientas de autocontrol y empatía interpersonal en los niños de primaria.",
          objetivo_general: "Capacitar a la comunidad estudiantil en mediación de pares y resolución pacífica de diferencias.",
          metodologia: "Investigación acción participativa. Se seleccionaron y adiestraron 12 estudiantes de 5to y 6to grado. Se editó un manual ilustrado de resolución de conflictos y se crearon 'puntos de encuentro pacífico' durante el recreo.",
          resultados_principales: "Disminución del 40% de los reportes por agresiones en la coordinación de disciplina escolar. Los mediadores resolvieron satisfactoriamente 28 conflictos menores en tres semanas.",
          conclusiones: "La mediación entre pares transfiere la responsabilidad de la paz a los propios estudiantes, preparándolos para ser ciudadanos tolerantes y proactivos en la resolución de problemas.",
          palabras_clave: ["Resolución de conflictos", "Valores", "Mediación escolar", "Convivencia"]
        }
      }
    },
    {
      titulo: 'Estrategias lúdicas para el fomento de la lectura de cuentos tradicionales en la educación inicial',
      tema: 'Animación a la lectura y literatura infantil',
      descripcion_breve: 'Creación de un rincón de lectura viajero dotado de cuentos infantiles elaborados con material reciclado por las estudiantes de secundaria, implementando lecturas dramatizadas e interactivas semanales en los salones de preescolar.',
      categoria_nombre: 'Educación',
      anio_egreso: 2025,
      estudiantes_indices: [16, 17, 23], // Elena Castellanos, Laura Rodríguez, Fabiola Rosales
      tutor_indice: 0, // Profa. Carmen Julia García
      resumen_ia: {
        tema_especifico: "Animación a la lectura y literatura infantil",
        resumen_estructurado: {
          problema_planteado: "El bajo interés por la lectura recreativa y el escaso desarrollo del vocabulario comprensivo en niños de educación inicial debido al sobreestímulo de pantallas digitales.",
          objetivo_general: "Estimular el hábito lector e imaginación creativa en infantes de 4 a 5 años mediante estrategias teatrales y lúdicas.",
          metodologia: "Proyecto aplicado. Se confeccionaron 15 teatrillos portátiles y marionetas. Se planificaron lecturas interactivas de 20 minutos con dinámicas corporales y preguntas guiadas.",
          resultados_principales: "El 85% de los niños mostró mayor interés en manipular libros de forma voluntaria. Las docentes del nivel inicial reportaron un avance significativo en los niveles de expresión oral y comprensión de textos.",
          conclusiones: "La lectura compartida y teatralizada sigue siendo una de las técnicas de estimulación cognitiva infantil más poderosas, superior a cualquier interfaz pasiva digital.",
          palabras_clave: ["Comprensión lectora", "Educación inicial", "Material reciclado", "Teatro infantil"]
        }
      }
    },
    {
      titulo: 'Desarrollo de un mapa interactivo digital de la historia y patrimonio cultural del Casco Histórico de la ciudad',
      tema: 'Historia local y georreferenciación cultural',
      descripcion_breve: 'Investigación bibliográfica y de campo de los monumentos históricos de la zona. Se creó un mapa interactivo utilizando herramientas gratuitas de geolocalización que incluye grabaciones sonoras y fotos históricas, accesible para turistas y residentes.',
      categoria_nombre: 'Historia y patrimonio',
      anio_egreso: 2022,
      estudiantes_indices: [18, 20, 22], // Carlos Eduardo Ortiz, Gabriela Escalona, Adriana Colina
      tutor_indice: 4, // Lic. Beatriz Elena Colmenares
      resumen_ia: {
        tema_especifico: "Historia local y georreferenciación cultural",
        resumen_estructurado: {
          problema_planteado: "La falta de preservación de la memoria histórica local y el desconocimiento generalizado de los jóvenes sobre el valor patrimonial de los edificios coloniales circundantes.",
          objetivo_general: "Recuperar y difundir el patrimonio histórico-cultural del Casco Histórico a través de herramientas de cartografía interactiva digital.",
          metodologia: "Entrevistas al cronista local, recopilación fotográfica antigua, redacción de 12 reseñas de monumentos clave, grabación de audio-guías descriptivas por los estudiantes y montaje en un mapa interactivo en línea.",
          resultados_principales: "Se creó un mapa virtual con 12 estaciones de interés patrimonial. Se registraron más de 340 visitas digitales únicas en la semana de lanzamiento y se obsequió el enlace al concejo municipal.",
          conclusiones: "La cartografía digital permite democratizar el acceso al conocimiento histórico local, transformando monumentos fríos en experiencias interactivas atractivas para las nuevas generaciones.",
          palabras_clave: ["Patrimonio cultural", "Historia local", "Mapa interactivo", "Identidad ciudadana"]
        }
      }
    }
  ]

  let idxP = 1
  for (const ps of proyectosSeeds) {
    // Buscar FKs
    const id_promocion = promociones[ps.anio_egreso]
    const id_categoria = categorias[ps.categoria_nombre]

    if (!id_promocion || !id_categoria) {
      console.warn(`[ADVERTENCIA] Saltando proyecto por falta de promoción o categoría: ${ps.titulo}`)
      continue
    }

    // Crear el proyecto
    const proyecto = await Proyecto.create({
      titulo: ps.titulo,
      tema: ps.tema,
      descripcion_breve: ps.descripcion_breve,
      id_promocion,
      id_categoria,
      registrado_por: usuarioDirector.id_usuario,
      creado_en: new Date(Date.now() - 3600000 * 24 * (idxP * 5)), // Fechas escalonadas de registro
      resumen_ia: JSON.stringify(ps.resumen_ia)
    })

    // Vincular tutor
    const tutorAsignado = tutores[ps.tutor_indice]
    await ProyectoTutor.create({
      id_proyecto: proyecto.id_proyecto,
      id_tutor: tutorAsignado.id_tutor
    })

    // Vincular estudiantes
    const estudiantesNombres = []
    for (const estIdx of ps.estudiantes_indices) {
      const estObj = estudiantes[estIdx]
      await ProyectoEstudiante.create({
        id_proyecto: proyecto.id_proyecto,
        id_estudiante: estObj.id_estudiante
      })
      estudiantesNombres.push(estObj.nombre_completo)
    }

    // Crear PDF físico de simulación real en el disco duro local
    const pdfFilename = `proyecto_demo_${proyecto.id_proyecto}.pdf`
    const relativePath = `/uploads/proyectos/${pdfFilename}`
    const absolutePath = path.join(__dirname, '..', '..', relativePath)

    crearPdfDemo(absolutePath, proyecto.titulo, estudiantesNombres, tutorAsignado.nb_tutor)

    // Registrar archivo PDF en BD
    await ArchivoPdf.create({
      id_proyecto: proyecto.id_proyecto,
      nombre_archivo: `Propuesta_Oficial_${pdfFilename}`,
      ruta_almacenamiento: relativePath,
      tamano_bytes: fs.statSync(absolutePath).size,
      subido_en: proyecto.creado_en
    })

    console.log(`  ✔ Proyecto #${idxP} registrado: '${proyecto.titulo.substring(0, 45)}...'`)
    idxP++
  }

  // 9. ENVÍOS DE SIMULACIÓN
  console.log('\n\x1b[33m⟳\x1b[0m  Creando envíos de cortesía simulados...')
  const proyectosExistentes = await Proyecto.findAll()
  if (proyectosExistentes.length >= 2) {
    const envio1 = await Envio.create({
      id_proyecto: proyectosExistentes[0].id_proyecto,
      id_usuario: usuarioDemo.id_usuario,
      enviado_en: new Date(Date.now() - 3600000 * 4), // Hace 4 horas
      motivo: 'Solicitud del tutor de campo para revisión final externa.'
    })
    await DestinatarioEnvio.create({
      id_envio: envio1.id_envio,
      email: 'profesor.evaluador@fatima.edu.ve',
      nombre: 'Prof. Evaluador Externo'
    })

    const envio2 = await Envio.create({
      id_proyecto: proyectosExistentes[1].id_proyecto,
      id_usuario: usuarioDirector.id_usuario,
      enviado_en: new Date(Date.now() - 3600000 * 24), // Hace 1 día
      motivo: 'Envío de cortesía institucional a Zona Educativa.'
    })
    await DestinatarioEnvio.create({
      id_envio: envio2.id_envio,
      email: 'tramites.zona@ministerio.gob.ve',
      nombre: 'Coordinación General Zona Educativa'
    })
    console.log('  ✔ Envíos simulados creados con éxito.')
  }

  // 10. HISTORIAL DE AUDITORÍA (AUDIT LOGS)
  console.log('\n\x1b[33m⟳\x1b[0m  Creando bitácora de auditoría histórica para la demo...')
  const auditLogs = [
    {
      id_usuario: usuarioDirector.id_usuario,
      usuario_nombre: usuarioDirector.nombre_completo,
      usuario_email: usuarioDirector.email,
      accion: 'INICIO_SESION',
      descripcion: 'Sesión administrativa iniciada con éxito mediante autenticación JWT segura.',
      ip_direccion: '192.168.1.10',
      fecha_hora: new Date(Date.now() - 3600000 * 2.5)
    },
    {
      id_usuario: usuarioDirector.id_usuario,
      usuario_nombre: usuarioDirector.nombre_completo,
      usuario_email: usuarioDirector.email,
      accion: 'CREAR_PROYECTO',
      descripcion: `Se registró el proyecto de investigación '${proyectosExistentes[0]?.titulo}' en la plataforma.`,
      ip_direccion: '192.168.1.10',
      fecha_hora: new Date(Date.now() - 3600000 * 2.4)
    },
    {
      id_usuario: usuarioDirector.id_usuario,
      usuario_nombre: usuarioDirector.nombre_completo,
      usuario_email: usuarioDirector.email,
      accion: 'RESPALDO_COMPLETADO',
      descripcion: 'Respaldo automático del sistema completado con éxito. Generado archivo ZIP local.',
      ip_direccion: '127.0.0.1',
      fecha_hora: new Date(Date.now() - 3600000 * 2.2)
    },
    {
      id_usuario: usuarioDemo.id_usuario,
      usuario_nombre: usuarioDemo.nombre_completo,
      usuario_email: usuarioDemo.email,
      accion: 'INICIO_SESION',
      descripcion: 'Acceso concedido al portafolio público para Usuario Demo.',
      ip_direccion: '186.24.95.12',
      fecha_hora: new Date(Date.now() - 3600000 * 0.8)
    },
    {
      id_usuario: usuarioDemo.id_usuario,
      usuario_nombre: usuarioDemo.nombre_completo,
      usuario_email: usuarioDemo.email,
      accion: 'ENVIAR_CORREO',
      descripcion: `Se envió copia en PDF del proyecto '${proyectosExistentes[0]?.titulo}' al correo profesor.evaluador@fatima.edu.ve.`,
      ip_direccion: '186.24.95.12',
      fecha_hora: new Date(Date.now() - 3600000 * 0.5)
    }
  ]

  for (const log of auditLogs) {
    await AuditLog.create(log)
  }
  console.log('  ✔ Bitácora de auditoría histórica cargada correctamente.')

  console.log('\n\x1b[32m✔✔✔ EL SISTEMA SE HA LLENADO CON DATOS FICTICIOS PREMIUM CORRECTAMENTE Y ESTÁ LISTO PARA LA DEMO. \x1b[0m\n')
  process.exit(0)
}

seedDemo().catch(err => {
  console.error('\x1b[31m✘\x1b[0m Error en seed de demostración:', err)
  process.exit(1)
})
