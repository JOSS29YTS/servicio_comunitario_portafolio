// ============================================================
// ENRUTADOR: Estudiantes Egresados (Student Routes)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const express = require('express')
const router  = express.Router()
const { Estudiante, Proyecto, Categoria, Promocion } = require('../models')
const authMiddleware = require('../middlewares/auth')

// ============================================================
// 1. GET /api/estudiantes — Listar todos los estudiantes
// ============================================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const estudiantes = await Estudiante.findAll({
      include: [
        {
          model: Proyecto,
          as: 'proyectos',
          attributes: ['id_proyecto', 'titulo'],
          through: { attributes: [] }
        }
      ],
      order: [['nombre_completo', 'ASC']]
    })

    const mapped = estudiantes.map(est => ({
      id_estudiante: est.id_estudiante,
      nombre_completo: est.nombre_completo,
      anio_egreso: est.anio_egreso,
      total_proyectos: est.proyectos?.length || 0
    }))

    return res.json({
      ok: true,
      estudiantes: mapped
    })
  } catch (error) {
    console.error('[ESTUDIANTES ROUTES] Error al listar estudiantes:', error)
    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor al listar los estudiantes.',
      error: error.message
    })
  }
})

// ============================================================
// 2. GET /api/estudiantes/:id — Perfil detallado y Ficha Académica
// ============================================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const estudiante = await Estudiante.findByPk(id, {
      include: [
        {
          model: Proyecto,
          as: 'proyectos',
          include: [
            { model: Categoria, as: 'categoria', attributes: ['nombre'] },
            { model: Promocion, as: 'promocion', attributes: ['anio'] },
            { 
              model: Estudiante, 
              as: 'estudiantes', 
              attributes: ['id_estudiante', 'nombre_completo', 'anio_egreso'],
              through: { attributes: [] }
            }
          ],
          through: { attributes: [] }
        }
      ]
    })

    if (!estudiante) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Estudiante no encontrado en el sistema.'
      })
    }

    // Calcular la red de coautores de forma dinámica a partir de sus proyectos
    const coautoresMap = {}
    
    if (estudiante.proyectos) {
      estudiante.proyectos.forEach(proyecto => {
        if (proyecto.estudiantes) {
          proyecto.estudiantes.forEach(otroEst => {
            // Excluir al estudiante consultado de la lista de coautores
            if (otroEst.id_estudiante !== estudiante.id_estudiante) {
              coautoresMap[otroEst.id_estudiante] = {
                id_estudiante: otroEst.id_estudiante,
                nombre_completo: otroEst.nombre_completo,
                anio_egreso: otroEst.anio_egreso
              }
            }
          })
        }
      })
    }

    const coautores = Object.values(coautoresMap).sort((a, b) => 
      a.nombre_completo.localeCompare(b.nombre_completo)
    )

    // Formatear la lista de proyectos para el frontend
    const proyectosMapeados = estudiante.proyectos?.map(p => ({
      id_proyecto: p.id_proyecto,
      titulo: p.titulo,
      tema: p.tema || 'General',
      descripcion: p.descripcion || 'Sin descripción disponible.',
      anio: p.promocion?.anio || p.anio || 'N/A',
      categoria: p.categoria?.nombre || 'General',
      coautores: p.estudiantes
        ?.filter(e => e.id_estudiante !== estudiante.id_estudiante)
        .map(e => e.nombre_completo) || []
    })).sort((a, b) => Number(b.anio) - Number(a.anio)) || []

    return res.json({
      ok: true,
      estudiante: {
        id_estudiante: estudiante.id_estudiante,
        nombre_completo: estudiante.nombre_completo,
        anio_egreso: estudiante.anio_egreso || proyectosMapeados[0]?.anio || 'N/A',
        proyectos: proyectosMapeados,
        coautores: coautores,
        estadisticas: {
          total_proyectos: proyectosMapeados.length,
          total_coautores: coautores.length
        }
      }
    })

  } catch (error) {
    console.error('[ESTUDIANTES ROUTES] Error al obtener estudiante:', error)
    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor al procesar la ficha del estudiante.',
      error: error.message
    })
  }
})

module.exports = router
