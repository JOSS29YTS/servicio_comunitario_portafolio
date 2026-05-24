// ============================================================
// SERVICIO: API — Cliente Axios hacia el backend
// Base URL: http://localhost:3001/api
// ============================================================
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Interceptor de Request ────────────────────────────────
// Adjunta el JWT automáticamente a cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Interceptor de Response ───────────────────────────────
// Si el token expiró o es inválido (401 o 403), limpia y redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      // Evitar bucle infinito si ya estamos en la página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session_expired=true'
      }
    }
    return Promise.reject(error)
  }
)

export const descargarArchivo = async (rutaRelativa, nombreArchivoDescarga = 'archivo.pdf') => {
  try {
    // Si la ruta ya incluye el dominio completo, extraemos solo la parte del path
    let url = rutaRelativa;
    if (rutaRelativa.startsWith('http://') || rutaRelativa.startsWith('https://')) {
      const parsedUrl = new URL(rutaRelativa);
      url = parsedUrl.pathname;
    }

    const response = await api.get(url, {
      responseType: 'blob',
      // Evitar timeouts largos para descargas
      timeout: 30000 
    });

    // Crear un blob temporal
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Crear elemento <a> invisible para disparar la descarga
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = nombreArchivoDescarga;
    document.body.appendChild(link);
    link.click();
    
    // Limpieza
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
    return true;
  } catch (error) {
    console.error('[API] Error al intentar descargar el archivo:', error);
    throw error;
  }
};

export default api
