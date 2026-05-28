import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Proyectos from './pages/Proyectos'
import NuevoProyecto from './pages/NuevoProyecto'
import Buscar from './pages/Buscar'
import Configuracion from './pages/Configuracion'
import Notificaciones from './pages/Notificaciones'
import Usuarios from './pages/Usuarios'
import RecuperarClave from './pages/RecuperarClave'
import RestablecerClave from './pages/RestablecerClave'
import { IS_DEMO_MODE } from './config/demoMode'

function DemoPublicRoute({ children }) {
  if (IS_DEMO_MODE) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      <div className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </div>
    </div>
  )
}

// Spinner mientras verifica el token guardado
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy-900)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid rgba(99,102,241,0.3)',
        borderTop: '3px solid var(--indigo-500)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--navy-400)', fontSize: 13 }}>Cargando sistema...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function AppRoutes() {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen />

  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<DemoPublicRoute><Register /></DemoPublicRoute>} />
      <Route path="/recuperar-clave" element={<DemoPublicRoute><RecuperarClave /></DemoPublicRoute>} />
      <Route path="/restablecer-clave" element={<DemoPublicRoute><RestablecerClave /></DemoPublicRoute>} />

      {/* Rutas protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/proyectos" element={
        <ProtectedRoute>
          <AppLayout><Proyectos /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/nuevo-proyecto" element={
        <ProtectedRoute>
          <AppLayout><NuevoProyecto /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/editar-proyecto/:id" element={
        <ProtectedRoute>
          <AppLayout><NuevoProyecto /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/buscar" element={
        <ProtectedRoute>
          <AppLayout><Buscar /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/configuracion" element={
        <ProtectedRoute>
          <AppLayout><Configuracion /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/notificaciones" element={
        <ProtectedRoute>
          <AppLayout><Notificaciones /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/usuarios" element={
        <ProtectedRoute>
          <AppLayout><Usuarios /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Redirecciones */}
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  React.useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
