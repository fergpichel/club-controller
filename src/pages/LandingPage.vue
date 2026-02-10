<template>
  <div ref="landingRef" class="landing">
    <!-- Nav -->
    <header class="landing-nav">
      <router-link to="/" class="nav-brand">
        <img src="/favicon.svg" alt="" class="nav-logo-img" />
        <span class="nav-brand-text">Teempad <span class="nav-brand-suffix">Funds</span></span>
      </router-link>
      <nav class="nav-links">
        <a href="#funcionalidades">Funcionalidades</a>
        <a href="#ia">IA</a>
        <a href="#seguridad">Seguridad</a>
        <a href="#ecosistema">Ecosistema</a>
        <router-link to="/auth/login" class="nav-login">Iniciar sesión</router-link>
        <router-link to="/auth/register" class="nav-cta">Probar gratis</router-link>
      </nav>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-gradient"></div>
        <div class="hero-grid"></div>
        <div class="hero-glow hero-glow-1"></div>
        <div class="hero-glow hero-glow-2"></div>
      </div>
      <div class="hero-content container">
        <span class="hero-badge">Gestión financiera inteligente</span>
        <h1 class="hero-title">
          Las cuentas del club, <br />
          <span class="branding-tagline">claras, compartidas y seguras.</span>
        </h1>
        <p class="hero-subtitle">
          Una app sencilla para alinear ingresos y gastos, patrocinadores, proveedores y tesorería.
          Sin complicaciones. Con la claridad que tu club necesita.
        </p>
        <div class="hero-actions">
          <router-link to="/auth/register" class="btn-primary">Probar gratis</router-link>
          <router-link to="/auth/login" class="btn-secondary">Ya tengo cuenta</router-link>
        </div>
      </div>
    </section>

    <!-- Funcionalidades -->
    <section id="funcionalidades" class="section section-features">
      <div class="container">
        <h2 class="section-title">Todo lo que necesitas, en un solo lugar</h2>
        <p class="section-lead">
          Ingresos, gastos, patrocinadores y proveedores. Cuadro de mando, tesorería y cierres. Sin hojas de cálculo ni herramientas sueltas.
        </p>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon"><q-icon name="trending_up" size="28px" /></div>
            <h3>Ingresos y gastos</h3>
            <p>Registra cada movimiento con categorías, equipos y proyectos. Flujo de caja claro al instante.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><q-icon name="handshake" size="28px" /></div>
            <h3>Patrocinadores</h3>
            <p>Gestiona acuerdos, cuotas y seguimiento. Sabes quién paga qué y cuándo.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><q-icon name="store" size="28px" /></div>
            <h3>Proveedores</h3>
            <p>Control de facturas y pagos por proveedor. Ideal para material, instalaciones y servicios.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><q-icon name="query_stats" size="28px" /></div>
            <h3>Cuadro de mando</h3>
            <p>Vista ejecutiva de la salud financiera. Rentabilidad por equipo, proyecto o periodo.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><q-icon name="show_chart" size="28px" /></div>
            <h3>Tesorería</h3>
            <p>Previsiones de caja y escenarios. Toma decisiones con datos, no con intuición.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon"><q-icon name="lock" size="28px" /></div>
            <h3>Cierres mensuales</h3>
            <p>Cierra el mes con un clic. Histórico ordenado y listo para la gestoría.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- IA -->
    <section id="ia" class="section section-ai">
      <div class="container">
        <h2 class="section-title">Impulsado por IA</h2>
        <p class="section-lead">
          Menos tiempo rellenando. Más tiempo tomando decisiones.
        </p>
        <div class="ai-grid">
          <article class="ai-card ai-now">
            <span class="ai-badge">Disponible ahora</span>
            <h4>Clasificación automática</h4>
            <p>La IA sugiere categoría, equipo y descripción a partir del concepto. Acepta o corrige en un clic. Menos errores y menos trabajo manual.</p>
          </article>
          <article class="ai-card ai-soon">
            <span class="ai-badge soon">Próximamente</span>
            <h4>Escaneo de tickets y facturas</h4>
            <p>Fotografía o sube un ticket o factura: la IA extrae importe, fecha, proveedor y concepto y rellena el formulario por ti. Cero tecleo.</p>
          </article>
          <article class="ai-card ai-soon">
            <span class="ai-badge soon">Próximamente</span>
            <h4>Resúmenes y alertas</h4>
            <p>Resúmenes en lenguaje natural de tu mes financiero. Alertas si algo se desvía del patrón o si un patrocinador se retrasa.</p>
          </article>
          <article class="ai-card ai-soon">
            <span class="ai-badge soon">Próximamente</span>
            <h4>Predicción de caja</h4>
            <p>La IA aprende de tu historial y mejora las previsiones de tesorería. Menos sorpresas, más control.</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Próximas features -->
    <section class="section section-roadmap">
      <div class="container">
        <h2 class="section-title">En camino</h2>
        <p class="section-lead">
          Funcionalidades que estamos preparando para que tu club siga creciendo.
        </p>
        <ul class="roadmap-list">
          <li>Presupuestos por equipo o proyecto con seguimiento automático</li>
          <li>Informes y reportes listos para junta o gestoría</li>
          <li>Integración bancaria para conciliación automática</li>
          <li>Recordatorios de cobro a patrocinadores</li>
          <li>Firma electrónica en acuerdos y facturas</li>
        </ul>
      </div>
    </section>

    <!-- Seguridad -->
    <section id="seguridad" class="section section-security">
      <div class="container">
        <h2 class="section-title">Privadas por diseño</h2>
        <p class="section-lead section-security-lead">
          Transparencia no significa exposición.
          En Teempad Funds la información es compartida solo con quien debe verla, y siempre bajo control.
        </p>
        <ul class="security-list">
          <li>
            <span class="security-icon" aria-hidden="true"><q-icon name="person_add" size="20px" /></span>
            Acceso solo por invitación
          </li>
          <li>
            <span class="security-icon" aria-hidden="true"><q-icon name="admin_panel_settings" size="20px" /></span>
            Permisos según rol en la directiva
          </li>
          <li>
            <span class="security-icon" aria-hidden="true"><q-icon name="history" size="20px" /></span>
            Historial de cambios y trazabilidad
          </li>
          <li>
            <span class="security-icon" aria-hidden="true"><q-icon name="domain" size="20px" /></span>
            Datos siempre del club
          </li>
        </ul>
      </div>
    </section>

    <!-- Ecosistema Teempad -->
    <section id="ecosistema" class="section section-ecosystem">
      <div class="container">
        <h2 class="section-title">El ecosistema Teempad</h2>
        <p class="section-lead">
          Tres productos para llevar tu club al siguiente nivel: análisis, finanzas y gestión integral.
        </p>
        <div class="ecosystem-grid">
          <div class="ecosystem-card">
            <div class="ecosystem-logo-wrap">
              <img src="/teempad_labs_logo.svg" alt="" class="ecosystem-logo" />
              <span class="ecosystem-name">Teempad <strong>Lab</strong></span>
            </div>
            <p>Análisis deportivo: estadísticas en tiempo real, vídeo y gestión de equipos. Para entrenadores y staff técnico.</p>
          </div>
          <div class="ecosystem-card highlight">
            <div class="ecosystem-logo-wrap">
              <img src="/favicon.svg" alt="" class="ecosystem-logo" />
              <span class="ecosystem-name">Teempad <strong class="ecosystem-name-funds">Funds</strong></span>
            </div>
            <p>Gestión financiera para clubes: ingresos, gastos, patrocinadores, tesorería e IA. Esta es la app que estás viendo.</p>
          </div>
          <div class="ecosystem-card">
            <div class="ecosystem-logo-wrap">
              <img src="/teempad_club_logo.svg" alt="" class="ecosystem-logo" />
              <span class="ecosystem-name">Teempad <strong class="ecosystem-name-club">Club</strong></span>
            </div>
            <p>Gestión integral del club: unifica operación, finanzas y comunicación. Próximamente.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="section section-cta">
      <div class="cta-bg"></div>
      <div class="container cta-content">
        <h2 class="cta-title">Lleva las finanzas de tu club al siguiente nivel</h2>
        <p class="cta-subtitle">
          Regístrate gratis y empieza a tener la claridad que necesitas.
        </p>
        <div class="cta-actions">
          <router-link to="/auth/register" class="btn-primary btn-large">Crear cuenta gratis</router-link>
          <router-link to="/auth/login" class="btn-ghost">Ya tengo cuenta</router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="container footer-inner">
        <router-link to="/" class="footer-brand">
          <img src="/favicon.svg" alt="" class="footer-logo" />
          <span>Teempad <span class="footer-brand-funds">Funds</span></span>
        </router-link>
        <div class="footer-links">
          <router-link to="/auth/login">Iniciar sesión</router-link>
          <router-link to="/auth/register">Registrarse</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const landingRef = ref<HTMLElement | null>(null)
</script>

<style lang="scss" scoped>
.landing {
  min-height: 100vh;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

/* Nav */
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  background: rgba(10, 37, 64, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
}

.nav-logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.nav-brand-suffix {
  color: #00D4AA;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.nav-links a {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: white;
}

.nav-login {
  color: rgba(255, 255, 255, 0.9) !important;
}

.nav-cta {
  background: linear-gradient(135deg, #635BFF, #7A73FF);
  color: white !important;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
}

.nav-cta:hover {
  opacity: 0.95;
  color: white !important;
}

/* Hero */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: calc(80px + var(--space-12)) var(--space-6) var(--space-12);
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0A2540 0%, #0D3251 35%, #1A3A5C 70%, #0A2540 100%);
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.hero-glow-1 {
  width: 400px;
  height: 400px;
  background: rgba(99, 91, 255, 0.3);
  top: -100px;
  right: -100px;
}

.hero-glow-2 {
  width: 300px;
  height: 300px;
  background: rgba(0, 212, 170, 0.25);
  bottom: 20%;
  left: -80px;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  background: rgba(99, 91, 255, 0.2);
  border: 1px solid rgba(99, 91, 255, 0.4);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  color: #a5b4fc;
  margin-bottom: var(--space-6);
  letter-spacing: 0.02em;
}

.hero-title {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: white;
  margin: 0 0 var(--space-5);
}

.hero-title-accent {
  background: linear-gradient(135deg, #00D4AA, #00F5C4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  max-width: 560px;
  margin: 0 0 var(--space-8);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.branding-tagline {
  background: linear-gradient(135deg, #a78bfa 0%, #38bdf8 50%, #38f898 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-6);
  background: linear-gradient(135deg, #635BFF, #7A73FF);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(99, 91, 255, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(99, 91, 255, 0.45);
  color: white;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-6);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.25);
  text-decoration: none;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

/* Sections */
.section {
  padding: var(--space-16) 0;
}

.section-title {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 700;
  text-align: center;
  margin: 0 0 var(--space-4);
  color: var(--color-text-primary);
}

.section-lead {
  text-align: center;
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  max-width: 640px;
  margin: 0 auto var(--space-10);
  line-height: 1.6;
}

/* Features grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6);
}

.feature-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: rgba(99, 91, 255, 0.1);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.feature-card h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 var(--space-2);
  color: var(--color-text-primary);
}

.feature-card p {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* AI section */
.section-ai {
  background: var(--color-bg-tertiary);
}

.ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-5);
}

.ai-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  position: relative;
}

.ai-card.ai-soon {
  opacity: 0.9;
}

.ai-badge {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(0, 212, 170, 0.15);
  color: var(--color-success);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-3);
}

.ai-badge.soon {
  background: rgba(99, 91, 255, 0.12);
  color: var(--color-accent);
}

.ai-card h4 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 var(--space-2);
  color: var(--color-text-primary);
}

.ai-card p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Roadmap */
.roadmap-list {
  max-width: 560px;
  margin: 0 auto;
  list-style: none;
  padding: 0;
}

.roadmap-list li {
  padding: var(--space-3) var(--space-4);
  padding-left: var(--space-8);
  position: relative;
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  border-bottom: 1px solid var(--color-border-light);
}

.roadmap-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
}

/* Security */
.section-security {
  background: var(--color-bg-tertiary);
}

.section-security-lead {
  max-width: 560px;
}

.security-list {
  max-width: 520px;
  margin: 0 auto;
  list-style: none;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

.security-list li {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.security-list li:hover {
  border-color: rgba(0, 212, 170, 0.3);
  box-shadow: 0 4px 12px rgba(0, 212, 170, 0.08);
}

.security-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: rgba(0, 212, 170, 0.12);
  color: #00D4AA;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Ecosystem */
.section-ecosystem {
  background: var(--color-bg-secondary);
}

.ecosystem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
}

.ecosystem-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: transform 0.2s;
}

.ecosystem-card.highlight {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px rgba(99, 91, 255, 0.2);
}

.ecosystem-card:hover {
  transform: translateY(-2px);
}

.ecosystem-logo-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.ecosystem-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.ecosystem-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.ecosystem-name strong {
  color: var(--color-accent);
}

.ecosystem-name-funds {
  color: #00D4AA !important;
}

.ecosystem-name-club {
  background: linear-gradient(135deg, #00D4AA, #528bf2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-brand-funds {
  color: #00D4AA;
}

.ecosystem-card p {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* CTA */
.section-cta {
  position: relative;
  padding: var(--space-16) var(--space-6);
}

.cta-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0A2540 0%, #1A3A5C 100%);
}

.cta-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.cta-title {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  color: white;
  margin: 0 0 var(--space-3);
}

.cta-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 var(--space-8);
}

.cta-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-4);
}

.btn-large {
  padding: var(--space-4) var(--space-8);
  font-size: 1.125rem;
}

.btn-ghost {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 600;
  padding: var(--space-3) var(--space-5);
}

.btn-ghost:hover {
  color: white;
}

/* Footer */
.landing-footer {
  padding: var(--space-6) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9375rem;
}

.footer-brand:hover {
  color: var(--color-text-primary);
}

.footer-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.footer-links {
  display: flex;
  gap: var(--space-6);
}

.footer-links a {
  color: var(--color-text-tertiary);
  text-decoration: none;
  font-size: 0.875rem;
}

.footer-links a:hover {
  color: var(--color-accent);
}

@media (max-width: 768px) {
  .nav-links a:not(.nav-login):not(.nav-cta) {
    display: none;
  }

  .hero-subtitle {
    font-size: 1.0625rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .ai-grid {
    grid-template-columns: 1fr;
  }

  .ecosystem-grid {
    grid-template-columns: 1fr;
  }
}
</style>
