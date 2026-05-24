// ============================================================
// SERVICIO: Registro de Auditoría (Audit Service)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// ============================================================
const { AuditLog } = require('../models')

/**
 * Registra de forma asíncrona una acción de auditoría en la base de datos.
 * Esta función es segura y no-bloqueante; si falla el registro de auditoría,
 * no interferirá con la transacción o flujo de negocio principal.
 * 
 * @param {Object} req Objeto Request de Express (opcional, para extraer IP y usuario)
 * @param {string} accion Nombre identificador de la acción (Ej: 'LOGIN_EXITOSO', 'ELIMINAR_PROYECTO')
 * @param {string} descripcion Mensaje explicativo y detallado para auditoría
 * @param {Object|string} [detalles] Datos técnicos o payload de depuración adicionales (opcional)
 */
const registrarAccion = async (req, accion, descripcion, detalles = null) => {
  try {
    // 1. Extraer dirección IP de forma segura
    const ip = req 
      ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'SISTEMA') 
      : 'SISTEMA'

    // 2. Extraer información del usuario autenticado si existe en el Request
    const id_usuario = req?.usuario?.id_usuario || null
    const usuario_nombre = req?.usuario?.nombre_completo || req?.usuario?.nombre || null
    const usuario_email = req?.usuario?.email || null

    // 3. Serializar campo detalles si es un objeto
    let detallesFinal = null
    if (detalles) {
      detallesFinal = typeof detalles === 'string' 
        ? detalles 
        : JSON.stringify(detalles, null, 2)
    }

    // 4. Insertar registro en base de datos de manera asíncrona
    await AuditLog.create({
      id_usuario,
      usuario_nombre,
      usuario_email,
      accion,
      descripcion,
      ip_direccion: ip,
      detalles: detallesFinal
    })

    console.log(`[AUDITORÍA] Acción '${accion}' registrada correctamente.`)
  } catch (err) {
    console.error('[AUDITORÍA] ✘ Error crítico al registrar en audit_log:', err.message)
  }
}

module.exports = {
  registrarAccion
}
