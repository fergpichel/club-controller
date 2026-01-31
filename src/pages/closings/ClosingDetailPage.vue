<template>
  <q-page class="closing-detail-page">
    <div class="page-header"><div class="row items-center"><q-btn flat round icon="arrow_back" color="white" @click="$router.back()" /><h1 class="q-ml-sm">Detalle de cierre</h1></div></div>
    <div class="page-content q-pa-md"><p>Detalle del cierre de {{ year }}/{{ month }}.</p></div>
  </q-page>
</template>
<script setup lang="ts">const props = defineProps<{ year?: string; month?: string }>();const year = props.year;const month = props.month;</script>
<style scoped>.closing-detail-page { background: var(--color-background); }.page-content { max-width: 800px; margin: 0 auto; }</style>
