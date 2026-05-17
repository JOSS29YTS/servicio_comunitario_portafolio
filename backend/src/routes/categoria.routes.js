// ============================================================
// ENRUTADOR: Categoria — Obtención de Categorías Temáticas
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const express = require('express')
const router  = express.Router()
const { Categoria } = require('../models')

// GET /api/categorias — Listar todas las categorías de la base de datos
router.get('/', async (req, res) => {
  try {
    const lista = await Categoria.findAll({
      order: [['nombre', 'ASC']]
    })
    res.json({
      ok:         true,
      categorias: lista
    })
  } catch (error) {
    res.status(500).json({ 
      ok:      false, 
      mensaje: 'Error al obtener las categorías de la base de datos.',
      error:   error.message 
    })
  }
})

module.exports = router
