<template>
  <q-page class="profile-page">
    <div class="page-header">
      <div class="row items-center">
        <q-btn flat round icon="arrow_back" color="white" @click="$router.back()" />
        <div class="q-ml-sm"><h1>Mi perfil</h1></div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <q-card class="q-mb-md">
        <q-card-section class="text-center">
          <q-avatar size="100px" color="primary" text-color="white" class="q-mb-md">
            {{ userInitials }}
          </q-avatar>
          <h3 class="user-name">{{ authStore.user?.displayName }}</h3>
          <p class="user-email">{{ authStore.user?.email }}</p>
          <q-badge :color="roleColor" :label="roleLabel" />
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <h3 class="section-title q-mb-md">Información personal</h3>
          <q-form class="q-gutter-md" @submit.prevent="updateProfile">
            <q-input v-model="displayName" label="Nombre" outlined />
            <q-input v-model="email" label="Email" outlined disable />
            <q-btn type="submit" color="primary" label="Guardar cambios" :loading="saving" />
          </q-form>
        </q-card-section>
      </q-card>

      <q-card class="q-mt-md">
        <q-card-section>
          <h3 class="section-title q-mb-md text-negative">Zona de peligro</h3>
          <q-btn outline color="negative" label="Cerrar sesión" icon="logout" @click="logout" />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const displayName = ref('');
const email = ref('');
const saving = ref(false);

const userInitials = computed(() => (authStore.user?.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2));
const roleColor = computed(() => ({ admin: 'primary', manager: 'secondary', member: 'info', accountant: 'warning' }[authStore.user?.role || 'member']));
const roleLabel = computed(() => ({ admin: 'Administrador', manager: 'Gestor', member: 'Miembro', accountant: 'Gestoría' }[authStore.user?.role || 'member']));

async function updateProfile() {
  saving.value = true;
  const success = await authStore.updateUserProfile({ displayName: displayName.value });
  saving.value = false;
  if (success) $q.notify({ type: 'positive', message: 'Perfil actualizado' });
}

async function logout() {
  await authStore.logout();
  router.push({ name: 'login' });
}

onMounted(() => {
  displayName.value = authStore.user?.displayName || '';
  email.value = authStore.user?.email || '';
});
</script>

<style lang="scss" scoped>
.profile-page { background: var(--color-background); }
.page-content { max-width: 500px; margin: 0 auto; }
.user-name { font-size: 1.25rem; font-weight: 600; margin: 0; }
.user-email { color: var(--color-on-surface-variant); margin: 4px 0 12px; }
.section-title { font-size: 1rem; font-weight: 600; margin: 0; }
</style>
