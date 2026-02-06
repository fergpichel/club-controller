<template>
  <div class="login-container">
    <div class="login-content animate-in">
      <!-- Brand -->
      <div class="brand-section">
        <div class="brand-logo">
          <q-icon name="sports_soccer" size="32px" />
        </div>
        <h1 class="brand-name">Club Controller</h1>
        <p class="brand-tagline">Gestión financiera inteligente para clubes deportivos</p>
      </div>

      <!-- Login Card -->
      <div class="login-card">
        <div class="card-header">
          <h2>Bienvenido de nuevo</h2>
          <p>Inicia sesión para continuar</p>
        </div>

        <q-form class="login-form" @submit.prevent="handleLogin">
          <div class="input-group">
            <label>Correo electrónico</label>
            <div class="input-wrapper">
              <q-icon name="mail" size="18px" class="input-icon" />
              <input
                v-model="email"
                type="email"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div class="input-group">
            <label>Contraseña</label>
            <div class="input-wrapper">
              <q-icon name="lock" size="18px" class="input-icon" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
              />
              <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" size="18px" />
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="remember-check">
              <input v-model="rememberMe" type="checkbox" />
              <span class="checkmark"></span>
              Recordarme
            </label>
            <router-link :to="{ name: 'forgot-password' }" class="forgot-link">
              ¿Olvidaste tu contraseña?
            </router-link>
          </div>

          <!-- Error -->
          <transition name="slide-fade">
            <div v-if="authStore.error" class="error-banner">
              <q-icon name="error" size="18px" />
              <span>{{ authStore.error }}</span>
            </div>
          </transition>

          <button type="submit" class="login-btn" :disabled="authStore.loading">
            <span v-if="!authStore.loading">Iniciar sesión</span>
            <q-spinner v-else color="white" size="20px" />
          </button>
        </q-form>

        <!-- Separator -->
        <div class="divider">
          <span>o continúa con</span>
        </div>

        <!-- Google SSO -->
        <div class="social-login">
          <button class="google-btn" :disabled="authStore.loading" @click="handleGoogleLogin">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google</span>
          </button>
        </div>

        <div class="card-footer">
          <p>
            ¿Eres nuevo aquí?
            <router-link :to="{ name: 'register' }">Crea una cuenta</router-link>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <p class="login-footer">© 2026 Club Controller. Todos los derechos reservados.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)

async function handleLogin() {
  const success = await authStore.login(email.value, password.value)
  if (success) {
    router.push({ name: 'dashboard' })
  }
}

async function handleGoogleLogin() {
  const success = await authStore.loginWithGoogle()
  if (success) {
    router.push({ name: 'dashboard' })
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.login-content {
  width: 100%;
  max-width: 400px;
}

// Brand
.brand-section {
  text-align: center;
  margin-bottom: var(--space-8);
}

.brand-logo {
  width: 64px;
  height: 64px;
  background: var(--gradient-brand);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-4);
  color: white;
  box-shadow: 0 8px 24px rgba(10, 37, 64, 0.25);
}

.brand-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  margin: 0 0 var(--space-1);
  letter-spacing: -0.02em;
}

.brand-tagline {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

// Card
.login-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
}

.card-header {
  padding: var(--space-8) var(--space-6) var(--space-5);
  text-align: center;

  h2 {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-1);
  }

  p {
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
    margin: 0;
  }
}

.login-form {
  padding: 0 var(--space-6) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

// Input group
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: var(--color-bg-tertiary);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 var(--space-4);
  transition: all var(--duration-fast) var(--ease-out);

  &:focus-within {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1);
  }

  .input-icon {
    color: var(--color-text-tertiary);
    flex-shrink: 0;
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    padding: var(--space-4) var(--space-3);
    font-size: 0.9375rem;
    font-family: inherit;
    color: var(--color-text-primary);
    outline: none;

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  .toggle-password {
    background: none;
    border: none;
    padding: var(--space-1);
    cursor: pointer;
    color: var(--color-text-tertiary);
    transition: color var(--duration-fast) var(--ease-out);

    &:hover {
      color: var(--color-text-secondary);
    }
  }
}

// Form options
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;

  input {
    display: none;
  }

  .checkmark {
    width: 18px;
    height: 18px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    transition: all var(--duration-fast) var(--ease-out);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 1px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      opacity: 0;
    }
  }

  input:checked + .checkmark {
    background: var(--color-accent);
    border-color: var(--color-accent);

    &::after {
      opacity: 1;
    }
  }
}

.forgot-link {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-accent);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// Error banner
.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
}

// Login button
.login-btn {
  width: 100%;
  height: 48px;
  background: var(--gradient-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  box-shadow: var(--shadow-button);

  &:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(99, 91, 255, 0.4);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

// Divider
.divider {
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  gap: var(--space-4);

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border-light);
  }

  span {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

// Social login
.social-login {
  padding: var(--space-4) var(--space-6) var(--space-2);
}

.google-btn {
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  background: var(--color-bg-tertiary);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);

  &:hover:not(:disabled) {
    background: var(--color-bg-secondary);
    border-color: var(--color-border-strong);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

// Footer
.card-footer {
  padding: var(--space-5) var(--space-6);
  background: var(--color-bg-tertiary);
  text-align: center;
  border-top: 1px solid var(--color-border-light);

  p {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  a {
    color: var(--color-accent);
    font-weight: 600;
    text-decoration: none;
    margin-left: var(--space-1);

    &:hover {
      text-decoration: underline;
    }
  }
}

.login-footer {
  text-align: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin: var(--space-8) 0 0;
}

// Animations
.animate-in {
  animation: fadeInUp 0.6s var(--ease-out);
}

.slide-fade-enter-active {
  transition: all 0.3s var(--ease-out);
}

.slide-fade-leave-active {
  transition: all 0.2s var(--ease-out);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
