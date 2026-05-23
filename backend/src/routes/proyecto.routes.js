// ============================================================
// ENRUTADOR: Proyectos — Registro, CRUD y Carga de PDFs
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const express = require('express')
const router  = express.Router()
const fs      = require('fs')
const path    = require('path')
const { Op }  = require('sequelize')
const upload  = require('../middlewares/upload')
const authMiddleware = require('../middlewares/auth')
const { Proyecto, ArchivoPdf, Estudiante, ProyectoEstudiante, Categoria, Promocion } = require('../models')
const { sequelize }  = require('../config/database')

// ============================================================
// 1. POST /api/proyectos — Registrar un nuevo proyecto de investigación con archivo PDF
// ============================================================
router.post(
  '/',
  authMiddleware,
  (req, res, next) => {
    // Ejecutar la subida del archivo usando multer
    // 'archivo_pdf' es la clave que debe enviar el cliente vía FormData
    upload.single('archivo_pdf')(req, res, (err) => {
      if (err) {
        // Capturar errores específicos de Multer (límite de tamaño o tipo de archivo)
        let mensajeError = err.message
        if (err.code === 'LIMIT_FILE_SIZE') {
          const maxMb = process.env.MAX_FILE_SIZE_MB || 20
          mensajeError = `El archivo excede el tamaño máximo permitido de ${maxMb}MB.`
        }
        return res.status(400).json({
          ok:      false,
          mensaje: mensajeError
        })
      }
      next()
    })
  },
  async (req, res) => {
    const t = await sequelize.transaction()
    try {
      const { titulo, descripcion_breve, tema, id_promocion, anio, id_categoria, categoria, estudiantes } = req.body

      // 1. Obtener o crear la Categoría por su nombre o ID de forma flexible
      let finalIdCategoria = id_categoria
      if (!finalIdCategoria && categoria) {
        const catFound = await Categoria.findOne({
          where: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('nombre')),
            categoria.toLowerCase().trim()
          )
        })
        if (catFound) {
          finalIdCategoria = catFound.id_categoria
        } else {
          // Si no existe, crear la categoría dinámicamente al vuelo
          const newCat = await Categoria.create({
            nombre: categoria.trim(),
            descripcion: 'Categoría creada automáticamente desde el registro de proyectos.'
          }, { transaction: t })
          finalIdCategoria = newCat.id_categoria
        }
      }

      // 2. Obtener o crear la Promoción (Año) por su número de forma flexible
      let finalIdPromocion = id_promocion
      if (!finalIdPromocion && anio) {
        const targetAnio = parseInt(anio)
        const promFound = await Promocion.findOne({
          where: { anio: targetAnio }
        })
        if (promFound) {
          finalIdPromocion = promFound.id_promocion
        } else {
          // Crear promoción al vuelo
          const newProm = await Promocion.create({
            anio: targetAnio,
            descripcion: `Promoción del año ${targetAnio}`
          }, { transaction: t })
          finalIdPromocion = newProm.id_promocion
        }
      }

      // Validar campos obligatorios finales del proyecto
      if (!titulo || !finalIdPromocion || !finalIdCategoria) {
        // Si falta información, eliminamos el archivo físico guardado para evitar basura en el servidor
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path)
        }
        return res.status(400).json({
          ok:      false,
          mensaje: 'Los campos Título, Promoción (Año) y Categoría son requeridos.'
        })
      }

      // 3. Crear el proyecto en la base de datos
      const nuevoProyecto = await Proyecto.create({
        titulo,
        descripcion_breve: descripcion_breve || null,
        tema:              tema || null,
        id_promocion:      finalIdPromocion,
        id_categoria:      finalIdCategoria,
        registrado_por:    req.usuario.id_usuario // Inyectado desde authMiddleware
      }, { transaction: t })

      // 4. Si se subió un archivo, guardar la información del archivo PDF asociado
      if (req.file) {
        const relativePath = `/uploads/proyectos/${req.file.filename}`
        await ArchivoPdf.create({
          id_proyecto:         nuevoProyecto.id_proyecto,
          nombre_archivo:      req.file.originalname,
          ruta_almacenamiento: relativePath,
          tamano_bytes:        req.file.size
        }, { transaction: t })
      }

      // 5. Vincular estudiantes asociados (Autores del proyecto)
      if (estudiantes) {
        let listaEstudiantes = []
        if (typeof estudiantes === 'string') {
          try {
            listaEstudiantes = JSON.parse(estudiantes)
          } catch {
            // Intentar separar por comas si viene como string simple
            listaEstudiantes = estudiantes.split(',').map(s => ({ nombre_completo: s.trim() })).filter(s => s.nombre_completo)
          }
        } else if (Array.isArray(estudiantes)) {
          listaEstudiantes = estudiantes
        }

        for (const est of listaEstudiantes) {
          // Puede ser un string simple en el array o un objeto
          const nombreEst = (typeof est === 'string') ? est.trim() : est.nombre_completo?.trim()
          let idEstudiante = est.id_estudiante

          if (nombreEst) {
            // Buscar si ya existe el estudiante en BD por nombre completo
            let estudianteObj = await Estudiante.findOne({
              where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('nombre_completo')),
                nombreEst.toLowerCase()
              )
            })

            if (!estudianteObj) {
              // Si no existe, crear estudiante al vuelo
              estudianteObj = await Estudiante.create({
                nombre_completo: nombreEst,
                anio_egreso:     anio ? parseInt(anio) : null
              }, { transaction: t })
            }
            idEstudiante = estudianteObj.id_estudiante
          }

          if (idEstudiante) {
            await ProyectoEstudiante.create({
              id_proyecto:   nuevoProyecto.id_proyecto,
              id_estudiante: idEstudiante
            }, { transaction: t })
          }
        }
      }

      // Confirmar todos los cambios en BD
      await t.commit()

      return res.status(201).json({
        ok:       true,
        mensaje:  '✔ Proyecto registrado e integrado al repositorio académico exitosamente.',
        proyecto: nuevoProyecto
      })

    } catch (error) {
      // Revertir base de datos si ocurre cualquier error
      await t.rollback()

      // Limpiar archivo físico del disco para no generar basura redundante
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }

      console.error('[PROYECTOS] Error al registrar proyecto:', error)
      return res.status(500).json({
        ok:      false,
        mensaje: 'Error interno al procesar el registro del proyecto.',
        error:   error.message
      })
    }
  }
)

// ============================================================
// 2. GET /api/proyectos — Listar proyectos con paginación
// ============================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page   = parseInt(req.query.page) || 1
    const limit  = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    const { count, rows } = await Proyecto.findAndCountAll({
      limit,
      offset,
      order: [['creado_en', 'DESC']],
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id_categoria', 'nombre'] },
        { model: Promocion, as: 'promocion', attributes: ['id_promocion', 'anio'] },
        { model: ArchivoPdf, as: 'archivos', attributes: ['id_archivo', 'nombre_archivo', 'ruta_almacenamiento', 'tamano_bytes'] },
        { 
          model: Estudiante, 
          as: 'estudiantes', 
          attributes: ['id_estudiante', 'nombre_completo', 'anio_egreso'],
          through: { attributes: [] } // Excluye la tabla pivote de la respuesta JSON limpia
        }
      ],
      distinct: true // Previene conteos inflados al usar relaciones N:M
    })

    const totalPages = Math.ceil(count / limit)

    return res.json({
      ok: true,
      count,
      totalPages,
      currentPage: page,
      proyectos: rows
    })
  } catch (error) {
    console.error('[PROYECTOS] Error al listar proyectos:', error)
    return res.status(500).json({
      ok:      false,
      mensaje: 'Error interno al obtener la lista de proyectos.',
      error:   error.message
    })
  }
})

// ============================================================
// 3. GET /api/proyectos/buscar — Búsqueda Avanzada con Filtros
// ============================================================
router.get('/buscar', authMiddleware, async (req, res) => {
  try {
    const { q, anio, categoria, tiene_pdf } = req.query

    const whereClause = {}
    const includeFilters = []

    // A. Filtro por Año de Promoción
    if (anio && anio.trim() !== '') {
      includeFilters.push({
        model: Promocion,
        as: 'promocion',
        where: { anio: parseInt(anio) },
        attributes: ['id_promocion', 'anio']
      })
    } else {
      includeFilters.push({
        model: Promocion,
        as: 'promocion',
        attributes: ['id_promocion', 'anio']
      })
    }

    // B. Filtro por Categoría
    if (categoria && categoria.trim() !== '') {
      const catWhere = isNaN(categoria)
        ? { nombre: categoria }
        : { id_categoria: parseInt(categoria) }

      includeFilters.push({
        model: Categoria,
        as: 'categoria',
        where: catWhere,
        attributes: ['id_categoria', 'nombre']
      })
    } else {
      includeFilters.push({
        model: Categoria,
        as: 'categoria',
        attributes: ['id_categoria', 'nombre']
      })
    }

    // C. Filtro "Solo con PDF"
    const requiredPdf = (tiene_pdf === 'true' || tiene_pdf === true)
    includeFilters.push({
      model: ArchivoPdf,
      as: 'archivos',
      required: requiredPdf, // INNER JOIN si es requerido (excluye proyectos sin pdf), LEFT JOIN si no
      attributes: ['id_archivo', 'nombre_archivo', 'ruta_almacenamiento', 'tamano_bytes']
    })

    // D. Búsqueda libre (q) en título, tema o descripción del proyecto
    if (q && q.trim()) {
      const term = `%${q.trim().toLowerCase()}%`
      whereClause[Op.or] = [
        sequelize.where(sequelize.fn('LOWER', sequelize.col('titulo')), 'LIKE', term),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('tema')), 'LIKE', term),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('descripcion_breve')), 'LIKE', term)
      ]
    }

    // E. Estudiantes asociados (siempre incluidos en la respuesta)
    includeFilters.push({
      model: Estudiante,
      as: 'estudiantes',
      attributes: ['id_estudiante', 'nombre_completo', 'anio_egreso'],
      through: { attributes: [] }
    })

    const proyectos = await Proyecto.findAll({
      where: whereClause,
      include: includeFilters,
      order: [['creado_en', 'DESC']]
    })

    return res.json({
      ok: true,
      count: proyectos.length,
      proyectos
    })
  } catch (error) {
    console.error('[PROYECTOS] Error en búsqueda avanzada:', error)
    return res.status(500).json({
      ok:      false,
      mensaje: 'Error interno al procesar la búsqueda de proyectos.',
      error:   error.message
    })
  }
})

// ============================================================
// 4. GET /api/proyectos/:id — Obtener Detalle de un Proyecto
// ============================================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const proyecto = await Proyecto.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id_categoria', 'nombre', 'descripcion'] },
        { model: Promocion, as: 'promocion', attributes: ['id_promocion', 'anio', 'descripcion'] },
        { model: ArchivoPdf, as: 'archivos', attributes: ['id_archivo', 'nombre_archivo', 'ruta_almacenamiento', 'tamano_bytes', 'subido_en'] },
        { 
          model: Estudiante, 
          as: 'estudiantes', 
          attributes: ['id_estudiante', 'nombre_completo', 'anio_egreso'],
          through: { attributes: [] }
        }
      ]
    })

    if (!proyecto) {
      return res.status(404).json({
        ok:      false,
        mensaje: 'Proyecto de investigación no encontrado en el sistema.'
      })
    }

    return res.json({
      ok: true,
      proyecto
    })
  } catch (error) {
    console.error('[PROYECTOS] Error al obtener detalle:', error)
    return res.status(500).json({
      ok:      false,
      mensaje: 'Error interno al obtener el detalle del proyecto.',
      error:   error.message
    })
  }
})

module.exports = router
