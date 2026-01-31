<template>
  <q-page class="forecasts-page">
    <div class="page-header"><div class="row items-center justify-between"><div><h1>Previsiones</h1><p class="header-subtitle">Comparativa con datos históricos</p></div><q-btn color="white" text-color="primary" icon="auto_fix_high" label="Generar desde histórico" @click="generate" /></div></div>
    <div class="page-content q-pa-md">
      <q-card class="q-mb-md">
        <q-card-section>
          <h3 class="section-title q-mb-md">Previsiones {{ selectedYear }}</h3>
          <q-select v-model="selectedYear" :options="[2026, 2025, 2024]" label="Año" outlined dense class="q-mb-md" style="max-width: 150px" />
          <p v-if="forecasts.length === 0" class="text-grey-6">No hay previsiones para este año. Genera previsiones basadas en datos históricos.</p>
          <q-list v-else separator>
            <q-item v-for="f in forecasts" :key="f.id">
              <q-item-section><q-item-label>{{ f.categoryId }} - {{ getMonthName(f.month) }}</q-item-label><q-item-label caption>{{ f.source === 'historical' ? 'Basado en histórico' : 'Manual' }}</q-item-label></q-item-section>
              <q-item-section side><span :class="f.type === 'income' ? 'text-positive' : 'text-negative'">{{ formatCurrency(f.amount) }}</span></q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useStatisticsStore } from 'src/stores/statistics';
const $q = useQuasar();
const statisticsStore = useStatisticsStore();
const selectedYear = ref(2026);
const forecasts = computed(() => statisticsStore.forecasts.filter(f => f.year === selectedYear.value));
const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
function getMonthName(m: number) { return monthNames[m - 1]; }
function formatCurrency(v: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v); }
async function generate() { await statisticsStore.generateHistoricalForecasts(selectedYear.value); $q.notify({ type: 'positive', message: 'Previsiones generadas' }); }
onMounted(() => { statisticsStore.fetchForecasts(selectedYear.value); });
</script>
<style lang="scss" scoped>.forecasts-page { background: var(--color-background); }.page-content { max-width: 800px; margin: 0 auto; }.section-title { font-size: 1rem; font-weight: 600; margin: 0; }</style>
