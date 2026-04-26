// ============================================================
// MODELO: Estudiante
// Tabla: estudiante
// Descripción: Estudiante autor de un proyecto
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const Estudiante = sequelize.define('Estudiante', {
  id_estudiante: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  nombre_completo: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    comment:   'Nombre completo del estudiante',
  },
  anio_egreso: {
    type:      DataTypes.INTEGER,
    allowNull: true,
    comment:   'Año en el que egresó el estudiante',
  },
}, {
  tableName:  'estudiante',
  timestamps: false,
})

module.exports = Estudiante
