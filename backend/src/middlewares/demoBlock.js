// ============================================================
// Middleware: bloquea operaciones de escritura para usuario demo
// ============================================================
const { isDemoMode, getDemoEmail } = require('../config/demoMode')

const MENSAJE_BLOQUEO =
  'Acción no disponible en el modo demostración del portafolio.'

function blockIfDemo(req, res, next) {
  if (!isDemoMode()) return next()

  if (req.usuario?.email?.toLowerCase() === getDemoEmail()) {
    return res.status(403).json({ ok: false, mensaje: MENSAJE_BLOQUEO })
  }
  next()
}

module.exports = blockIfDemo
