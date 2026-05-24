// ============================================================
// PLANIFICADOR: Tarea Programada de Respaldos (Backup Scheduler)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const cron = require('node-cron')
const { performBackup } = require('../utils/backupService')

// Configurar la tarea diaria: Corre todos los días a las 4:00 PM (16:00)
// Cron expression: "0 16 * * *" (Minuto 0, Hora 16, Cada Día, Cada Mes, Cada Día de la Semana)
const CRON_SCHEDULE = process.env.BACKUP_CRON_SCHEDULE || '0 16 * * *'

console.log(`[BACKUP SCHEDULER] Iniciando planificador de respaldos diarios...`)

cron.schedule(CRON_SCHEDULE, async () => {
  console.log(`[BACKUP SCHEDULER] ⏰ Ejecutando tarea programada automática de respaldo (4:00 PM)...`)
  try {
    const backupInfo = await performBackup()
    console.log(`[BACKUP SCHEDULER] ✔ Respaldo automático diario completado: ${backupInfo.nombre_archivo}`)
  } catch (error) {
    console.error(`[BACKUP SCHEDULER] ❌ Error en el respaldo automático diario:`, error.message)
  }
})

console.log(`[BACKUP SCHEDULER] ✔ Respaldo diario programado con éxito. Horario: ${CRON_SCHEDULE}`)
