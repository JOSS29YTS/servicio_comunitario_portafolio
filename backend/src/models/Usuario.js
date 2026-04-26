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
  ultimo_acceso: {
    type:      DataTypes.DATE,
    allowNull: true,
    comment:   'Última vez que inició sesión',
  },
}, {
  tableName:  'usuario',
  timestamps: false,
  comment:    'Tabla de usuarios del sistema (solo Dirección)',
})

module.exports = Usuario
