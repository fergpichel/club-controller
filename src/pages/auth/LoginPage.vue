<template>
  <div class="login-page">
    <div class="form-header">
      <h1>Bienvenido de nuevo</h1>
      <p>Inicia sesión para continuar</p>
    </div>

    <transition name="slide-fade">
      <div v-if="authStore.error" class="error-banner">
        <q-icon name="error" size="18px" />
        <span>{{ authStore.error }}</span>
      </div>
    </transition>

    <q-form class="login-form" @submit.prevent="handleLogin">
      <div class="input-group">
        <label for="login-email">Correo electrónico</label>
        <div class="input-wrapper" :class="{ focused: email }">
          <q-icon name="mail" size="18px" class="input-icon" />
          <input
            id="login-email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            autocomplete="email"
            required
          />
        </div>
      </div>

      <div class="input-group">
        <label for="login-password">Contraseña</label>
        <div class="input-wrapper" :class="{ focused: password }">
          <q-icon name="lock" size="18px" class="input-icon" />
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
          <button type="button" class="toggle-password" tabindex="-1" @click="showPassword = !showPassword">
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

      <button type="submit" class="btn-primary" :disabled="authStore.loading">
        <q-spinner v-if="authStore.loading" color="white" size="20px" />
        <span v-else>Iniciar sesión</span>
        <q-icon v-if="!authStore.loading" name="arrow_forward" size="18px" />
      </button>
    </q-form>

    <div class="divider">
      <span>o continúa con</span>
    </div>

    <button
      type="button"
      class="btn-google"
      :disabled="authStore.loading"
      @click="handleGoogleLogin"
    >
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>Google</span>
    </button>

    <div class="auth-cta">
      <span>¿Eres nuevo aquí?</span>
      <router-link :to="{ name: 'register' }">Crea una cuenta</router-link>
    </div>
    <p class="back-to-landing">
      <router-link to="/">← Volver al inicio</router-link>
    </p>
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
    const redirect = (router.currentRoute.value.query.redirect as string) || '/dashboard'
    router.push(redirect.startsWith('/') ? redirect : '/dashboard')
  }
}

async function handleGoogleLogin() {
  const success = await authStore.loginWithGoogle()
  if (success) {
    const redirect = (router.currentRoute.value.query.redirect as string) || '/dashboard'
    router.push(redirect.startsWith('/') ? redirect : '/dashboard')
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  width: 100%;
}

.form-header {
  margin-bottom: 1.5rem;
}

.form-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary, #f1f5f9);
  margin: 0 0 0.5rem;
}

.form-header p {
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
  font-size: 0.9375rem;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  color: #f87171;
  font-size: 0.875rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary, #cbd5e1);
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(0, 212, 170, 0.1), rgba(56, 189, 248, 0.06)) padding-box,
              linear-gradient(135deg, rgba(0, 212, 170, 0.25), rgba(56, 189, 248, 0.15)) border-box;
  border: 2px solid transparent;
  border-radius: 12px;
  transition: all 0.3s ease;

  &.focused,
  &:focus-within {
    background: linear-gradient(135deg, rgba(0, 212, 170, 0.15), rgba(56, 189, 248, 0.1)) padding-box,
                linear-gradient(135deg, #00d4aa, #38bdf8) border-box;
    box-shadow: 0 0 20px rgba(0, 212, 170, 0.15);
  }

  .input-icon {
    position: absolute;
    left: 1rem;
    color: var(--color-text-muted, #64748b);
    transition: color 0.2s;
  }

  &:focus-within .input-icon {
    color: #00d4aa;
  }

  input {
    width: 100%;
    padding: 1rem 1rem 1rem 2.75rem;
    background: transparent;
    border: none;
    font-size: 1rem;
    color: var(--color-text-primary, #f1f5f9);
    outline: none;

    &::placeholder {
      color: var(--color-text-muted, #64748b);
    }
  }

  .toggle-password {
    position: absolute;
    right: 0.75rem;
    padding: 0.5rem;
    color: var(--color-text-muted, #64748b);
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 6px;
    transition: color 0.2s;
  }

  .toggle-password:hover {
    color: var(--color-text-primary, #f1f5f9);
    background: rgba(255, 255, 255, 0.05);
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #cbd5e1);
  cursor: pointer;
  user-select: none;

  input {
    display: none;
  }

  .checkmark {
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-border, #334155);
    border-radius: 4px;
    transition: all 0.2s;
    position: relative;
  }

  input:checked + .checkmark {
    background: #00d4aa;
    border-color: #00d4aa;

    &::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid #0f172a;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }
}

.forgot-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: #00d4aa;
  text-decoration: none;
}

.forgot-link:hover {
  color: #00f5c4;
  text-decoration: underline;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #00d4aa 0%, #00f5c4 100%);
  color: #0f172a;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.25rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 212, 170, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: var(--color-text-muted, #64748b);
  font-size: 0.875rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border, #334155);
}

.divider span {
  padding: 0 1rem;
}

.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)) padding-box,
              linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05)) border-box;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary, #f1f5f9);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-google:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05)) padding-box,
              linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1)) border-box;
}

.btn-google:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-cta {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border, #334155);
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
}

.auth-cta a {
  color: #00d4aa;
  font-weight: 600;
  text-decoration: none;
  margin-left: 0.25rem;
}

.auth-cta a:hover {
  color: #00f5c4;
  text-decoration: underline;
}

.back-to-landing {
  text-align: center;
  margin: 1rem 0 0;
  font-size: 0.875rem;
}

.back-to-landing a {
  color: var(--color-text-muted, #64748b);
  text-decoration: none;
}

.back-to-landing a:hover {
  color: #00d4aa;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
