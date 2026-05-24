// ============================================================
// SERVICIO: Sincronización y Respaldos (Backup Service)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const AdmZip = require('adm-zip')
const { ArchivoPdf } = require('../models')
const { uploadBackupToDrive } = require('./googleDriveService')
const { registrarAccion } = require('../services/auditService')

/**
 * Busca de forma dinámica el binario mysqldump en Windows (WAMP, Program Files, etc.)
 * o retorna el comando global si no se encuentra en las rutas estándar.
 */
function findMysqldumpPath() {
  if (process.env.MYSQLDUMP_PATH && fs.existsSync(process.env.MYSQLDUMP_PATH)) {
    return `"${process.env.MYSQLDUMP_PATH}"`
  }
  
  // 1. Escanear WAMP64
  const wampMysqlDir = 'C:\\wamp64\\bin\\mysql'
  if (fs.existsSync(wampMysqlDir)) {
    try {
      const versions = fs.readdirSync(wampMysqlDir)
      for (const version of versions) {
        const potentialPath = path.join(wampMysqlDir, version, 'bin', 'mysqldump.exe')
        if (fs.existsSync(potentialPath)) {
          return `"${potentialPath}"`
        }
      }
    } catch (err) {
      console.error('[BACKUP SERVICE] Error al escanear directorio WAMP mysql:', err.message)
    }
  }

  // 2. Escanear Archivos de Programa (Program Files)
  const programFilesDir = 'C:\\Program Files\\MySQL'
  if (fs.existsSync(programFilesDir)) {
    try {
      const servers = fs.readdirSync(programFilesDir)
      for (const server of servers) {
        const potentialPath = path.join(programFilesDir, server, 'bin', 'mysqldump.exe')
        if (fs.existsSync(potentialPath)) {
          return `"${potentialPath}"`
        }
      }
    } catch (err) {
      console.error('[BACKUP SERVICE] Error al escanear directorio Program Files mysql:', err.message)
    }
  }

  // 3. Fallback al comando global
  return 'mysqldump'
}

/**
 * Ejecuta el respaldo completo:
 * 1. Genera el archivo SQL dump con mysqldump de forma temporal.
 * 2. Comprime en un .zip el archivo SQL generado y toda la carpeta física de /uploads.
 * 3. Elimina de forma segura el archivo temporal .sql.
 * 4. Envía el archivo .zip a Google Drive mediante googleDriveService.
 * 5. Re-escanea la carpeta de uploads para actualizar los tamaños reales de PDFs en BD.
 * 6. Actualiza el JSON de metadatos del último respaldo.
 * 7. Inyecta los registros de auditoría correspondientes en audit_log.
 * 
 * @param {Object} req Objeto Request de Express (opcional, si es sincronización manual)
 */
async function performBackup(req = null) {
  return new Promise(async (resolve, reject) => {
    try {
      // A. Crear directorio de respaldos si no existe
      const backupsDir = path.join(__dirname, '..', '..', 'backups')
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true })
      }

      // B. Cargar credenciales de la base de datos (.env)
      const dbHost = process.env.DB_HOST || 'localhost'
      const dbPort = process.env.DB_PORT || '3306'
      const dbUser = process.env.DB_USER || 'root'
      const dbPass = process.env.DB_PASSWORD || ''
      const dbName = process.env.DB_NAME || 'repositorio_academico'

      // C. Definir nombres de archivo únicos con timestamps
      const date = new Date()
      const dateStr = date.toISOString().replace(/[-:T]/g, '_').split('.')[0]
      const sqlTempFileName = `temp_backup_${dbName}_${dateStr}.sql`
      const sqlTempPath = path.join(backupsDir, sqlTempFileName)

      // D. Ubicar binario de mysqldump
      const mysqldumpBin = findMysqldumpPath()

      // E. Ensamblar comando
      let command = `${mysqldumpBin} -h ${dbHost} -P ${dbPort} -u ${dbUser}`
      if (dbPass) {
        command += ` -p${dbPass}`
      }
      command += ` ${dbName} > "${sqlTempPath}"`

      console.log(`[BACKUP SERVICE] 1. Generando volcado temporal SQL: ${sqlTempFileName}...`)

      // F. Ejecutar volcado de BD
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error('[BACKUP SERVICE] Error al ejecutar comando mysqldump:', error.message)
          return reject(new Error(`Fallo al ejecutar mysqldump: ${error.message}`))
        }

        // Validar que se haya creado el archivo SQL temporal
        if (!fs.existsSync(sqlTempPath) || fs.statSync(sqlTempPath).size === 0) {
          return reject(new Error('El archivo SQL dump generado está vacío o no pudo crearse.'))
        }

        console.log(`[BACKUP SERVICE] ✔ Volcado SQL creado con éxito (${(fs.statSync(sqlTempPath).size / 1024 / 1024).toFixed(3)} MB).`)

        // G. Re-escanear carpeta de almacenamiento para actualizar tamaños en BD
        let pdfsActualizados = 0
        try {
          const archivos = await ArchivoPdf.findAll()
          for (const archivo of archivos) {
            const absolutePath = path.join(__dirname, '..', '..', archivo.ruta_almacenamiento)
            if (fs.existsSync(absolutePath)) {
              const stats = fs.statSync(absolutePath)
              await archivo.update({ tamano_bytes: stats.size })
              pdfsActualizados++
            }
          }
          console.log(`[BACKUP SERVICE] 2. Re-escaneo completo. ${pdfsActualizados} archivos PDF sincronizados en BD.`)
        } catch (scanErr) {
          console.error('[BACKUP SERVICE] Advertencia en re-escaneo:', scanErr.message)
        }

        // H. COMPRESIÓN DUAL ZIP (SQL + /uploads)
        const zipFileName = `backup_repositorio_academico_${dateStr}.zip`
        const zipOutputPath = path.join(backupsDir, zipFileName)
        
        console.log(`[BACKUP SERVICE] 3. Inicializando compresión ZIP dual en: ${zipFileName}...`)
        
        try {
          const zip = new AdmZip()

          // 1. Agregar el archivo SQL dump temporal
          zip.addLocalFile(sqlTempPath, '', `respaldo_db_${dbName}.sql`)

          // 2. Agregar toda la carpeta /uploads física si existe
          const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
          if (fs.existsSync(uploadsDir)) {
            zip.addLocalFolder(uploadsDir, 'uploads')
            console.log('[BACKUP SERVICE] Carpetas de uploads añadidas correctamente al ZIP.')
          } else {
            console.warn('[BACKUP SERVICE] Advertencia: La carpeta uploads/ no existe en el servidor. El ZIP solo contendrá el SQL.')
          }

          // 3. Escribir archivo Zip consolidado
          zip.writeZip(zipOutputPath)
          console.log(`[BACKUP SERVICE] ✔ Compresión finalizada con éxito. Archivo: ${zipFileName}`)

          // 4. Eliminar el archivo SQL temporal
          fs.unlinkSync(sqlTempPath)
          console.log('[BACKUP SERVICE] Archivo temporal SQL depurado de forma segura.')

        } catch (zipErr) {
          console.error('[BACKUP SERVICE] ❌ Error en compresión ZIP:', zipErr.message)
          return reject(new Error(`Fallo en el proceso de compresión ZIP: ${zipErr.message}`))
        }

        // Obtener tamaño final del ZIP generado
        const zipStats = fs.statSync(zipOutputPath)
        const zipSizeMB = (zipStats.size / 1024 / 1024).toFixed(3)

        // Registrar auditoría de la compresión local completada
        const auditAccion = req ? 'RESPALDO_COMPLETADO' : 'RESPALDO_COMPLETADO_AUTO'
        const auditDesc = req 
          ? `Se completó la compresión dual manual (Base de Datos SQL + carpeta /uploads). Archivo: ${zipFileName}`
          : `Se completó la compresión dual programada automática (Base de Datos SQL + carpeta /uploads). Archivo: ${zipFileName}`
        
        await registrarAccion(req, auditAccion, auditDesc, {
          archivo_zip: zipFileName,
          tamano_zip_bytes: zipStats.size,
          tamano_zip_mb: zipSizeMB,
          pdfs_actualizados: pdfsActualizados
        })

        // I. SINCRONIZACIÓN CLOUD (GOOGLE DRIVE API)
        console.log('[BACKUP SERVICE] 4. Iniciando sincronización en la nube con Google Drive API...')
        let driveResult = null
        try {
          driveResult = await uploadBackupToDrive(zipOutputPath, zipFileName)
          
          // Registrar auditoría del Cloud Sync
          await registrarAccion(req, 'RESPALDO_CLOUD', `Sincronización de respaldo con Google Drive exitosa. ID: ${driveResult.fileId}`, {
            archivo_zip: zipFileName,
            drive_file_id: driveResult.fileId,
            drive_link: driveResult.webViewLink,
            simulado: driveResult.simulado,
            tamano_zip_mb: zipSizeMB
          })

        } catch (driveErr) {
          console.error('[BACKUP SERVICE] ❌ Fallo en sincronización de Google Drive:', driveErr.message)
          
          // Registrar auditoría del fallo en la nube, pero el respaldo local fue exitoso
          await registrarAccion(req, 'RESPALDO_CLOUD_ERROR', `Fallo al sincronizar el respaldo local en la nube de Google Drive. Detalle: ${driveErr.message}`, {
            archivo_zip: zipFileName,
            error: driveErr.message
          })

          driveResult = {
            ok: false,
            simulado: false,
            error: driveErr.message,
            mensaje: 'La sincronización en la nube falló, pero el respaldo local se guardó con éxito.'
          }
        }

        // J. Actualizar archivo de metadatos de último respaldo
        const lastBackupPath = path.join(backupsDir, 'last_backup.json')
        const backupInfo = {
          ultima_fecha: new Date().toISOString(),
          nombre_archivo: zipFileName,
          tamano_bytes: zipStats.size,
          pdfs_actualizados: pdfsActualizados,
          estado: driveResult.ok ? 'Exitoso' : 'Exitoso (Sin Nube)',
          sincronizacion_nube: {
            completada: driveResult.ok,
            simulada: driveResult.simulado || false,
            id_archivo_drive: driveResult.fileId || null,
            enlace_drive: driveResult.webViewLink || null,
            error: driveResult.error || null
          }
        }
        fs.writeFileSync(lastBackupPath, JSON.stringify(backupInfo, null, 2))

        console.log(`[BACKUP SERVICE] ✔ Respaldo y sincronización finalizada. Archivo: ${zipFileName}`)
        resolve(backupInfo)
      })
    } catch (err) {
      console.error('[BACKUP SERVICE] Error general durante el proceso de respaldo:', err.message)
      reject(err)
    }
  })
}

/**
 * Obtiene los metadatos del último respaldo exitoso registrado.
 */
function getLastBackupInfo() {
  const backupsDir = path.join(__dirname, '..', '..', 'backups')
  const lastBackupPath = path.join(backupsDir, 'last_backup.json')
  
  if (fs.existsSync(lastBackupPath)) {
    try {
      const data = fs.readFileSync(lastBackupPath, 'utf8')
      return JSON.parse(data)
    } catch (e) {
      console.error('[BACKUP SERVICE] Error al leer last_backup.json:', e.message)
      return null
    }
  }
  return null
}

module.exports = {
  performBackup,
  getLastBackupInfo
}
