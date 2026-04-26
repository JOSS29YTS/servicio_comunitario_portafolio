// ============================================================
// MODELO: ProyectoEstudiante
// Tabla: proyecto_estudiante
// Descripción: Tabla pivote — relación N:M entre Proyecto y Estudiante
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const ProyectoEstudiante = sequelize.define('ProyectoEstudiante', {
  id_proyecto: {
    type:       DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'proyecto',   key: 'id_proyecto' },
  },
  id_estudiante: {
    type:       DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'estudiante', key: 'id_estudiante' },
  },
}, {
  tableName:  'proyecto_estudiante',
  timestamps: false,
  comment:    'Relación N:M — un proyecto puede tener múltiples estudiantes',
})

module.exports = ProyectoEstudiante
