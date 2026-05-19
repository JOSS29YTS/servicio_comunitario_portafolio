// ============================================================
// MODELO: Usuario
// Tabla: usuario
// Descripción: Directora del colegio (único usuario del sistema)
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
    comment:       'Identificador único del usuario',
  },
  id_rol: {
    type:       DataTypes.INTEGER,
    allowNull:  false,
    references: { model: 'rol', key: 'id_rol' },
    comment:    'ID del rol asignado al usuario',
  },
  id_estado: {
    type:       DataTypes.INTEGER,
    allowNull:  false,
    references: { model: 'estado', key: 'id_estado' },
    comment:    'ID del estado de cuenta del usuario',
  },
  nombre_completo: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    comment:   'Nombre completo de la directora',
  },
  email: {
    type:      DataTypes.STRING(200),
    allowNull: false,
    unique:    true,
    validate:  { isEmail: true },
    comment:   'Correo institucional de la directora',
  },
  telefono: {
    type:      DataTypes.STRING(20),
    allowNull: true,
    comment:   'Número de teléfono opcional del usuario',
  },
  avatar: {
    type:      DataTypes.STRING(255),
    allowNull: true,
    comment:   'Ruta relativa del archivo de avatar del usuario guardado localmente',
  },
  contrasena_hash: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    comment:   'Contraseña hasheada con bcrypt',
  },
  creado_en: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment:      'Fecha de creación del usuario',
  },
  ultima_conexion: {
    type:      DataTypes.DATE,
    allowNull: true,
    comment:   'Fecha y hora de la última sesión iniciada',
  },
}, {
  tableName:  'usuario',
  timestamps: false,
  comment:    'Tabla de usuarios del sistema (solo Dirección)',
})

module.exports = Usuario
