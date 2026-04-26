// ============================================================
// MODELO: Proyecto
// Tabla: proyecto
// Descripción: Proyecto central del repositorio académico
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const Proyecto = sequelize.define('Proyecto', {
  id_proyecto: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  titulo: {
    type:      DataTypes.STRING(300),
    allowNull: false,
    comment:   'Título completo del proyecto de investigación',
  },
  descripcion_breve: {
    type:      DataTypes.TEXT,
    allowNull: true,
    comment:   'Resumen breve del proyecto',
  },
  tema: {
    type:      DataTypes.STRING(200),
    allowNull: true,
    comment:   'Tema específico del proyecto',
  },
  // FK: promocion
  id_promocion: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'promocion', key: 'id_promocion' },
    comment:   'Año de promoción al que pertenece el proyecto',
  },
  // FK: categoria
  id_categoria: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'categoria', key: 'id_categoria' },
    comment:   'Categoría temática del proyecto',
  },
  // FK: usuario (quien lo registró)
  registrado_por: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuario', key: 'id_usuario' },
    comment:   'Usuario (directora) que registró el proyecto',
  },
  creado_en: {
    type:         DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment:      'Fecha de registro del proyecto en el sistema',
  },
}, {
  tableName:  'proyecto',
  timestamps: false,
})

module.exports = Proyecto
