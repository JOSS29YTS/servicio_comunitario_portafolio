// ============================================================
// MIDDLEWARE: Autorización Estricta por Rol (checkRole)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const { Usuario, Rol } = require('../models')

/**
 * Middleware para validar que el usuario autenticado posea un rol permitido.
 * @param {Array<string>} rolesPermitidos - Lista de roles que tienen acceso (ej: ['Director', 'Subdirector'])
 */
module.exports = function checkRole(rolesPermitidos = []) {
  return async (req, res, next) => {
    // 1. Validar que req.usuario esté inyectado (se requiere haber pasado por authMiddleware primero)
    if (!req.usuario || !req.usuario.id_usuario) {
      return res.status(401).json({
        ok:      false,
        mensaje: 'Acceso denegado. Se requiere token de autenticación válido.'
      })
    }

    try {
      // 2. Buscar al usuario y su rol asociado en tiempo real en la base de datos
      const usuario = await Usuario.findByPk(req.usuario.id_usuario, {
        include: [{ model: Rol, as: 'rol', attributes: ['nombre'] }]
      })

      if (!usuario) {
        return res.status(404).json({
          ok:      false,
          mensaje: 'El usuario solicitante no existe en el sistema.'
        })
      }

      // 3. Validar si el rol del usuario coincide con alguno de los permitidos
      const rolUsuario = usuario.rol?.nombre
      if (!rolUsuario || !rolesPermitidos.includes(rolUsuario)) {
        return res.status(403).json({
          ok:      false,
          mensaje: `Acceso denegado. Tu rol actual (${rolUsuario || 'Ninguno'}) no cuenta con privilegios para realizar esta acción. Se requiere rol de: ${rolesPermitidos.join(' o ')}.`
        })
      }

      // 4. Inyectar el rol resuelto en req.usuario para que pueda usarse en el controlador
      req.usuario.rol = rolUsuario
      
      next()
    } catch (error) {
      console.error('[CHECK ROLE MIDDLEWARE] Error al validar rol del usuario:', error)
      return res.status(500).json({
        ok:      false,
        mensaje: 'Error interno en la capa de autorización por roles del servidor.'
      })
    }
  }
}
