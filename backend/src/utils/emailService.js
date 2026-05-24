// ============================================================
// SERVICIO: Envío de Correos y Boletines (Email Service)
// Repositorio Académico | Colegio Nuestra Señora de Fátima
// Desarrollado por: Alejandro Villa — Servicio Comunitario USM
// ============================================================
const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

/**
 * Crea el transportador de nodemailer usando variables de entorno (.env).
 * Si no hay credenciales configuradas, retorna null para indicar modo simulación.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.log('[EMAIL SERVICE] ℹ Sin configuración SMTP. Los correos se simularán y guardarán en logs locales.')
    return null
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: port === '465', // true para 465, false para otros puertos
    auth: { user, pass }
  })
}

/**
 * Genera la plantilla HTML premium para el correo electrónico.
 */
function getEmailTemplate(proyecto, motivo, nombreDestinatario) {
  const titulo = proyecto.titulo
  const descripcion = proyecto.descripcion_breve || 'Sin descripción detallada disponible.'
  const tema = proyecto.tema || 'General'
  const categoria = proyecto.categoria?.nombre || 'General'
  const anio = proyecto.promocion?.anio || 'N/A'

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f3f4f6;
        color: #1f2937;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        border: 1px solid #e5e7eb;
      }
      .header {
        background: linear-gradient(135deg, #1e1b4b, #312e81);
        padding: 40px 30px;
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .header p {
        margin: 8px 0 0;
        font-size: 14px;
        color: #c7d2fe;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .content {
        padding: 40px 30px;
      }
      .greeting {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 20px;
        color: #111827;
      }
      .intro-text {
        font-size: 14.5px;
        line-height: 1.6;
        color: #4b5563;
        margin-bottom: 30px;
      }
      .project-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 30px;
      }
      .project-title {
        font-size: 18px;
        font-weight: 700;
        color: #1e1b4b;
        margin: 0 0 12px;
        line-height: 1.4;
      }
      .project-desc {
        font-size: 13.5px;
        line-height: 1.5;
        color: #64748b;
        margin: 0 0 20px;
      }
      .project-meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        border-top: 1px solid #e2e8f0;
        padding-top: 16px;
      }
      .meta-item {
        font-size: 12.5px;
      }
      .meta-label {
        color: #94a3b8;
        text-transform: uppercase;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.05em;
        margin-bottom: 2px;
      }
      .meta-value {
        color: #334155;
        font-weight: 600;
      }
      .footer {
        background-color: #f9fafb;
        padding: 24px 30px;
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
        border-top: 1px solid #f3f4f6;
      }
      .footer p {
        margin: 4px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Colegio Nuestra Señora de Fátima</h1>
        <p>Repositorio Académico Oficial</p>
      </div>
      <div class="content">
        <div class="greeting">Estimado(a) ${nombreDestinatario || 'Usuario'},</div>
        <p class="intro-text">
          Esperamos que se encuentre muy bien. Nos complace compartir con usted el boletín informativo 
          y el proyecto de investigación adjunto correspondiente al repositorio del colegio.
          ${motivo ? `<br><br><strong>Nota de envío:</strong> ${motivo}` : ''}
        </p>
        <div class="project-card">
          <h2 class="project-title">${titulo}</h2>
          <p class="project-desc">${descripcion}</p>
          <div class="project-meta-grid">
            <div class="meta-item">
              <div class="meta-label">Tema</div>
              <div class="meta-value">${tema}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Categoría</div>
              <div class="meta-value">${categoria}</div>
            </div>
            <div class="meta-item" style="grid-column: span 2; margin-top: 6px;">
              <div class="meta-label">Año de Promoción</div>
              <div class="meta-value">${anio}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Colegio Nuestra Señora de Fátima. Todos los derechos reservados.</p>
        <p>Este es un envío automático institucional del Repositorio Académico.</p>
      </div>
    </div>
  </body>
  </html>
  `
}

/**
 * Envía el correo electrónico con el PDF adjunto.
 * @param {Object} proyecto - Objeto del proyecto con relaciones Categoria, Promocion y ArchivoPdf
 * @param {Array<Object>} destinatarios - Destinatarios con nombre y email
 * @param {string} motivo - Motivo opcional
 */
async function sendProjectEmail(proyecto, destinatarios = [], motivo = '') {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM || '"Repositorio Colegio NSF" <no-reply@colegionsf.edu.ve>'
  const subject = `Compartido: Proyecto - ${proyecto.titulo.substring(0, 50)}...`

  // Obtener ruta del archivo PDF adjunto
  const archivo = proyecto.archivos?.[0]
  let attachments = []
  if (archivo) {
    const absolutePath = path.join(__dirname, '..', '..', archivo.ruta_almacenamiento)
    if (fs.existsSync(absolutePath)) {
      attachments.push({
        filename: archivo.nombre_archivo,
        path: absolutePath
      })
    } else {
      console.warn(`[EMAIL SERVICE] Archivo físico no encontrado en: ${absolutePath}`)
    }
  }

  const resultados = []

  for (const destinatario of destinatarios) {
    const html = getEmailTemplate(proyecto, motivo, destinatario.nombre)
    
    if (transporter) {
      // Envío real por SMTP
      try {
        const info = await transporter.sendMail({
          from,
          to: destinatario.email,
          subject,
          html,
          attachments
        })
        console.log(`[EMAIL SERVICE] Correo real enviado con éxito a ${destinatario.email}:`, info.messageId)
        resultados.push({ email: destinatario.email, enviado: true, real: true })
      } catch (err) {
        console.error(`[EMAIL SERVICE] Error al enviar a ${destinatario.email}:`, err.message)
        resultados.push({ email: destinatario.email, enviado: false, error: err.message })
      }
    } else {
      // Simulación en Consola
      console.log(`\n--- [EMAIL SIMULATION] ---`)
      console.log(`De: ${from}`)
      console.log(`Para: ${destinatario.nombre || 'N/A'} <${destinatario.email}>`)
      console.log(`Asunto: ${subject}`)
      console.log(`Archivo Adjunto: ${archivo ? archivo.nombre_archivo : 'Ninguno'}`)
      console.log(`Nota: ${motivo || 'Ninguna'}`)
      console.log(`--------------------------\n`)
      resultados.push({ email: destinatario.email, enviado: true, real: false })
    }
  }

  return resultados
}

/**
 * Genera la plantilla HTML premium para la recuperación de contraseña.
 */
function getRecoveryTemplate(nombre, resetLink) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f3f4f6;
        color: #1f2937;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }
      .container {
        max-width: 540px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        border: 1px solid #e5e7eb;
      }
      .header {
        background: linear-gradient(135deg, #1e1b4b, #312e81);
        padding: 30px 20px;
        text-align: center;
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        letter-spacing: -0.01em;
      }
      .header p {
        margin: 4px 0 0;
        font-size: 12px;
        color: #c7d2fe;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .content {
        padding: 35px 30px;
      }
      .greeting {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #111827;
      }
      .instruction {
        font-size: 14.5px;
        line-height: 1.6;
        color: #4b5563;
        margin-bottom: 24px;
      }
      .btn-container {
        text-align: center;
        margin: 30px 0;
      }
      .btn-action {
        display: inline-block;
        background: linear-gradient(135deg, #4f46e5, #4338ca);
        color: #ffffff !important;
        text-decoration: none;
        padding: 14px 28px;
        font-size: 14px;
        font-weight: 700;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
        transition: all 0.2s ease;
      }
      .note {
        font-size: 12.5px;
        color: #6b7280;
        background-color: #f9fafb;
        border-left: 3px solid #e5e7eb;
        padding: 12px 16px;
        margin-bottom: 24px;
        border-radius: 0 8px 8px 0;
      }
      .link-raw {
        font-size: 12px;
        color: #9ca3af;
        word-break: break-all;
        margin-top: 16px;
      }
      .footer {
        background-color: #f9fafb;
        padding: 20px 30px;
        text-align: center;
        font-size: 11.5px;
        color: #9ca3af;
        border-top: 1px solid #f3f4f6;
      }
      .footer p {
        margin: 4px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Colegio Nuestra Señora de Fátima</h1>
        <p>Restablecimiento de Contraseña</p>
      </div>
      <div class="content">
        <div class="greeting">Hola, ${nombre || 'Usuario'}</div>
        <p class="instruction">
          Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de acceso al Repositorio Académico. 
          Haz clic en el siguiente botón para continuar el proceso seguro:
        </p>
        <div class="btn-container">
          <a href="${resetLink}" target="_blank" class="btn-action">Restablecer Contraseña</a>
        </div>
        <div class="note">
          <strong>Importante:</strong> Este enlace tiene una validez exclusiva de <strong>1 hora</strong> por seguridad. 
          Si tú no has solicitado este cambio, puedes ignorar este correo de forma segura y tu clave se mantendrá sin alteraciones.
        </div>
        <p class="link-raw">
          Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
          <a href="${resetLink}" style="color: #4f46e5; text-decoration: underline;">${resetLink}</a>
        </p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Colegio Nuestra Señora de Fátima. Todos los derechos reservados.</p>
        <p>Este es un correo institucional para la seguridad de tu cuenta.</p>
      </div>
    </div>
  </body>
  </html>
  `
}

/**
 * Envía el correo de recuperación de contraseña con Nodemailer
 * @param {string} email Correo del destinatario
 * @param {string} nombre Nombre completo
 * @param {string} token Token único generado
 */
async function sendRecoveryEmail(email, nombre, token) {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM || '"Seguridad Colegio NSF" <no-reply@colegionsf.edu.ve>'
  const subject = 'Recuperación de Contraseña — Repositorio Académico'
  
  // URL de restablecimiento apuntando al frontend (Vite)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const resetLink = `${frontendUrl}/restablecer-clave?token=${token}&email=${encodeURIComponent(email)}`
  
  const html = getRecoveryTemplate(nombre, resetLink)

  if (transporter) {
    // Envío real SMTP
    try {
      const info = await transporter.sendMail({
        from,
        to: email,
        subject,
        html
      })
      console.log(`[EMAIL SERVICE] Correo de recuperación enviado a ${email}:`, info.messageId)
      return { enviado: true, real: true, messageId: info.messageId }
    } catch (err) {
      console.error(`[EMAIL SERVICE] Error al enviar correo de recuperación a ${email}:`, err.message)
      throw err
    }
  } else {
    // Simulación en logs locales
    console.log(`\n======================================================`)
    console.log(`🔑 [EMAIL SIMULATION — RECUPERACIÓN DE CLAVE] 🔑`)
    console.log(`De: ${from}`)
    console.log(`Para: ${nombre} <${email}>`)
    console.log(`Asunto: ${subject}`)
    console.log(`Enlace de Restablecimiento: ${resetLink}`)
    console.log(`======================================================\n`)
    return { enviado: true, real: false }
  }
}

module.exports = {
  sendProjectEmail,
  sendRecoveryEmail
}
