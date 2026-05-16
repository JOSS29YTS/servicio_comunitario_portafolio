// ============================================================
// MODELO: Tutor
// Tabla: tutor
// Descripción: Tutor encargado de un proyecto
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const Tutor = sequelize.define('Tutor', {
  id_tutor: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  nombre_completo: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    comment:   'Nombre completo del tutor',
  },
  especialidad: {
    type:      DataTypes.STRING(150),
    allowNull: true,
    comment:   'Especialidad o área del tutor',
  },
}, {
  tableName:  'tutor',
  timestamps: false,
})

module.exports = Tutor
