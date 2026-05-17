// ============================================================
// MODELO: DestinatarioEnvio
// Tabla: destinatario_envio
// Descripción: Destinatarios individuales asociados a un envío
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const DestinatarioEnvio = sequelize.define('DestinatarioEnvio', {
  id_destinatario: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  id_envio: {
    type:       DataTypes.INTEGER,
    allowNull:  false,
    references: { model: 'envio', key: 'id_envio' },
    comment:    'ID del envío principal',
  },
  email: {
    type:      DataTypes.STRING(200),
    allowNull: false,
    // NOTA: Esta validación es realizada por Sequelize (capa de aplicación JS), no a nivel nativo de MySQL
    validate:  { isEmail: true },
    comment:   'Correo electrónico del destinatario',
  },
  nombre: {
    type:      DataTypes.STRING(150),
    allowNull: true,
    comment:   'Nombre del destinatario',
  },
}, {
  tableName:  'destinatario_envio',
  timestamps: false,
})

module.exports = DestinatarioEnvio
