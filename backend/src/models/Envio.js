// ============================================================
// MODELO: Envio
// Tabla: envio
// Descripción: Registro de envíos de correos de proyectos
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const Envio = sequelize.define('Envio', {
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
  enviado_en: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment:      'Fecha y hora en que se envió el correo',
  },
  motivo: {
    type:      DataTypes.STRING(300),
    allowNull: true,
    comment:   'Motivo o nota del envío (ej: solicitado por docente)',
  },
}, {
  tableName:  'envio',
  timestamps: false,
})

module.exports = Envio
