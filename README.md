# 🎓 Repositorio Académico — Colegio Nuestra Señora de Fátima

[![React](https://img.shields.io/badge/React-19.2-blue?logo=react&logoColor=white)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-purple?logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

¡Bienvenido al **Repositorio Académico del Colegio Nuestra Señora de Fátima**! Este es un sistema digital premium de gestión académica, preservación de proyectos de investigación científica y automatización escolar desarrollado para digitalizar, organizar y analizar los trabajos de grado de los estudiantes de 5to año de bachillerato. 

El sistema está estructurado con una arquitectura moderna de **Single Page Application (SPA)** en el Frontend (React 19) y un servidor **RESTful API** robusto en el Backend (Node.js) con almacenamiento relacional (MySQL).

---

## 🚀 Características Clave

### 👤 Control de Acceso y Gestión de Roles (RBAC)
* **Autenticación Robusta**: Inicio de sesión seguro mediante tokens Web JSON (JWT) con expiración automática de sesión.
* **Roles Granulares (RBAC)**: Flujos diferenciados y permisos estrictos para **Directores**, **Subdirectores** y **Profesores**.
* **Flujo de Aprobación**: Los nuevos registros de docentes entran en estado *Pendiente* y requieren la validación física de un Director para acceder al panel.
* **Auditoría del Sistema (Audit Log)**: Registro inmutable de acciones críticas (inicios de sesión fallidos, creación/edición/borrado de proyectos, cambios de roles) visible para directores.

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

## 🔑 Usuario Administrador Demo (Semilla)
Al ejecutar el script de inicialización (`pnpm run db:seed`), se crea la siguiente cuenta de acceso por defecto con privilegios de **Director** para que puedas explorar la plataforma inmediatamente:
* **Usuario**: `alejandrovilla2912@gmail.com`
* **Contraseña**: `React29d$`

---

## 👨‍💻 Créditos y Autoría
Este sistema ha sido diseñado, planificado y desarrollado en su totalidad por **Alejandro Villa** como parte del proyecto de **Servicio Comunitario** de la **Universidad Santa María (USM)** para el **Colegio Nuestra Señora de Fátima**.

---
*Desarrollado con ❤️ para el impulso y la preservación científica estudiantil.*
