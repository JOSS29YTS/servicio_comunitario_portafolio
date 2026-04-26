// ============================================================
// MODELO: EnvioEmail
// Tabla: envio_email
// Descripción: Registro de correos enviados con PDFs de proyectos
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const EnvioEmail = sequelize.define('EnvioEmail', {
  id_envio: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  id_proyecto: {
    type:       DataTypes.INTEGER,
    allowNull:  false,
    references: { model: 'proyecto', key: 'id_proyecto' },
    comment:    'Proyecto cuyo PDF fue enviado',
  },
  id_usuario: {
    type:       DataTypes.INTEGER,
    allowNull:  false,
    references: { model: 'usuario', key: 'id_usuario' },
    comment:    'Usuario (directora) que realizó el envío',
  },
  destinatario_email: {
    type:      DataTypes.STRING(200),
    allowNull: false,
    validate:  { isEmail: true },
    comment:   'Correo del destinatario (docente o estudiante)',
  },
  destinatario_nombre: {
    type:      DataTypes.STRING(150),
    allowNull: true,
    comment:   'Nombre del destinatario del correo',
  },
  enviado_en: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment:      'Fecha y hora en que se envió el correo',
  },
  motivo: {
    type:      DataTypes.STRING(300),
    allowNull: true,
    comment:   'Motivo o nota del envío (ej: solicitado por el docente Juan Pérez)',
  },
}, {
  tableName:  'envio_email',
  timestamps: false,
})

module.exports = EnvioEmail
