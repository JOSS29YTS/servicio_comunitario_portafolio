// ============================================================
// MODELO: ArchivoPdf
// Tabla: archivo_pdf
// Descripción: Archivo PDF asociado a un proyecto
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const ArchivoPdf = sequelize.define('ArchivoPdf', {
  id_archivo: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  id_proyecto: {
    type:       DataTypes.INTEGER,
    allowNull:  false,
    references: { model: 'proyecto', key: 'id_proyecto' },
    comment:    'Proyecto al que pertenece este archivo',
  },
  nombre_archivo: {
    type:      DataTypes.STRING(255),
    allowNull: false,
    comment:   'Nombre original del archivo PDF subido',
  },
  ruta_almacenamiento: {
    type:      DataTypes.STRING(500),
    allowNull: false,
    comment:   'Ruta relativa en el servidor donde se guardó el PDF',
  },
  tamano_bytes: {
    type:      DataTypes.BIGINT,
    allowNull: true,
    comment:   'Tamaño del archivo en bytes',
  },
  subido_en: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment:      'Fecha de subida del archivo',
  },
}, {
  tableName:  'archivo_pdf',
  timestamps: false,
})

module.exports = ArchivoPdf
