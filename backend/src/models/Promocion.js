// ============================================================
// MODELO: Promocion
// Tabla: promocion
// Descripción: Año de graduación / promoción del colegio
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const Promocion = sequelize.define('Promocion', {
  id_promocion: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  anio: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    unique:    true,
    validate:  {
      min: 1990,
      max: 2100,
    },
    comment: 'Año de la promoción (ej: 2023)',
  },
  descripcion: {
    type:      DataTypes.STRING(200),
    allowNull: true,
    comment:   'Descripción opcional de la promoción',
  },
}, {
  tableName:  'promocion',
  timestamps: false,
})

module.exports = Promocion
