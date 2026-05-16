// ============================================================
// MODELO: ProyectoTutor
// Tabla: proyecto_tutor
// Descripción: Tabla pivote — relación N:M entre Proyecto y Tutor
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const ProyectoTutor = sequelize.define('ProyectoTutor', {
  id_proyecto: {
    type:       DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'proyecto',   key: 'id_proyecto' },
  },
  id_tutor: {
    type:       DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'tutor', key: 'id_tutor' },
  },
}, {
  tableName:  'proyecto_tutor',
  timestamps: false,
  comment:    'Relación N:M — un proyecto puede tener múltiples tutores',
})

module.exports = ProyectoTutor
