<template>
  <div class="forgot-card animate-fade-in">
    <q-card class="auth-card">
      <q-card-section>
        <h2 class="auth-title">Recuperar contraseña</h2>
        <p class="auth-subtitle">Te enviaremos un enlace para restablecer tu contraseña</p>
      </q-card-section>

      <q-card-section>
        <template v-if="!emailSent">
          <q-form class="auth-form" @submit.prevent="handleReset">
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

            <q-banner v-if="authStore.error" class="bg-negative text-white q-mb-md" rounded>
              {{ authStore.error }}
            </q-banner>

            <q-btn
              type="submit"
              color="primary"
              label="Enviar enlace"
              class="full-width btn-primary"
              size="lg"
              :loading="authStore.loading"
            />
          </q-form>
        </template>

        <template v-else>
          <div class="success-message">
            <q-icon name="mark_email_read" size="64px" color="positive" />
            <h3>¡Email enviado!</h3>
            <p>
              Hemos enviado un enlace de recuperación a
              <strong>{{ email }}</strong>
            </p>
            <p class="text-caption">
              Si no lo ves, revisa tu carpeta de spam
            </p>
            <q-btn
              color="primary"
              label="Volver al login"
              :to="{ name: 'login' }"
              outline
              class="q-mt-md"
            />
          </div>
        </template>
      </q-card-section>

      <template v-if="!emailSent">
        <q-separator />

        <q-card-section class="text-center">
          <router-link :to="{ name: 'login' }" class="back-link">
            <q-icon name="arrow_back" size="18px" />
            Volver al login
          </router-link>
        </q-card-section>
      </template>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'src/stores/auth';

const authStore = useAuthStore();

const email = ref('');
const emailSent = ref(false);

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

async function handleReset() {
  const success = await authStore.resetPassword(email.value);
  if (success) {
    emailSent.value = true;
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

.success-message {
  text-align: center;
  padding: 24px 0;

  h3 {
    color: var(--color-positive);
    margin-top: 16px;
    margin-bottom: 8px;
  }

  p {
    color: var(--color-on-surface-variant);
    margin: 0;
  }
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

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
