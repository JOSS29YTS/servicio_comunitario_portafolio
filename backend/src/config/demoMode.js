// ============================================================
// Configuración del modo demostración (portafolio público)
// ============================================================

const isDemoMode = () => process.env.DEMO_MODE === 'true'

const getDemoEmail = () => (process.env.DEMO_EMAIL || 'demo@admin.com').toLowerCase()

module.exports = { isDemoMode, getDemoEmail }
