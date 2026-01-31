<template>
  <div class="register-card animate-fade-in">
    <q-card class="auth-card">
      <q-card-section>
        <h2 class="auth-title">Crear cuenta</h2>
        <p class="auth-subtitle">Registra tu club y comienza a gestionar sus finanzas</p>
      </q-card-section>

      <q-card-section>
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
          >
            <template #prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="clubName"
            label="Nombre del club"
            outlined
            :rules="[val => !!val || 'Nombre del club requerido']"
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
              val => val.length >= 6 || 'Mínimo 6 caracteres'
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
            label="Crear cuenta"
            class="full-width btn-primary"
            size="lg"
            :loading="authStore.loading"
            :disable="!acceptTerms"
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from 'src/boot/firebase';

const router = useRouter();
const authStore = useAuthStore();

const displayName = ref('');
const email = ref('');
const clubName = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const acceptTerms = ref(false);

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

async function handleRegister() {
  if (password.value !== confirmPassword.value) return;
  if (!acceptTerms.value) return;

  try {
    // First create the club
    const clubRef = await addDoc(collection(db, 'clubs'), {
      name: clubName.value,
      createdAt: serverTimestamp(),
      settings: {
        currency: 'EUR',
        fiscalYearStart: 1,
        categories: [],
        defaultTeams: []
      }
    });

    // Then register the user as admin of that club
    const success = await authStore.register(
      email.value,
      password.value,
      displayName.value,
      clubRef.id,
      'admin'
    );

    if (success) {
      router.push({ name: 'dashboard' });
    }
  } catch (error) {
    console.error('Error during registration:', error);
  }
}
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
  
  a {
    color: var(--color-primary);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.login-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    text-decoration: underline;
  }
}

:deep(.q-field) {
  .q-field__control {
    border-radius: 12px;
  }
}

:deep(.q-btn) {
  border-radius: 12px;
  font-weight: 600;
}
</style>
