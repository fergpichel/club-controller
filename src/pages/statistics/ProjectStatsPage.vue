<template>
  <q-page class="project-stats-page">
    <div class="page-header"><div class="row items-center"><q-btn flat round icon="arrow_back" color="white" @click="$router.back()" /><h1 class="q-ml-sm">Estadísticas de proyecto</h1></div></div>
    <div class="page-content q-pa-md"><p>Estadísticas detalladas del proyecto seleccionado.</p></div>
  </q-page>
</template>
<script setup lang="ts">defineProps<{ id?: string }>();</script>
<style scoped>.project-stats-page { background: var(--color-background); }.page-content { max-width: 800px; margin: 0 auto; }</style>
