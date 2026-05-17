// ============================================================
// MODELO: Rol
// Tabla: rol
// Descripción: Roles de usuario en la plataforma (Director, etc.)
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const Rol = sequelize.define('Rol', {
  id_rol: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
    comment:       'Identificador único del rol',
  },
  nombre: {
    type:      DataTypes.STRING(50),
    allowNull: false,
    unique:    true,
    comment:   'Nombre del rol (ej: Director, Subdirector, Profesor)',
  },
}, {
  tableName:  'rol',
  timestamps: false,
  comment:    'Tabla de roles del sistema',
})

module.exports = Rol
