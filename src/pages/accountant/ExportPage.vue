<template>
  <q-page class="export-page">
    <div class="page-header accountant-header"><div class="row items-center"><q-btn flat round icon="arrow_back" color="white" @click="$router.back()" /><h1 class="q-ml-sm">Exportar datos</h1></div></div>
    <div class="page-content q-pa-md">
      <q-card>
        <q-card-section>
          <h3 class="section-title q-mb-md">Exportar transacciones</h3>
          <q-form class="q-gutter-md">
            <q-select v-model="year" :options="[2026, 2025, 2024]" label="Año" outlined />
            <q-select v-model="format" :options="['Excel', 'CSV', 'PDF']" label="Formato" outlined />
            <q-btn color="primary" icon="download" label="Descargar" @click="download" />
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
const $q = useQuasar();
const year = ref(2026);
const format = ref('Excel');
function download() { $q.notify({ type: 'info', message: `Descargando datos de ${year.value} en formato ${format.value}...` }); }
</script>
<style lang="scss" scoped>.export-page { background: var(--color-background); }.accountant-header { background: linear-gradient(135deg, #37474F 0%, #607D8B 100%); }.page-content { max-width: 600px; margin: 0 auto; }.section-title { font-size: 1rem; font-weight: 600; margin: 0; }</style>
