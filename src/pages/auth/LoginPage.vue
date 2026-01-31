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
