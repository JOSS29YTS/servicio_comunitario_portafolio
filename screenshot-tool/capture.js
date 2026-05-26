import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Ruta de destino de las capturas en la raíz
const OUTPUT_DIR = join(process.cwd(), 'portafolio-screenshots');
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Iniciando sesión de capturas con Playwright...');
  
  const browser = await chromium.launch({
    headless: true, // Ejecutar en segundo plano
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5, // Mayor densidad para capturas ultra nítidas
  });

  const page = await context.newPage();
  
  // Función auxiliar para navegar, esperar y capturar
  async function takeScreenshot(url, name, waitSelector = null, actionBeforeScreenshot = null) {
    const fullUrl = `http://localhost:5173${url}`;
    console.log(`📸 Navegando a: ${fullUrl}`);
    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle' });
      
      if (waitSelector) {
        await page.waitForSelector(waitSelector, { timeout: 10000 });
      }
      
      // Esperar a que terminen las transiciones/animaciones y se cargue todo
      await page.waitForTimeout(2000);
      
      if (actionBeforeScreenshot) {
        await actionBeforeScreenshot(page);
      }
      
      const filePath = join(OUTPUT_DIR, name);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`   ✅ Guardado: ${name}`);
    } catch (error) {
      console.error(`   ❌ Error en ${url}: ${error.message}`);
    }
  }

  // 1. Landing Page
  await takeScreenshot('/', '01_landing_page.png', 'nav.home-navbar');

  // 2. Login Page
  await takeScreenshot('/login', '02_login.png', 'form');

  // 3. Registro
  await takeScreenshot('/registro', '03_registro.png', 'form');

  // 4. Recuperar Clave
  await takeScreenshot('/recuperar-clave', '04_recuperar_clave.png', 'form');

  // 5. Restablecer Clave
  await takeScreenshot('/restablecer-clave', '05_restablecer_clave.png', 'form');

  // --- Proceso de Inicio de Sesión ---
  console.log('🔑 Iniciando sesión con el usuario administrador...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForSelector('form');
  
  await page.fill('input[type="email"]', 'demo@admin.com');
  await page.fill('input[type="password"]', 'demo123');
  await page.click('button[type="submit"]');
  
  // Esperar la redirección al dashboard (debería mostrar .app-layout)
  console.log('⏳ Esperando redirección al Dashboard...');
  await page.waitForSelector('.app-layout', { timeout: 15000 });
  await page.waitForTimeout(2000); // Darle tiempo extra a que rendericen las gráficas o datos

  // 6. Dashboard
  const dashboardPath = join(OUTPUT_DIR, '06_dashboard.png');
  await page.screenshot({ path: dashboardPath });
  console.log('   ✅ Guardado: 06_dashboard.png');

  // 7. Proyectos
  await takeScreenshot('/proyectos', '07_proyectos.png', '.app-layout');

  // 8. Nuevo Proyecto
  await takeScreenshot('/nuevo-proyecto', '08_nuevo_proyecto.png', '.app-layout');

  // 9. Buscar
  await takeScreenshot('/buscar', '09_buscar.png', '.app-layout');

  // 10. Notificaciones
  await takeScreenshot('/notificaciones', '10_notificaciones.png', '.app-layout');

  // 11. Usuarios
  await takeScreenshot('/usuarios', '11_usuarios.png', '.app-layout');

  // 12. Configuración
  await takeScreenshot('/configuracion', '12_configuracion.png', '.app-layout');

  console.log('🏁 Sesión de capturas completada con éxito.');
  await browser.close();
}

capture().catch((error) => {
  console.error('💥 Error crítico en el script de captura:', error);
  process.exit(1);
});
