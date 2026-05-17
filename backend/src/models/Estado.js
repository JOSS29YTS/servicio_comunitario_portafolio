// ============================================================
// MODELO: Estado
// Tabla: estado
// Descripción: Estados de cuenta de usuario (Activo, Pendiente, etc.)
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const Estado = sequelize.define('Estado', {
  id_estado: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
    comment:       'Identificador único del estado',
  },
  estado: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    unique:    true,
    comment:   'Nombre del estado (ej: Activo, Pendiente, Rechazado)',
  },
}, {
  tableName:  'estado',
  timestamps: false,
  comment:    'Tabla de estados de cuenta de usuario',
})

module.exports = Estado
