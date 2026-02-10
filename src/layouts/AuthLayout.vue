<template>
  <div class="auth-layout">
    <!-- Left side - Branding -->
    <div class="auth-branding">
      <div class="branding-content">
        <router-link to="/" class="auth-brand">
          <img src="/favicon.svg" alt="Teempad Funds" class="brand-logo-img" />
          <div class="brand-text">
            <span class="brand-name">teempad</span>
            <span class="brand-word">Funds</span>
          </div>
        </router-link>
        <div class="branding-tagline">
          <h2>Gestiona. Cierra. Controla.</h2>
          <p>Gestión financiera inteligente para clubes deportivos</p>
        </div>
        <div class="branding-features">
          <div class="feature">
            <div class="feature-icon" aria-hidden="true">
              <q-icon name="account_balance_wallet" size="24px" />
            </div>
            <span>Ingresos y gastos por categoría</span>
          </div>
          <div class="feature">
            <div class="feature-icon" aria-hidden="true">
              <q-icon name="event_note" size="24px" />
            </div>
            <span>Cierres mensuales</span>
          </div>
          <div class="feature">
            <div class="feature-icon" aria-hidden="true">
              <q-icon name="groups" size="24px" />
            </div>
            <span>Multi-club y equipos</span>
          </div>
        </div>
      </div>
      <div class="branding-decoration">
        <div class="deco-circle deco-1"></div>
        <div class="deco-circle deco-2"></div>
        <div class="deco-circle deco-3"></div>
        <div class="deco-grid"></div>
      </div>
    </div>

    <!-- Right side - Form (router-view) -->
    <div class="auth-form-container">
      <div class="auth-form-inner">
        <!-- Mobile logo -->
        <div class="mobile-logo">
          <router-link to="/" class="auth-brand auth-brand--mobile">
            <img src="/favicon.svg" alt="Teempad Funds" class="brand-logo-img mobile" />
            <div class="brand-text">
              <span class="brand-name">teempad</span>
              <span class="brand-word">Funds</span>
            </div>
          </router-link>
        </div>

        <router-view v-slot="{ Component }">
          <transition name="page-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Auth layout: split screen like grooter-stats (branding left, form right)
</script>

<style lang="scss" scoped>
.auth-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--color-bg-primary, #0f172a);
}

/* ========== LEFT - BRANDING ========== */
.auth-branding {
  position: relative;
  background: linear-gradient(145deg, #0c1222 0%, #162032 50%, #0f1a2e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
}

.branding-content {
  position: relative;
  z-index: 2;
  max-width: 100%;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  margin-bottom: 2rem;
}

.auth-brand .brand-logo-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
  line-height: 1.15;
}

.brand-name {
  font-family: inherit;
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.95);
}

.brand-word {
  font-family: inherit;
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #00d4aa, #00f5c4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.branding-tagline {
  margin-bottom: 2.5rem;
}

.branding-tagline h2 {
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4aa 0%, #38bdf8 50%, #00f5c4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.branding-tagline p {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.6;
}

.branding-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(0, 212, 170, 0.08) 0%, rgba(56, 189, 248, 0.05) 100%);
  border: 1px solid rgba(0, 212, 170, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.feature:hover {
  background: linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%);
  border-color: rgba(0, 212, 170, 0.5);
  transform: translateX(4px);
}

.feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
}

.feature span {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* Decorations */
.branding-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
}

.deco-1 {
  width: 500px;
  height: 500px;
  top: -200px;
  right: -150px;
  background: radial-gradient(circle, rgba(0, 212, 170, 0.2) 0%, transparent 70%);
  animation: float 20s ease-in-out infinite;
}

.deco-2 {
  width: 350px;
  height: 350px;
  bottom: -120px;
  left: -120px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%);
  animation: float 15s ease-in-out infinite reverse;
}

.deco-3 {
  width: 200px;
  height: 200px;
  top: 40%;
  left: 15%;
  background: radial-gradient(circle, rgba(0, 245, 196, 0.15) 0%, transparent 70%);
  animation: float 12s ease-in-out infinite;
}

.deco-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 212, 170, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(3deg); }
}

/* ========== RIGHT - FORM ========== */
.auth-form-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--color-bg-secondary, #1e293b);
  overflow-y: auto;
}

.auth-form-inner {
  width: 100%;
  max-width: 400px;
}

.mobile-logo {
  display: none;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.mobile-logo .auth-brand {
  margin-bottom: 0;
}

.auth-brand--mobile .brand-logo-img.mobile {
  width: 40px;
  height: 40px;
}

.auth-brand--mobile .brand-name {
  font-size: 1.125rem;
}

.auth-brand--mobile .brand-word {
  font-size: 0.9375rem;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 1024px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }

  .auth-branding {
    display: none;
  }

  .mobile-logo {
    display: flex;
  }

  .auth-form-container {
    min-height: 100vh;
  }
}

/* Transitions */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
