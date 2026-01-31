<template>
  <q-page class="settings-page">
    <div class="page-header">
      <h1>Configuración</h1>
      <p class="header-subtitle">Ajustes de la aplicación</p>
    </div>

    <div class="page-content q-pa-md">
      <q-list>
        <q-item-label header>Cuenta</q-item-label>
        <q-item clickable :to="{ name: 'profile' }">
          <q-item-section avatar><q-icon name="person" /></q-item-section>
          <q-item-section><q-item-label>Mi perfil</q-item-label><q-item-label caption>Editar información personal</q-item-label></q-item-section>
          <q-item-section side><q-icon name="chevron_right" /></q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item-label header>Club</q-item-label>
        <q-item v-if="authStore.isAdmin" clickable :to="{ name: 'categories' }">
          <q-item-section avatar><q-icon name="category" /></q-item-section>
          <q-item-section><q-item-label>Categorías</q-item-label><q-item-label caption>Gestionar categorías de ingresos y gastos</q-item-label></q-item-section>
          <q-item-section side><q-icon name="chevron_right" /></q-item-section>
        </q-item>
        <q-item clickable :to="{ name: 'teams' }">
          <q-item-section avatar><q-icon name="groups" /></q-item-section>
          <q-item-section><q-item-label>Equipos</q-item-label><q-item-label caption>Gestionar equipos del club</q-item-label></q-item-section>
          <q-item-section side><q-icon name="chevron_right" /></q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item-label header>Apariencia</q-item-label>
        <q-item>
          <q-item-section avatar><q-icon name="dark_mode" /></q-item-section>
          <q-item-section><q-item-label>Modo oscuro</q-item-label></q-item-section>
          <q-item-section side><q-toggle v-model="darkMode" /></q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item-label header>Acerca de</q-item-label>
        <q-item>
          <q-item-section avatar><q-icon name="info" /></q-item-section>
          <q-item-section><q-item-label>Versión</q-item-label><q-item-label caption>1.0.0</q-item-label></q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';

const $q = useQuasar();
const authStore = useAuthStore();
const darkMode = ref($q.dark.isActive);

watch(darkMode, (val) => { $q.dark.set(val); });
</script>

<style lang="scss" scoped>
.settings-page { background: var(--color-background); }
.page-content { max-width: 600px; margin: 0 auto; }
</style>
