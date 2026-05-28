import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Shield, Search, FileText, ArrowRight, UserCheck, HelpCircle, Sun, Moon } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const [logoError, setLogoError] = React.useState(false)
  const [isDark, setIsDark]       = React.useState(
    document.documentElement.classList.contains('dark')
  )

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleScrollToFeatures = () => {
    const element = document.getElementById('features-section')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="home-container">
      {/* Contenedor de fondos y luces para recortar el desbordamiento vertical */}
      <div className="home-bg-wrapper">
        <div className="home-bg-grid" />
        <div className="home-bg-glow-1" />
        <div className="home-bg-glow-2" />
      </div>

      {/* Barra de Navegación Flotante */}
      <nav className="home-navbar">
        <div className="home-nav-brand">
          <div className="home-nav-brand-text">
            <span className="school-title">Colegio NSF</span>
            <span className="school-sub">Nuestra Señora de Fátima</span>
          </div>
        </div>

        <div className="home-nav-actions">
          <button
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            onClick={toggleTheme}
            className="btn-nav-secondary"
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a href="mailto:soporte@colegiofatima.edu.ve" className="btn-nav-secondary">
            <HelpCircle size={15} />
            Soporte Técnico
          </a>
          <button onClick={() => navigate('/login')} className="btn-nav-primary">
            Iniciar Sesión
            <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* Sección Hero */}
      <header className="home-hero">
        {!logoError ? (
          <div className="hero-logos-group">
            {/* Logo Colegio */}
            <div className="hero-logo-large" title="Colegio Nuestra Señora de Fátima">
              <img 
                src="/logo_fatima.svg" 
                alt="Colegio NSF" 
                onError={() => setLogoError(true)} 
              />
            </div>
            {/* Virgen de Fátima */}
            <div className="hero-logo-large virgen-avatar" title="Nuestra Señora de Fátima">
              <img 
                src="/virgen_fatima.png" 
                alt="Virgen María" 
                className="no-invert"
                onError={() => setLogoError(true)} 
              />
            </div>
          </div>
        ) : (
          <div className="hero-logo-large" style={{ margin: '0 auto 24px' }}>
            <BookOpen className="fallback-logo-icon-large" size={120} />
          </div>
        )}

        <h1 className="hero-title">
          Repositorio Académico <br />
          <span className="hero-title-gradient">Digital e Institucional</span>
        </h1>
        
        <p className="hero-subtitle">
          Digitalizando la gestión, registro y consulta de proyectos de investigación estudiantil para un mañana más eficiente, organizado y libre de papeleo.
        </p>

        <div className="hero-cta-group">
          <button onClick={() => navigate('/login')} className="btn btn-primary btn-lg home-cta-btn">
            Ingresar al Sistema
            <ArrowRight size={18} />
          </button>
          <button onClick={handleScrollToFeatures} className="btn btn-secondary btn-lg home-cta-secondary">
            Conocer Características
          </button>
        </div>
      </header>

      {/* Sección de Características */}
      <section id="features-section" className="home-features">
        <div className="section-header">
          <h2 className="section-title">¿Qué ofrece la plataforma?</h2>
          <p className="section-subtitle">Diseñada para simplificar el registro, la consulta y la preservación del repositorio de proyectos de investigación estudiantil.</p>
        </div>

        <div className="features-grid">
          {/* Tarjeta 1 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper search-wrapper">
              <Search size={24} />
            </div>
            <h3>Búsqueda Inteligente</h3>
            <p>Encuentra proyectos de investigación en milisegundos con filtros avanzados por título, autor, categoría o año de publicación.</p>
          </div>

          {/* Tarjeta 2 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper shield-wrapper">
              <Shield size={24} />
            </div>
            <h3>Almacenamiento Local Seguro</h3>
            <p>Resguardado al 100% en la computadora de la dirección escolar, libre de amenazas externas y con alta velocidad de red LAN.</p>
          </div>

          {/* Tarjeta 3 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper doc-wrapper">
              <FileText size={24} />
            </div>
            <h3>Digitalización Eficiente</h3>
            <p>Archiva trabajos académicos y propuestas en formato PDF de alta resolución, reduciendo el espacio físico y preservando el conocimiento.</p>
          </div>
        </div>
      </section>

      {/* Footer del Home */}
      <footer className="home-footer-sec">
        <div className="footer-content">
          <div className="footer-credits">
            <p>Desarrollado por <strong>Alejandro Villa</strong></p>
            <span>Proyecto de Servicio Comunitario — Universidad Santa María (USM)</span>
          </div>
          <div className="footer-copyright">
            <p>© 2026 Colegio Nuestra Señora de Fátima. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
