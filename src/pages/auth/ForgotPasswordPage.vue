<template>
  <div class="forgot-page">
    <div class="form-header">
      <h1>Recuperar contraseña</h1>
      <p>Te enviaremos un enlace para restablecer tu contraseña</p>
    </div>

    <template v-if="!emailSent">
      <transition name="slide-fade">
        <div v-if="authStore.error" class="error-banner">
          <q-icon name="error" size="18px" />
          <span>{{ authStore.error }}</span>
        </div>
      </transition>

      <form class="forgot-form" @submit.prevent="handleReset">
        <div class="input-group">
          <label for="forgot-email">Email</label>
          <div class="input-wrapper" :class="{ focused: email }">
            <q-icon name="mail" size="18px" class="input-icon" />
            <input
              id="forgot-email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              autocomplete="email"
              required
            />
          </div>
        </div>
        <button type="submit" class="btn-primary" :disabled="authStore.loading">
          <q-spinner v-if="authStore.loading" color="white" size="20px" />
          <template v-else>
            <span>Enviar enlace</span>
            <q-icon name="arrow_forward" size="18px" />
          </template>
        </button>
      </form>

      <div class="auth-cta">
        <router-link :to="{ name: 'login' }" class="back-link">
          <q-icon name="arrow_back" size="18px" />
          Volver al login
        </router-link>
      </div>
    </template>

    <div v-else class="success-block">
      <q-icon name="mark_email_read" size="64px" class="success-icon" />
      <h2>¡Email enviado!</h2>
      <p>
        Hemos enviado un enlace de recuperación a <strong>{{ email }}</strong>
      </p>
      <p class="success-hint">Si no lo ves, revisa tu carpeta de spam</p>
      <router-link :to="{ name: 'login' }" class="btn-secondary">
        Volver al login
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from 'src/stores/auth'

const authStore = useAuthStore()
const email = ref('')
const emailSent = ref(false)

function isValidEmail(emailVal: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(emailVal)
}

async function handleReset() {
  if (!email.value || !isValidEmail(email.value)) return
  const success = await authStore.resetPassword(email.value)
  if (success) {
    emailSent.value = true
  }
}
</script>

<style lang="scss" scoped>
.forgot-page {
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
  margin-bottom: 1rem;
  color: #f87171;
  font-size: 0.875rem;
}

.forgot-form {
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
  }

  input::placeholder {
    color: var(--color-text-muted, #64748b);
  }
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
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 212, 170, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-cta {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border, #334155);
  text-align: center;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #00d4aa;
  font-weight: 500;
  text-decoration: none;
}

.back-link:hover {
  color: #00f5c4;
  text-decoration: underline;
}

.success-block {
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  color: #22c55e;
}

.success-block h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary, #f1f5f9);
  margin: 1rem 0 0.5rem;
}

.success-block p {
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
  font-size: 0.9375rem;
}

.success-hint {
  font-size: 0.8125rem !important;
  margin-top: 0.5rem !important;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding: 0.875rem 1.25rem;
  background: transparent;
  color: #00d4aa;
  border: 2px solid rgba(0, 212, 170, 0.5);
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(0, 212, 170, 0.1);
  border-color: #00d4aa;
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
