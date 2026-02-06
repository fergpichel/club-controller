<template>
  <div class="register-card animate-fade-in">
    <q-card class="auth-card">
      <q-card-section>
        <h2 class="auth-title">Crear cuenta</h2>
        <p class="auth-subtitle">
          {{ pendingInvitation
            ? `Has sido invitado a unirte a ${pendingInvitation.clubName}`
            : registrationOpen
              ? 'Registra tu club y comienza a gestionar sus finanzas'
              : 'El registro está disponible solo por invitación'
          }}
        </p>
      </q-card-section>

      <!-- Registration closed banner -->
      <q-card-section v-if="!registrationOpen && !pendingInvitation && !loadingConfig">
        <q-banner class="bg-orange-1 text-orange-9 q-mb-md" rounded>
          <template #avatar><q-icon name="lock" color="orange" /></template>
          <div>
            <strong>Registro cerrado</strong>
            <p class="q-mb-none q-mt-xs" style="font-size: 0.85rem">
              Para unirte, pide a un administrador que te envíe una invitación.
              Si tienes una, introduce tu email abajo y se detectará automáticamente.
            </p>
          </div>
        </q-banner>
      </q-card-section>

      <q-card-section>
        <!-- Invitation Banner -->
        <q-banner v-if="pendingInvitation" class="bg-blue-1 text-blue-9 q-mb-md" rounded>
          <template #avatar><q-icon name="celebration" color="blue" /></template>
          Invitación de <strong>{{ pendingInvitation.invitedByName }}</strong>
          · Rol: <strong>{{ roleLabel(pendingInvitation.role) }}</strong>
        </q-banner>

        <q-form class="auth-form" @submit.prevent="handleRegister">
          <q-input
            v-model="displayName"
            label="Nombre completo"
            outlined
            :rules="[val => !!val || 'Nombre requerido']"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="email"
            type="email"
            label="Email"
            outlined
            :rules="[val => !!val || 'Email requerido', val => isValidEmail(val) || 'Email inválido']"
            @blur="checkForInvitation"
          >
            <template #prepend>
              <q-icon name="email" />
            </template>
            <template v-if="checkingInvitation" #append>
              <q-spinner size="18px" />
            </template>
          </q-input>

          <!-- Only show club name when creating a new club (no invitation, registration open) -->
          <q-input
            v-if="!pendingInvitation && registrationOpen"
            v-model="clubName"
            label="Nombre del club"
            outlined
            :rules="[val => !pendingInvitation && !val ? 'Nombre del club requerido' : true]"
          >
            <template #prepend>
              <q-icon name="sports_soccer" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Contraseña"
            outlined
            :rules="[
              val => !!val || 'Contraseña requerida',
              val => val.length >= 8 || 'Mínimo 8 caracteres',
              val => /[A-Z]/.test(val) || 'Debe incluir al menos una mayúscula',
              val => /[0-9]/.test(val) || 'Debe incluir al menos un número',
              val => /[^A-Za-z0-9]/.test(val) || 'Debe incluir al menos un carácter especial'
            ]"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            label="Confirmar contraseña"
            outlined
            :rules="[
              val => !!val || 'Confirma la contraseña',
              val => val === password || 'Las contraseñas no coinciden'
            ]"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-checkbox
            v-model="acceptTerms"
            class="q-mb-md"
          >
            <span class="terms-text">
              Acepto los <a href="#" @click.prevent>términos y condiciones</a>
              y la <a href="#" @click.prevent>política de privacidad</a>
            </span>
          </q-checkbox>

          <q-banner v-if="authStore.error" class="bg-negative text-white q-mb-md" rounded>
            {{ authStore.error }}
          </q-banner>

          <q-btn
            type="submit"
            color="primary"
            :label="pendingInvitation ? 'Unirme al club' : 'Crear cuenta'"
            class="full-width btn-primary"
            size="lg"
            :loading="authStore.loading"
            :disable="!acceptTerms || (!registrationOpen && !pendingInvitation)"
          />
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-section class="text-center">
        <p class="q-mb-none">
          ¿Ya tienes cuenta?
          <router-link :to="{ name: 'login' }" class="login-link">
            Inicia sesión
          </router-link>
        </p>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import type { ClubInvitation, UserRole } from 'src/types';
import { ROLE_LABELS } from 'src/types';
import { logger } from 'src/utils/logger'

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const displayName = ref('');
const email = ref('');
const clubName = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const acceptTerms = ref(false);
const pendingInvitation = ref<ClubInvitation | null>(null);
const checkingInvitation = ref(false);
const registrationOpen = ref(true); // default open until config loads
const loadingConfig = ref(true);

function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || role
}

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
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
  if (password.value !== confirmPassword.value) return;
  if (!acceptTerms.value) return;

  // Block if registration closed and no invitation
  if (!registrationOpen.value && !pendingInvitation.value) return;

  try {
    let success: boolean

    if (pendingInvitation.value) {
      // Register as invited member — join existing club
      success = await authStore.registerWithInvitation(
        email.value,
        password.value,
        displayName.value,
        pendingInvitation.value
      )
    } else {
      // Create new club + register as admin (only if registration is open)
      if (!clubName.value) return

      // Club will be created AFTER auth user is created (inside register())
      // This ensures Firestore rules (isAuth()) are satisfied
      success = await authStore.register(
        email.value,
        password.value,
        displayName.value,
        '',        // no existing clubId
        'admin',
        clubName.value  // newClubName — triggers club creation post-auth
      );
    }

    if (success) {
      router.push({ name: 'dashboard' });
    }
  } catch (error) {
    logger.error('Error during registration:', error);
  }
}

async function loadAppConfig() {
  loadingConfig.value = true
  try {
    const configDoc = await getDoc(doc(db, 'config', 'app'))
    if (configDoc.exists()) {
      registrationOpen.value = configDoc.data().registrationOpen === true
    } else {
      // If config doc doesn't exist yet, allow registration (first-time setup)
      registrationOpen.value = true
    }
  } catch (e) {
    logger.error('Error loading app config:', e)
    // Default to closed if we can't read config (safer)
    registrationOpen.value = false
  } finally {
    loadingConfig.value = false
  }
}

onMounted(() => {
  loadAppConfig()

  // Pre-fill email from query param (e.g. from invitation link)
  const inviteEmail = route.query.email as string
  if (inviteEmail) {
    email.value = inviteEmail
    checkForInvitation()
  }
})
</script>

<style lang="scss" scoped>
.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 16px;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--color-primary);
}

.auth-subtitle {
  color: var(--color-on-surface-variant);
  margin: 0;
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.terms-text {
  font-size: 0.875rem;
  color: var(--color-on-surface-variant);
}

.login-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>



