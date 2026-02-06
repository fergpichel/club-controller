<template>
  <div class="setup-container">
    <div class="setup-content animate-in">
      <!-- Brand -->
      <div class="brand-section">
        <div class="brand-logo">
          <q-icon name="sports_soccer" size="32px" />
        </div>
        <h1 class="brand-name">Grootter Finance</h1>
        <p class="brand-tagline">Configura tu cuenta para continuar</p>
      </div>

      <!-- Setup Card -->
      <div class="setup-card">
        <!-- Step: Choose path -->
        <template v-if="step === 'choose'">
          <div class="card-header">
            <h2>¡Bienvenido!</h2>
            <p>
              Hola <strong>{{ authStore.user?.displayName }}</strong>, ¿qué deseas hacer?
            </p>
          </div>

          <div class="options-section">
            <div class="options-grid">
              <!-- Option: Create Club -->
              <button
                v-if="registrationOpen"
                class="option-card"
                @click="step = 'create'"
              >
                <div class="option-icon option-icon--brand">
                  <q-icon name="add_business" size="28px" />
                </div>
                <h3>Crear un club nuevo</h3>
                <p>Soy administrador y quiero registrar mi club</p>
              </button>

              <!-- Option: Join via invitation -->
              <button class="option-card" @click="step = 'join'">
                <div class="option-icon option-icon--teal">
                  <q-icon name="group_add" size="28px" />
                </div>
                <h3>Unirme a un club</h3>
                <p>Tengo una invitación de un club existente</p>
              </button>
            </div>

            <transition name="slide-fade">
              <div v-if="!registrationOpen" class="info-banner info-banner--warning">
                <q-icon name="info" size="20px" />
                <span>El registro de nuevos clubes está cerrado. Solo puedes unirte mediante invitación.</span>
              </div>
            </transition>
          </div>
        </template>

        <!-- Step: Create Club -->
        <template v-if="step === 'create'">
          <div class="card-header">
            <button class="back-btn" @click="step = 'choose'">
              <q-icon name="arrow_back" size="18px" />
              <span>Volver</span>
            </button>
            <h2>Crear tu club</h2>
            <p>Serás el administrador del club con acceso completo.</p>
          </div>

          <q-form class="setup-form" @submit.prevent="handleCreateClub">
            <div class="input-group">
              <label>Nombre del club</label>
              <div class="input-wrapper">
                <q-icon name="sports_soccer" size="18px" class="input-icon" />
                <input
                  v-model="clubName"
                  type="text"
                  placeholder="Mi Club Deportivo"
                  required
                  autofocus
                />
              </div>
            </div>

            <transition name="slide-fade">
              <div v-if="authStore.error" class="error-banner">
                <q-icon name="error" size="18px" />
                <span>{{ authStore.error }}</span>
              </div>
            </transition>

            <button type="submit" class="primary-btn" :disabled="authStore.loading || !clubName">
              <span v-if="!authStore.loading">Crear club</span>
              <q-spinner v-else color="white" size="20px" />
            </button>
          </q-form>
        </template>

        <!-- Step: Join Club -->
        <template v-if="step === 'join'">
          <div class="card-header">
            <button class="back-btn" @click="step = 'choose'">
              <q-icon name="arrow_back" size="18px" />
              <span>Volver</span>
            </button>
            <h2>Unirte a un club</h2>
            <p>Introduce tu email para buscar invitaciones pendientes.</p>
          </div>

          <q-form class="setup-form" @submit.prevent="handleJoinClub">
            <div class="input-group">
              <label>Tu email</label>
              <div class="input-wrapper">
                <q-icon name="email" size="18px" class="input-icon" />
                <input
                  v-model="inviteEmail"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  @blur="searchInvitation"
                />
                <q-spinner v-if="searching" size="18px" class="input-spinner" />
              </div>
            </div>

            <transition name="slide-fade">
              <div v-if="foundInvitation" class="info-banner info-banner--success">
                <q-icon name="celebration" size="20px" />
                <span>
                  Invitación encontrada de <strong>{{ foundInvitation.invitedByName }}</strong>
                  · Rol: <strong>{{ foundInvitation.role }}</strong>
                </span>
              </div>
            </transition>

            <transition name="slide-fade">
              <div v-if="searchDone && !foundInvitation" class="info-banner info-banner--warning">
                <q-icon name="search_off" size="20px" />
                <span>No se encontraron invitaciones para este email.</span>
              </div>
            </transition>

            <transition name="slide-fade">
              <div v-if="authStore.error" class="error-banner">
                <q-icon name="error" size="18px" />
                <span>{{ authStore.error }}</span>
              </div>
            </transition>

            <button
              type="submit"
              class="primary-btn primary-btn--teal"
              :disabled="authStore.loading || !foundInvitation"
            >
              <span v-if="!authStore.loading">Unirme al club</span>
              <q-spinner v-else color="white" size="20px" />
            </button>
          </q-form>
        </template>

        <!-- Footer -->
        <div class="card-footer">
          <button class="logout-btn" @click="handleLogout">
            <q-icon name="logout" size="18px" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <p class="setup-footer">© 2026 Grootter Finance. Todos los derechos reservados.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from 'src/boot/firebase'
import type { ClubInvitation } from 'src/types'
import { logger } from 'src/utils/logger'

const router = useRouter()
const authStore = useAuthStore()

const step = ref<'choose' | 'create' | 'join'>('choose')
const clubName = ref('')
const inviteEmail = ref(authStore.user?.email || '')
const searching = ref(false)
const searchDone = ref(false)
const foundInvitation = ref<ClubInvitation | null>(null)
const registrationOpen = ref(false)

async function handleCreateClub() {
  if (!clubName.value) return
  const success = await authStore.completeSetup(clubName.value)
  if (success) {
    router.push({ name: 'dashboard' })
  }
}

async function searchInvitation() {
  if (!inviteEmail.value) return
  searching.value = true
  searchDone.value = false
  try {
    foundInvitation.value = await authStore.checkInvitation(inviteEmail.value)
  } finally {
    searching.value = false
    searchDone.value = true
  }
}

async function handleJoinClub() {
  if (!foundInvitation.value) return
  const success = await authStore.completeSetupWithInvitation(foundInvitation.value)
  if (success) {
    router.push({ name: 'dashboard' })
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}

onMounted(async () => {
  // Pre-fill email
  if (authStore.user?.email) {
    inviteEmail.value = authStore.user.email
  }

  // Check registration status
  try {
    const configDoc = await getDoc(doc(db, 'config', 'app'))
    if (configDoc.exists()) {
      registrationOpen.value = configDoc.data().registrationOpen === true
    } else {
      registrationOpen.value = true
    }
  } catch (e) {
    logger.error('Error loading config:', e)
    registrationOpen.value = true
  }

  // If no registration open, auto-search invitation
  if (!registrationOpen.value && inviteEmail.value) {
    searchInvitation()
  }
})
</script>

<style lang="scss" scoped>
.setup-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.setup-content {
  width: 100%;
  max-width: 480px;
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
.setup-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
}

.card-header {
  padding: var(--space-8) var(--space-6) var(--space-5);

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

    strong {
      color: var(--color-text-primary);
      font-weight: 600;
    }
  }
}

// Back button
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  margin-bottom: var(--space-4);
  transition: color var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--color-accent);
  }
}

// Options
.options-section {
  padding: 0 var(--space-6) var(--space-6);
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.option-card {
  background: var(--color-bg-tertiary);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6) var(--space-4);
  text-align: center;
  cursor: pointer;
  font-family: inherit;
  transition: all var(--duration-normal) var(--ease-out);

  &:hover {
    border-color: var(--color-accent);
    background: var(--color-bg-secondary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-card-hover);
  }

  h3 {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    margin: var(--space-3) 0 var(--space-1);
    color: var(--color-text-primary);
  }

  p {
    font-size: 0.8125rem;
    color: var(--color-text-tertiary);
    margin: 0;
    line-height: 1.4;
  }
}

.option-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: white;

  &--brand {
    background: var(--gradient-accent);
    box-shadow: 0 4px 12px rgba(99, 91, 255, 0.3);
  }

  &--teal {
    background: linear-gradient(135deg, #00D4AA 0%, #00F5C4 100%);
    box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
  }
}

// Form
.setup-form {
  padding: 0 var(--space-6) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

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

  .input-spinner {
    flex-shrink: 0;
    color: var(--color-accent);
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
    min-width: 0;

    &::placeholder {
      color: var(--color-text-muted);
    }
  }
}

// Banners
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.4;

  .q-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }

  &--success {
    background: var(--color-success-bg);
    color: var(--color-success-dark);
  }

  &--warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-dark);
  }
}

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

// Buttons
.primary-btn {
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
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--teal {
    background: var(--gradient-success);
    box-shadow: 0 4px 14px rgba(0, 212, 170, 0.35);

    &:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(0, 212, 170, 0.4);
    }
  }
}

// Footer
.card-footer {
  padding: var(--space-4) var(--space-6);
  background: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: center;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--color-danger);
    background: var(--color-danger-bg);
  }
}

.setup-footer {
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
