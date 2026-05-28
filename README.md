# 🎓 Repositorio Académico — Colegio Nuestra Señora de Fátima

[![React](https://img.shields.io/badge/React-19.2-blue?logo=react&logoColor=white)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-purple?logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

¡Bienvenido al **Repositorio Académico del Colegio Nuestra Señora de Fátima**! Este es un sistema digital premium de gestión académica, preservación de proyectos de investigación científica y automatización escolar desarrollado para digitalizar, organizar y analizar los trabajos de grado de los estudiantes de 5to año de bachillerato. 

El sistema está estructurado con una arquitectura moderna de **Single Page Application (SPA)** en el Frontend (React 19) y un servidor **RESTful API** robusto en el Backend (Node.js) con almacenamiento relacional (MySQL).

---

## 🔑 Cuenta de Demostración Pública (Portafolio)

Al ejecutar el script de inicialización (`pnpm run db:seed`), el sistema creará un perfil de demostración diseñado para exhibir de forma segura el portafolio a reclutadores, docentes visitantes o cualquier persona interesada:

* **Email**: `demo@admin.com`
* **Acceso**: Un clic con el botón **Probar demo** (no requiere contraseña)
* **Privilegios**: Rol de solo lectura — puede visualizar proyectos, dashboard, usuarios y configuración, pero no puede crear, editar ni eliminar datos.

### Modo demostración (despliegue en portafolio)

Para el entorno público del portafolio, activa el modo demo en **ambos** servicios:

**Backend** (`backend/.env`):

```env
DEMO_MODE=true
DEMO_EMAIL=demo@admin.com
```

**Frontend** (`frontend/.env`):

```env
VITE_DEMO_MODE=true
```

Con esto el sistema:

- Muestra el botón **Probar demo** en el login (acceso sin escribir contraseña).
- Agrega un badge **Demo** persistente en el header de todas las páginas.
- Solo permite iniciar sesión con `demo@admin.com` (no con `director@admin.com` ni otras cuentas).
- Bloquea registro, recuperación y cambio de contraseña (en API y en la interfaz).
- Oculta el enlace **Cambiar Contraseña** en Configuración.

En **desarrollo local**, deja `DEMO_MODE=false` y `VITE_DEMO_MODE=false` para probar registro, recuperación de clave y la cuenta de Director.

**Seguridad en producción:** usa `DIRECTOR_EMAIL` y `DIRECTOR_PASSWORD` fuertes y privados (nunca los valores por defecto del seed). No publiques credenciales del Director en el README ni en la UI del portafolio.

---

## 🚀 Características Clave

### 👤 Control de Acceso, Privilegios y Gestión de Roles (RBAC)
* **Autenticación Robusta**: Inicio de sesión seguro mediante tokens Web JSON (JWT) con expiración automática de sesión.
* **Roles Granulares (RBAC)**: Flujos diferenciados y permisos estrictos para **Directores**, **Subdirectores** y **Profesores**.
* **Protección de Privilegios de Seguridad**: El sistema restringe al rol de **Subdirector** para que únicamente pueda realizar modificaciones a usuarios con rol **Profesor**, inhabilitando visual y lógicamente cualquier acción administrativa sobre Directores u otros Subdirectores.
* **Flujo de Aprobación**: Los nuevos registros de docentes entran en estado *Pendiente* y requieren la validación física de un Director para acceder al panel.
* **Bitácora del Sistema en Tiempo Real (Audit Logs Seguros)**: Registro inmutable de acciones críticas (inicios de sesión fallidos, creación/edición/borrado de proyectos, cambios de roles) consultable dinámicamente cada 30 segundos en la cabecera. Por **seguridad y privacidad de red**, se excluyen estrictamente las direcciones IP del API y de la interfaz de usuario.

### 🎓 Gestión Relacional de Tutores Académicos ($N:M$ — $3\text{NF}$)
* **Normalización en Base de Datos**: Esquema relacional estructurado bajo la Tercera Forma Normal ($3\text{NF}$) separando a los docentes en un modelo independiente `Tutor` y vinculándolos con `Proyecto` mediante una tabla pivot (`proyecto_tutor`).
* **Formulario Dinámico Multicasilla**: Permite asociar dinámicamente múltiples tutores académicos a un mismo proyecto de investigación escolar al vuelo, con validaciones en tiempo real e hidratación inteligente en edición.
* **Insignias y Búsqueda Cruzada**: El detalle de proyectos despliega insignias dedicadas de asesores académicos con el icono premium `GraduationCap` y permite indexaciones de búsqueda inmediata por coincidencia.

### 🎨 Estética e Interfaz de Usuario de Alta Fidelidad (UX/UI Premium)
* **Doble Identidad Flotante**: El Hero del Home Page incorpora el logo del colegio y el avatar premium de la Virgen de Fátima lado a lado en un grupo flotante animado de manera asincrónica, con salvaguarda cromática en modo oscuro (`.no-invert`).
* **Modales de Confirmación Custom Premium**: Reemplazo de las primitivas alertas nativas `window.confirm` por un componente de modal elástico interactivo (`modalEnter`) con efecto de desenfoque de fondo (*backdrop-filter: blur*), variables de tema claro/oscuro y paletas de colores asociadas a la severidad de la acción (destructivo rojo para eliminar perfil, e índigo para sincronización).

### 🧠 Automatización con Inteligencia Artificial (Google Gemini 2.0)
* **Parser de PDFs integrado**: Al subir el archivo PDF del proyecto de investigación, el backend utiliza el SDK oficial de **Google Gemini 2.0 Flash** para analizar, extraer y estructurar automáticamente:
  1. Título y coautores.
  2. Problema planteado.
  3. Objetivo general.
  4. Metodología aplicada.
  5. Resultados o hallazgos principales.
  6. Conclusiones.
  7. Palabras clave (tags de indexación rápida).
* **Base de datos inteligente (Caché DB)**: Los resúmenes extraídos se guardan directamente en MySQL (`resumen_ia`), optimizando los costos de la API y garantizando búsquedas rápidas inmediatas.

#### 🛡️ Robustez e Integridad del Flujo de Indexación
Para asegurar que el procesamiento de documentos sea tolerante a fallos y altamente seguro, la arquitectura implementa los siguientes mecanismos de defensa:
1. **Esquema JSON Estricto y Resiliencia (Structured Outputs):** Se fuerza a Gemini a responder en un formato JSON estrictamente alineado al esquema relacional de la base de datos a través de la propiedad `responseSchema`. Si ocurre una desconexión de red o un fallo inesperado, un bloque `try-catch` intercepta el error y genera una ficha académica estructurada de respaldo (fallback), evitando la interrupción del registro en el sistema.
2. **Soporte Nativo de PDFs Escaneados (OCR Multimodal):** Al enviar el archivo en formato binario base64 con el tipo MIME `application/pdf`, se aprovecha la capacidad multimodal nativa de **Gemini 2.0 Flash**. El modelo realiza reconocimiento visual directo sobre las páginas del documento, evitando fallos silenciosos al procesar tesis digitalizadas mediante escáneres o imágenes de baja calidad.
3. **Prevención de DoS y Agotamiento de Memoria (Stream Limiting):** El servidor implementa validaciones estrictas y de bajo consumo mediante el middleware de carga `multer`, limitando las subidas por defecto a **20MB** (configurable dinámicamente mediante `MAX_FILE_SIZE_MB` en `.env`). Los archivos excedentes se detienen a nivel de flujo de red HTTP, evitando cargas pesadas en la memoria RAM y liberando recursos físicos inmediatamente mediante limpieza de archivos residuales (`fs.unlinkSync`).
4. **Flexibilidad por Variables de Entorno y Simulación:** La versión y nombre del modelo de lenguaje es configurable de forma dinámica mediante la variable `GEMINI_MODEL`, facilitando la actualización inmediata en producción sin requerir toques al código. Asimismo, el sistema activa un modo de simulación académica local si detecta claves temporales en el archivo `.env`, optimizando el desarrollo sin consumir cuota de la API.

### 📊 Dashboard Analítico Premium (Nativo SVG)
* **Reactive UI**: Panel principal dinámico alimentado por endpoints de estadísticas en tiempo real (tamaño en disco, volumen de archivos, usuarios activos, etc.).
* **Componentes Gráficos SVG Puros**: Gráficos interactivos de barra, distribución temática en dona y líneas de almacenamiento hechos directamente en SVG nativo para asegurar la compatibilidad fluida con React 19 (evitando colisiones de dependencias externas).

### 📄 Experiencia de Usuario de Alta Fidelidad (UX/UI Premium)
* **Inline PDF Preview**: Visualizador interactivo de PDF en pantalla completa integrado nativamente en el navegador a través de portales de React, con soporte para descargas directas seguras sin problemas de CORS.
* **Ficha Académica de Egresados**: Modal interactivo de perfiles de egresados que permite navegar de forma infinita y recursiva por los coautores de proyectos y sus antecedentes académicos.
* **Buscador Avanzado**: Filtros en tiempo real por año de promoción, categoría temática, nombres de estudiantes y búsqueda libre por operadores LIKE.

### 💾 Disaster Recovery (Drive Cloud Sync)
* **Respaldos Automatizados (Cron Job)**: El servidor ejecuta tareas programadas automáticas diariamente a las 4:00 PM y permite el forzado manual desde el Panel de Configuración.
* **Empaquetado Consolidado**: Comprime la base de datos relacional (`.sql` dump) y la carpeta física de archivos cargados (`/uploads`) en un solo archivo comprimido seguro `.zip`.
* **Sincronización con la Nube**: Sube automáticamente el respaldo a la cuenta de **Google Drive** institucional usando la API nativa de Google Cloud.

---

## 🛠️ Stack Tecnológico

### Frontend (Cliente)
* **React 19 (Vite)** — Renderizado de interfaz rápido y modular.
* **React Router DOM v7** — Gestión de enrutamiento dinámico y seguro.
* **Axios** — Cliente HTTP con interceptores automáticos de JWT.
* **Lucide React** — Set de iconos vectoriales modernos.
* **Vanilla CSS** — Diseño responsivo personalizado con efectos *Glassmorphism* y soporte adaptativo para **Modo Oscuro**.

### Backend (Servidor)
* **Node.js & Express** — Servidor backend rápido y escalable.
* **Sequelize ORM** — Mapeo relacional de base de datos MySQL.
* **Google API Client SDK** — Integración nativa para la carga en Google Drive.
* **Google Generative AI SDK** — Conexión con Gemini 2.0 Flash.
* **Nodemailer** — Motor de envío de correos y recuperación segura de claves mediante SMTP corporativo.
* **Express Validator & BcryptJS** — Sanitización de peticiones y hash criptográfico de contraseñas.
* **Express Rate Limit** — Protección contra ataques de fuerza bruta.

---

## 📂 Estructura de Directorios

El monorepo está organizado de forma intuitiva:
```bash
├── backend/                  # Servidor de API Node.js/Express
│   ├── src/
│   │   ├── config/           # Conexión DB, seeds y cron jobs
│   │   ├── middlewares/      # Rate limits, autenticación y roles
│   │   ├── models/           # Modelos Sequelize (Usuario, Proyecto, AuditLog, etc.)
│   │   ├── routes/           # Rutas expuestas de la API REST
│   │   ├── services/         # Lógica de auditoría e integración externa
│   │   └── utils/            # Conexión Drive, Gemini y Email
│   └── package.json
│
├── frontend/                 # Cliente SPA en React
│   ├── src/
│   │   ├── components/       # Modales de PDF, Fichas de Egresados y Navs
│   │   ├── context/          # Contexto global de autenticación (AuthContext)
│   │   ├── pages/            # Vistas (Dashboard, Buscar, Usuarios, Config, etc.)
│   │   ├── services/         # Instancia Axios y descargas directas
│   │   └── index.css         # Sistema de diseño y variables CSS
│   └── package.json
│
└── run_all.bat               # Script de doble clic para arrancar el sistema
```

---

## ⚙️ Instrucciones de Instalación y Uso

### Requisitos Previos
* **Node.js** (Versión 18 o superior recomendada).
* Gestor de paquetes **pnpm** (recomendado) o `npm`.
* **MySQL Server** activo.

### Paso 1: Clonar y configurar variables de entorno
1. Clona este repositorio en tu máquina local.
2. Entra en `backend/` y crea un archivo `.env` basado en `.env.example`:
   ```env
   PORT=3001
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=repositorio_academico
   DB_USER=root
   DB_PASSWORD=tu_contraseña_mysql
   JWT_SECRET=tu_secreto_jwt
   FRONTEND_URL=http://localhost:5173

   # IA (Consigue tu llave en Google AI Studio)
   GEMINI_API_KEY=tu_api_key_real
   GEMINI_MODEL=gemini-2.0-flash

   # Google Drive (Configuración en Google Cloud Console)
   GDRIVE_CLIENT_ID=tu_client_id
   GDRIVE_CLIENT_SECRET=tu_client_secret
   GDRIVE_REFRESH_TOKEN=tu_refresh_token
   ```

### Paso 2: Instalar dependencias e inicializar base de datos
1. Instala las dependencias en ambos directorios:
   ```bash
   # En la raíz
   cd backend && pnpm install
   cd ../frontend && pnpm install
   ```
2. Inicializa las tablas y el usuario administrador inicial ejecutando los scripts desde la carpeta `backend/`:
   ```bash
   pnpm run db:sync     # Sincroniza y crea las tablas en MySQL
   pnpm run db:seed     # Inserta roles, categorías y el usuario administrador inicial
   ```

### Paso 3: Levantar los servidores
* **En desarrollo**: Puedes arrancar ambos servidores con un solo clic ejecutando el script `run_all.bat` desde la raíz en Windows, o de forma manual:
  * **Backend**: `cd backend && pnpm run dev` (Corre en `http://localhost:3001`).
  * **Frontend**: `cd frontend && pnpm run dev` (Corre en `http://localhost:5173`).

---

## 👨‍💻 Créditos y Autoría
Este sistema ha sido diseñado, planificado y desarrollado en su totalidad por **Alejandro Villa** como parte del proyecto de **Servicio Comunitario** de la **Universidad Santa María (USM)** para el **Colegio Nuestra Señora de Fátima**.

---
*Desarrollado con ❤️ para el impulso y la preservación científica estudiantil.*
