<template>
  <div class="register-page">
    <div class="form-header">
      <h1>Crear cuenta</h1>
      <p>
        {{ pendingInvitation
          ? `Has sido invitado a unirte a ${pendingInvitation.clubName}`
          : registrationOpen
            ? 'Registra tu club y comienza a gestionar sus finanzas'
            : 'El registro está disponible solo por invitación'
        }}
      </p>
    </div>

    <!-- Registration closed banner -->
    <div v-if="!registrationOpen && !pendingInvitation && !loadingConfig" class="banner banner-warning">
      <q-icon name="lock" size="20px" />
      <div>
        <strong>Registro cerrado</strong>
        <p>
          Para unirte, pide a un administrador que te envíe una invitación.
          Si tienes una, introduce tu email abajo y se detectará automáticamente.
        </p>
      </div>
    </div>

    <!-- Invitation Banner -->
    <div v-if="pendingInvitation" class="banner banner-info">
      <q-icon name="celebration" size="20px" />
      <span>
        Invitación de <strong>{{ pendingInvitation.invitedByName }}</strong>
        · Rol: <strong>{{ roleLabel(pendingInvitation.role) }}</strong>
      </span>
    </div>

    <transition name="slide-fade">
      <div v-if="authStore.error" class="error-banner">
        <q-icon name="error" size="18px" />
        <span>{{ authStore.error }}</span>
      </div>
    </transition>

    <q-form class="register-form" @submit.prevent="handleRegister">
      <div class="input-group">
        <label for="reg-name">Nombre completo</label>
        <div class="input-wrapper" :class="{ focused: displayName }">
          <q-icon name="person" size="18px" class="input-icon" />
          <input
            id="reg-name"
            v-model="displayName"
            type="text"
            placeholder="Tu nombre"
            autocomplete="name"
            required
          />
        </div>
      </div>

      <div class="input-group">
        <label for="reg-email">Email</label>
        <div class="input-wrapper" :class="{ focused: email }">
          <q-icon name="mail" size="18px" class="input-icon" />
          <input
            id="reg-email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            autocomplete="email"
            required
            @blur="checkForInvitation"
          />
          <span v-if="checkingInvitation" class="input-append">
            <q-spinner size="18px" />
          </span>
        </div>
      </div>

      <div v-if="!pendingInvitation && registrationOpen" class="input-group">
        <label for="reg-club">Nombre del club</label>
        <div class="input-wrapper" :class="{ focused: clubName }">
          <q-icon name="sports_soccer" size="18px" class="input-icon" />
          <input
            id="reg-club"
            v-model="clubName"
            type="text"
            placeholder="Nombre de tu club"
          />
        </div>
      </div>

      <div class="input-group">
        <label for="reg-password">Contraseña</label>
        <div class="input-wrapper" :class="{ focused: password }">
          <q-icon name="lock" size="18px" class="input-icon" />
          <input
            id="reg-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mínimo 8 caracteres, mayúscula, número y símbolo"
            autocomplete="new-password"
            required
          />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword" tabindex="-1">
            <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" size="18px" />
          </button>
        </div>
      </div>

      <div class="input-group">
        <label for="reg-confirm">Confirmar contraseña</label>
        <div class="input-wrapper" :class="{ focused: confirmPassword, error: confirmPassword && password !== confirmPassword }">
          <q-icon name="lock" size="18px" class="input-icon" />
          <input
            id="reg-confirm"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Repite la contraseña"
            autocomplete="new-password"
            required
          />
        </div>
        <span v-if="confirmPassword && password !== confirmPassword" class="field-error">Las contraseñas no coinciden</span>
      </div>

      <label class="terms-checkbox">
        <input v-model="acceptTerms" type="checkbox" />
        <span class="checkmark"></span>
        <span class="terms-text">
          Acepto los <a href="#" @click.prevent>términos y condiciones</a>
          y la <a href="#" @click.prevent>política de privacidad</a>
        </span>
      </label>

      <button
        type="submit"
        class="btn-primary"
        :disabled="!acceptTerms || (!registrationOpen && !pendingInvitation) || authStore.loading"
      >
        <q-spinner v-if="authStore.loading" color="white" size="20px" />
        <template v-else>
          <span>{{ pendingInvitation ? 'Unirme al club' : 'Crear cuenta' }}</span>
          <q-icon name="arrow_forward" size="18px" />
        </template>
      </button>
    </q-form>

    <div class="auth-cta">
      <span>¿Ya tienes cuenta?</span>
      <router-link :to="{ name: 'login' }">Iniciar sesión</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from 'src/boot/firebase'
import type { ClubInvitation, UserRole } from 'src/types'
import { ROLE_LABELS } from 'src/types'
import { logger } from 'src/utils/logger'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const displayName = ref('')
const email = ref('')
const clubName = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const acceptTerms = ref(false)
const pendingInvitation = ref<ClubInvitation | null>(null)
const checkingInvitation = ref(false)
const registrationOpen = ref(true)
const loadingConfig = ref(true)

function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || role
}

function isValidEmail(emailVal: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(emailVal)
}

async function checkForInvitation() {
  if (!email.value || !isValidEmail(email.value)) return
  checkingInvitation.value = true
  try {
    pendingInvitation.value = await authStore.checkInvitation(email.value)
  } finally {
    checkingInvitation.value = false
  }
}

async function handleRegister() {
  if (password.value !== confirmPassword.value) return
  if (!acceptTerms.value) return
  if (!registrationOpen.value && !pendingInvitation.value) return

  try {
    let success: boolean

    if (pendingInvitation.value) {
      success = await authStore.registerWithInvitation(
        email.value,
        password.value,
        displayName.value,
        pendingInvitation.value
      )
    } else {
      if (!clubName.value) return
      success = await authStore.register(
        email.value,
        password.value,
        displayName.value,
        '',
        'admin',
        clubName.value
      )
    }

    if (success) {
      router.push({ name: 'dashboard' })
    }
  } catch (error) {
    logger.error('Error during registration:', error)
  }
}

async function loadAppConfig() {
  loadingConfig.value = true
  try {
    const configDoc = await getDoc(doc(db, 'config', 'app'))
    if (configDoc.exists()) {
      registrationOpen.value = configDoc.data().registrationOpen === true
    } else {
      registrationOpen.value = true
    }
  } catch (e) {
    logger.error('Error loading app config:', e)
    registrationOpen.value = false
  } finally {
    loadingConfig.value = false
  }
}

onMounted(() => {
  loadAppConfig()
  const inviteEmail = route.query.email as string
  if (inviteEmail) {
    email.value = inviteEmail
    checkForInvitation()
  }
})
</script>

<style lang="scss" scoped>
.register-page {
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

.banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.banner-warning {
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.25);
  color: #fb923c;
}

.banner-warning p {
  margin: 0.25rem 0 0;
  opacity: 0.95;
}

.banner-info {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: #93c5fd;
  margin-bottom: 1rem;
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

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

  &.error {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05)) padding-box,
                linear-gradient(135deg, #ef4444, #f87171) border-box;
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
    padding: 0.875rem 1rem 0.875rem 2.75rem;
    background: transparent;
    border: none;
    font-size: 0.9375rem;
    color: var(--color-text-primary, #f1f5f9);
    outline: none;
  }

  input::placeholder {
    color: var(--color-text-muted, #64748b);
  }

  .input-append {
    position: absolute;
    right: 1rem;
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
  }

  .toggle-password:hover {
    color: var(--color-text-primary, #f1f5f9);
    background: rgba(255, 255, 255, 0.05);
  }
}

.field-error {
  font-size: 0.75rem;
  color: #f87171;
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #cbd5e1);
  cursor: pointer;
  user-select: none;
}

.terms-checkbox input {
  display: none;
}

.terms-checkbox .checkmark {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  border: 2px solid var(--color-border, #334155);
  border-radius: 4px;
  position: relative;
  transition: all 0.2s;
}

.terms-checkbox input:checked + .checkmark {
  background: #00d4aa;
  border-color: #00d4aa;
}

.terms-checkbox input:checked + .checkmark::after {
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

.terms-text a {
  color: #00d4aa;
  text-decoration: none;
}

.terms-text a:hover {
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
