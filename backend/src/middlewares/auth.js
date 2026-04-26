// ============================================================
// MIDDLEWARE: Verificación de JWT
// Protege las rutas que requieren autenticación
// ============================================================
const jwt = require('jsonwebtoken')

module.exports = function authMiddleware(req, res, next) {
  // El token viene en el header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization']
  const token      = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      ok:      false,
      mensaje: 'Acceso denegado. No se proporcionó un token de autenticación.',
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario   = decoded   // { id_usuario, email, nombre_completo }
    next()
  } catch (err) {
    return res.status(403).json({
      ok:      false,
      mensaje: 'Token inválido o expirado. Vuelve a iniciar sesión.',
    })
  }
}
