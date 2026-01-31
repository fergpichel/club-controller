<template>
  <q-page class="profitability-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <p class="header-eyebrow">Análisis financiero</p>
          <h1>Rentabilidad por equipo</h1>
          <p class="header-subtitle">
            ¿Son sostenibles las cuotas? ¿Qué equipos necesitan atención?
          </p>
        </div>
        <div class="header-right">
          <q-btn
            color="white"
            text-color="primary"
            icon="refresh"
            label="Actualizar"
            no-caps
            @click="refreshData"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="page-content">
      <TeamProfitabilityDashboard ref="dashboardRef" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TeamProfitabilityDashboard from 'src/components/TeamProfitabilityDashboard.vue'

const dashboardRef = ref<InstanceType<typeof TeamProfitabilityDashboard> | null>(null)

function refreshData() {
  // The dashboard will reload data on mount, so we can trigger a re-render
  // In production, this would call a refresh method on the dashboard
  window.location.reload()
}
</script>

<style lang="scss" scoped>
.profitability-page {
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.header-left {
  h1 {
    font-size: 2rem;
    margin-bottom: var(--space-2);
  }
}

.header-right {
  flex-shrink: 0;
}
</style>
