// ============================================================
// MODELO: Tutor
// Tabla: tutor
// Descripción: Tutor o profesor asesor de un proyecto de investigación
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const Tutor = sequelize.define('Tutor', {
  id_tutor: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  nb_tutor: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    comment:   'Nombre completo del tutor o profesor asesor',
  },
}, {
  tableName:  'tutor',
  timestamps: false,
})

module.exports = Tutor
