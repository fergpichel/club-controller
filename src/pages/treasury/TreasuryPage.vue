<template>
  <q-page class="treasury-page">
    <!-- Header -->
    <div class="page-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Tesorería</h1>
          <p class="header-subtitle">Análisis avanzado de flujo de caja</p>
        </div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- View Selector Pills -->
      <div class="view-selector q-mb-lg">
        <button
          v-for="view in views"
          :key="view.id"
          :class="['view-pill', { active: activeView === view.id }]"
          @click="activeView = view.id"
        >
          <q-icon :name="view.icon" size="20px" />
          <span>{{ view.label }}</span>
        </button>
      </div>

      <!-- Cash Flow Timeline View -->
      <div v-if="activeView === 'cashflow'" class="view-content">
        <CashFlowTimeline />
      </div>

      <!-- Money Flow (Sankey) View -->
      <div v-else-if="activeView === 'sankey'" class="view-content">
        <MoneyFlowSankey />
      </div>

      <!-- What-If Simulator View -->
      <div v-else-if="activeView === 'simulator'" class="view-content">
        <WhatIfSimulator />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CashFlowTimeline from 'src/components/CashFlowTimeline.vue'
import MoneyFlowSankey from 'src/components/MoneyFlowSankey.vue'
import WhatIfSimulator from 'src/components/WhatIfSimulator.vue'

const activeView = ref('cashflow')

const views = [
  { id: 'cashflow', label: 'Cash Flow', icon: 'show_chart' },
  { id: 'sankey', label: 'Flujo de Dinero', icon: 'account_tree' },
  { id: 'simulator', label: 'Simulador', icon: 'tune' }
]
</script>

<style lang="scss" scoped>
.treasury-page {
  background: var(--color-background);
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

// View Selector Pills
.view-selector {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-1);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  width: fit-content;
}

.view-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-full);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--color-text-primary);
  }

  &.active {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-sm);
  }
}

// Placeholder cards
.placeholder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 2px dashed var(--color-border);
  text-align: center;
  min-height: 400px;

  h3 {
    margin: var(--space-4) 0 var(--space-2);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
  }
}
</style>
