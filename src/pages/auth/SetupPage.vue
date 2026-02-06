<template>
  <div class="setup-container">
    <q-card class="setup-card">
      <!-- Header -->
      <q-card-section class="text-center">
        <div class="brand-logo q-mb-sm">
          <q-icon name="sports_soccer" size="40px" color="primary" />
        </div>
        <h2 class="setup-title">¡Bienvenido a Grootter Finance!</h2>
        <p class="setup-subtitle">
          Hola <strong>{{ authStore.user?.displayName }}</strong>, configura tu cuenta para continuar.
        </p>
      </q-card-section>

      <q-separator />

      <!-- Step: Choose path -->
      <q-card-section v-if="step === 'choose'">
        <div class="options-grid">
          <!-- Option: Create Club -->
          <button
            v-if="registrationOpen"
            class="option-card"
            @click="step = 'create'"
          >
            <q-icon name="add_business" size="48px" color="primary" />
            <h3>Crear un club nuevo</h3>
            <p>Soy administrador y quiero registrar mi club</p>
          </button>

          <!-- Option: Join via invitation -->
          <button class="option-card" @click="step = 'join'">
            <q-icon name="group_add" size="48px" color="teal" />
            <h3>Unirme a un club</h3>
            <p>Tengo una invitación de un club existente</p>
          </button>
        </div>

        <div v-if="!registrationOpen" class="q-mt-md">
          <q-banner class="bg-orange-1 text-orange-9" rounded>
            <template #avatar><q-icon name="info" color="orange" /></template>
            El registro de nuevos clubes está cerrado. Solo puedes unirte mediante invitación.
          </q-banner>
        </div>
      </q-card-section>

      <!-- Step: Create Club -->
      <q-card-section v-if="step === 'create'">
        <q-btn
          flat
          dense
          icon="arrow_back"
          label="Volver"
          class="q-mb-md"
          @click="step = 'choose'"
        />

        <h3 class="step-title">Crear tu club</h3>
        <p class="step-description">
          Serás el administrador del club con acceso completo.
        </p>

        <q-form class="setup-form" @submit.prevent="handleCreateClub">
          <q-input
            v-model="clubName"
            label="Nombre del club"
            outlined
            autofocus
            :rules="[val => !!val || 'Nombre del club requerido']"
          >
            <template #prepend>
              <q-icon name="sports_soccer" />
            </template>
          </q-input>

          <q-banner v-if="authStore.error" class="bg-negative text-white q-mb-md" rounded>
            {{ authStore.error }}
          </q-banner>

          <q-btn
            type="submit"
            color="primary"
            label="Crear club"
            class="full-width"
            size="lg"
            :loading="authStore.loading"
          />
        </q-form>
      </q-card-section>

      <!-- Step: Join Club -->
      <q-card-section v-if="step === 'join'">
        <q-btn
          flat
          dense
          icon="arrow_back"
          label="Volver"
          class="q-mb-md"
          @click="step = 'choose'"
        />

        <h3 class="step-title">Unirte a un club</h3>
        <p class="step-description">
          Introduce tu email para buscar invitaciones pendientes.
        </p>

        <q-form class="setup-form" @submit.prevent="handleJoinClub">
          <q-input
            v-model="inviteEmail"
            label="Tu email"
            outlined
            type="email"
            :rules="[val => !!val || 'Email requerido']"
            @blur="searchInvitation"
          >
            <template #prepend>
              <q-icon name="email" />
            </template>
            <template v-if="searching" #append>
              <q-spinner size="18px" />
            </template>
          </q-input>

          <q-banner v-if="foundInvitation" class="bg-blue-1 text-blue-9 q-mb-md" rounded>
            <template #avatar><q-icon name="celebration" color="blue" /></template>
            Invitación encontrada de <strong>{{ foundInvitation.invitedByName }}</strong>
            · Rol: <strong>{{ foundInvitation.role }}</strong>
          </q-banner>

          <q-banner v-if="searchDone && !foundInvitation" class="bg-orange-1 text-orange-9 q-mb-md" rounded>
            <template #avatar><q-icon name="search_off" color="orange" /></template>
            No se encontraron invitaciones para este email.
          </q-banner>

          <q-banner v-if="authStore.error" class="bg-negative text-white q-mb-md" rounded>
            {{ authStore.error }}
          </q-banner>

          <q-btn
            type="submit"
            color="teal"
            label="Unirme al club"
            class="full-width"
            size="lg"
            :loading="authStore.loading"
            :disable="!foundInvitation"
          />
        </q-form>
      </q-card-section>

      <q-separator />

      <!-- Footer -->
      <q-card-section class="text-center">
        <q-btn
          flat
          color="grey"
          label="Cerrar sesión"
          icon="logout"
          @click="handleLogout"
        />
      </q-card-section>
    </q-card>
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

  // If no registration open and only join, skip to join step
  if (!registrationOpen.value) {
    // Auto-search invitation if email exists
    if (inviteEmail.value) {
      searchInvitation()
    }
  }
})
</script>

<style lang="scss" scoped>
.setup-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.setup-card {
  width: 100%;
  max-width: 520px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 8px;
}

.brand-logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #1a3a5c));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;

  .q-icon {
    color: white;
  }
}

.setup-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 12px 0 4px;
  color: var(--color-text-primary, #1a1a2e);
}

.setup-subtitle {
  color: var(--color-text-secondary, #666);
  margin: 0;
  font-size: 0.95rem;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.option-card {
  background: white;
  border: 2px solid var(--color-border, #e0e0e0);
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary, #635bff);
    background: #f8f7ff;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 12px 0 4px;
    color: var(--color-text-primary, #1a1a2e);
  }

  p {
    font-size: 0.825rem;
    color: var(--color-text-secondary, #666);
    margin: 0;
  }
}

.step-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--color-text-primary, #1a1a2e);
}

.step-description {
  color: var(--color-text-secondary, #666);
  margin: 0 0 20px;
  font-size: 0.9rem;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
