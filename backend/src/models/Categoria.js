// ============================================================
// MODELO: Categoria
// Tabla: categoria
// Descripción: Categorías temáticas de los proyectos
// ============================================================
const { DataTypes } = require('sequelize')
const { sequelize }  = require('../config/database')

const Categoria = sequelize.define('Categoria', {
  id_categoria: {
    type:          DataTypes.INTEGER,
    primaryKey:    true,
    autoIncrement: true,
  },
  nombre: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    unique:    true,
    comment:   'Nombre de la categoría (ej: Tecnología, Salud)',
  },
  descripcion: {
    type:      DataTypes.STRING(255),
    allowNull: true,
    comment:   'Descripción breve de la categoría',
  },
}, {
  tableName:  'categoria',
  timestamps: false,
})

module.exports = Categoria
