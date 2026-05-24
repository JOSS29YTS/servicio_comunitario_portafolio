// ============================================================
// SERVICIO: Sincronización en la Nube con Google Drive API
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const fs = require('fs')
const path = require('path')

// Intentar requerir googleapis, si no está listo aún por la instalación paralela,
// manejaremos un require tardío en la llamada para evitar fallos de importación.
let googleSdk = null;
try {
  googleSdk = require('googleapis')
} catch (e) {
  // Se cargará dinámicamente si es posible o se mantendrá como null
}

/**
 * Verifica si el entorno está configurado para operar en Modo Simulación.
 * Retorna true si detecta variables vacías o con valores de prueba (placeholder/dummy).
 */
function isSimulationMode() {
  const apiKeyTemp = process.env.GDRIVE_API_KEY_TEMP
  const clientId = process.env.GDRIVE_CLIENT_ID
  const clientSecret = process.env.GDRIVE_CLIENT_SECRET
  const refreshToken = process.env.GDRIVE_REFRESH_TOKEN

  // Si está presente el bypass de la API key de simulación
  if (apiKeyTemp && apiKeyTemp.includes('placeholder')) {
    return true
  }

  // Si faltan las credenciales reales de OAuth2
  if (!clientId || clientId.includes('dummy') || clientId.includes('tu_gdrive') ||
      !clientSecret || clientSecret.includes('dummy') || clientSecret.includes('tu_gdrive') ||
      !refreshToken || refreshToken.includes('dummy') || refreshToken.includes('tu_gdrive')) {
    return true
  }

  return false
}

/**
 * Sube un archivo de respaldo (.zip) a la raíz de Google Drive (o a una carpeta parametrizada).
 * 
 * @param {string} filePath Ruta absoluta local al archivo .zip
 * @param {string} fileName Nombre del archivo a crear en Google Drive
 * @returns {Promise<Object>} Metadatos de la subida (simulada o real)
 */
async function uploadBackupToDrive(filePath, fileName) {
  try {
    // Validar existencia del archivo local
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo de respaldo no existe en la ruta local: ${filePath}`)
    }

    const stats = fs.statSync(filePath)
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(3)
    const folderId = process.env.GDRIVE_FOLDER_ID || null

    // 1. EVALUAR MODO SIMULACIÓN
    if (isSimulationMode()) {
      const simulatedFileId = `gdrive_sim_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
      const simulatedLink = `https://drive.google.com/file/d/${simulatedFileId}/view?usp=drivesdk`

      // Hermoso banner en consola con colores ANSI
      console.log('\n\x1b[36m%s\x1b[0m', '┌────────────────────────────────────────────────────────┐')
      console.log('\x1b[36m%s\x1b[0m', '│            ☁  SINOPSIS DE SINCRONIZACIÓN EN LA NUBE     │')
      console.log('\x1b[36m%s\x1b[0m', '│        [MODO SIMULACIÓN — GOOGLE DRIVE API NATIVA]     │')
      console.log('\x1b[36m%s\x1b[0m', '├────────────────────────────────────────────────────────┤')
      console.log(`│  Archivo:      ${fileName.padEnd(40)}│`)
      console.log(`│  Tamaño Zip:   ${(fileSizeMB + ' MB').padEnd(40)}│`)
      console.log(`│  ID en Drive:  ${simulatedFileId.padEnd(40)}│`)
      console.log(`│  Carpeta Dest: ${(folderId ? folderId : 'Raíz (My Drive)').padEnd(40)}│`)
      console.log(`│  Estado:       \x1b[32m✔ Simulación exitosa con API Key temporal\x1b[36m      │`)
      console.log('\x1b[36m%s\x1b[0m', '└────────────────────────────────────────────────────────┘\n')

      return {
        ok: true,
        simulado: true,
        fileId: simulatedFileId,
        webViewLink: simulatedLink,
        tamano_bytes: stats.size,
        mensaje: 'Sincronización simulada exitosamente con Google Drive.'
      }
    }

    // 2. SUBIDA NATIVA REAL (GOOGLE DRIVE API)
    // Cargar SDK si no se hizo al inicio
    if (!googleSdk) {
      googleSdk = require('googleapis')
    }
    const { google } = googleSdk

    const clientId = process.env.GDRIVE_CLIENT_ID
    const clientSecret = process.env.GDRIVE_CLIENT_SECRET
    const refreshToken = process.env.GDRIVE_REFRESH_TOKEN

    console.log(`[DRIVE SERVICE] Iniciando conexión real con Google Drive API para subir: ${fileName}...`)

    // Configurar cliente de autorización OAuth2
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // Estructurar metadatos del archivo en Google Drive
    const fileMetadata = {
      name: fileName,
      mimeType: 'application/zip'
    }

    // Si se especificó una carpeta de destino en Google Drive
    if (folderId) {
      fileMetadata.parents = [folderId]
    }

    // Crear el flujo de medios (ReadStream)
    const media = {
      mimeType: 'application/zip',
      body: fs.createReadStream(filePath)
    }

    // Subir el archivo mediante multipart
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, size'
    })

    console.log(`[DRIVE SERVICE] ✔ Archivo subido con éxito. ID: ${response.data.id}`)

    return {
      ok: true,
      simulado: false,
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
      tamano_bytes: parseInt(response.data.size || stats.size),
      mensaje: 'Respaldo sincronizado nativamente con Google Drive.'
    }

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `[DRIVE SERVICE] ❌ Error en sincronización con Google Drive: ${error.message}`)
    throw error
  }
}

module.exports = {
  uploadBackupToDrive,
  isSimulationMode
}
