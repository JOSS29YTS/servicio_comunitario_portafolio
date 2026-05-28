// ============================================================
// MODELOS — Índice central + Asociaciones
// Registra todos los modelos y define las relaciones entre tablas
// ============================================================
const Rol               = require('./Rol')
const Estado            = require('./Estado')
const Usuario           = require('./Usuario')
const Categoria         = require('./Categoria')
const Promocion         = require('./Promocion')
const Proyecto          = require('./Proyecto')
const Estudiante        = require('./Estudiante')
const ProyectoEstudiante = require('./ProyectoEstudiante')
const Tutor             = require('./Tutor')
const ProyectoTutor     = require('./ProyectoTutor')
const ArchivoPdf        = require('./ArchivoPdf')
const Envio             = require('./Envio')
const DestinatarioEnvio = require('./DestinatarioEnvio')
const AuditLog          = require('./AuditLog')

// ── ASOCIACIONES ──────────────────────────────────────────
//
//  Rol       1 ─────── N  Usuario            (tiene)
//  Promocion 1 ─────── N  Proyecto
//  Categoria 1 ─────── N  Proyecto
//  Usuario   1 ─────── N  Proyecto           (registrado_por)
//  Usuario   1 ─────── N  Envio              (realiza)
//  Proyecto  1 ─────── N  ArchivoPdf
//  Proyecto  1 ─────── N  Envio
//  Envio     1 ─────── N  DestinatarioEnvio  (tiene)
//  Proyecto  N ─────── M  Estudiante         (via ProyectoEstudiante)

// Rol → Usuario (1:N)
Rol.hasMany(Usuario, { foreignKey: 'id_rol', as: 'usuarios' })
Usuario.belongsTo(Rol, { foreignKey: 'id_rol', as: 'rol' })

// Estado → Usuario (1:N)
Estado.hasMany(Usuario, { foreignKey: 'id_estado', as: 'usuarios' })
Usuario.belongsTo(Estado, { foreignKey: 'id_estado', as: 'estado' })

// Promocion → Proyecto
Promocion.hasMany(Proyecto, { foreignKey: 'id_promocion', as: 'proyectos' })
Proyecto.belongsTo(Promocion, { foreignKey: 'id_promocion', as: 'promocion' })

// Categoria → Proyecto
Categoria.hasMany(Proyecto, { foreignKey: 'id_categoria', as: 'proyectos' })
Proyecto.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' })

// Usuario → Proyecto (quien registró)
Usuario.hasMany(Proyecto, { foreignKey: 'registrado_por', as: 'proyectos_registrados' })
Proyecto.belongsTo(Usuario, { foreignKey: 'registrado_por', as: 'registrado_por_usuario' })

// Proyecto → ArchivoPdf (1:N — puede tener múltiples versiones del PDF)
Proyecto.hasMany(ArchivoPdf, { foreignKey: 'id_proyecto', as: 'archivos' })
ArchivoPdf.belongsTo(Proyecto, { foreignKey: 'id_proyecto', as: 'proyecto' })

// Proyecto → Envio
Proyecto.hasMany(Envio, { foreignKey: 'id_proyecto', as: 'envios' })
Envio.belongsTo(Proyecto, { foreignKey: 'id_proyecto', as: 'proyecto' })

// Usuario → Envio (quien realizó el envío)
Usuario.hasMany(Envio, { foreignKey: 'id_usuario', as: 'envios_realizados' })
Envio.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' })

// Envio → DestinatarioEnvio (1:N — un envío puede tener múltiples destinatarios)
Envio.hasMany(DestinatarioEnvio, { foreignKey: 'id_envio', as: 'destinatarios' })
DestinatarioEnvio.belongsTo(Envio, { foreignKey: 'id_envio', as: 'envio' })

// Usuario → AuditLog (1:N — un usuario puede generar múltiples registros de auditoría)
Usuario.hasMany(AuditLog, { foreignKey: 'id_usuario', as: 'logs_auditoria' })
AuditLog.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario_detalles' })

// Proyecto <──> Estudiante  (N:M via tabla pivote)
Proyecto.belongsToMany(Estudiante, {
  through:    ProyectoEstudiante,
  foreignKey: 'id_proyecto',
  otherKey:   'id_estudiante',
  as:         'estudiantes',
})
Estudiante.belongsToMany(Proyecto, {
  through:    ProyectoEstudiante,
  foreignKey: 'id_estudiante',
  otherKey:   'id_proyecto',
  as:         'proyectos',
})

// Proyecto <──> Tutor (N:M via tabla pivote)
Proyecto.belongsToMany(Tutor, {
  through:    ProyectoTutor,
  foreignKey: 'id_proyecto',
  otherKey:   'id_tutor',
  as:         'tutores',
  onDelete:   'CASCADE',
  onUpdate:   'CASCADE',
})
Tutor.belongsToMany(Proyecto, {
  through:    ProyectoTutor,
  foreignKey: 'id_tutor',
  otherKey:   'id_proyecto',
  as:         'proyectos',
  onDelete:   'CASCADE',
  onUpdate:   'CASCADE',
})

// ── EXPORTAR ──────────────────────────────────────────────
module.exports = {
  Rol,
  Estado,
  Usuario,
  Categoria,
  Promocion,
  Proyecto,
  Estudiante,
  ProyectoEstudiante,
  Tutor,
  ProyectoTutor,
  ArchivoPdf,
  Envio,
  DestinatarioEnvio,
  AuditLog,
}
