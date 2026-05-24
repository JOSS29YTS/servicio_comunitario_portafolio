// ============================================================
// MODELO: AuditLog
// Tabla: audit_log
// Descripción: Registro de auditoría para trazabilidad de acciones
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const AuditLog = sequelize.define('AuditLog', {
  id_log: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
    comment:       'Identificador único del registro de auditoría',
  },
  id_usuario: {
    type:      DataTypes.INTEGER,
    allowNull: true,
    comment:   'ID del usuario que ejecutó la acción (NULL si es visitante/no autenticado)',
  },
  usuario_nombre: {
    type:      DataTypes.STRING(150),
    allowNull: true,
    comment:   'Nombre del usuario al momento del registro',
  },
  usuario_email: {
    type:      DataTypes.STRING(200),
    allowNull: true,
    comment:   'Correo electrónico del usuario al momento del registro',
  },
  accion: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    comment:   'Nombre de la acción (Ej: LOGIN_EXITOSO, CREAR_PROYECTO, ELIMINAR_USUARIO)',
  },
  descripcion: {
    type:      DataTypes.TEXT,
    allowNull: false,
    comment:   'Explicación textual y descriptiva de la acción realizada',
  },
  ip_direccion: {
    type:      DataTypes.STRING(45),
    allowNull: true,
    comment:   'Dirección IP del cliente que realizó la petición',
  },
  detalles: {
    type:      DataTypes.TEXT,
    allowNull: true,
    comment:   'Payload JSON o datos técnicos adicionales para auditoría detallada',
  },
  fecha_hora: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment:      'Fecha y hora en que se registró la acción',
  },
}, {
  tableName:  'audit_log',
  timestamps: false,
  comment:    'Bitácora de auditoría del sistema para control y seguridad',
})

module.exports = AuditLog
