<template>
  <div class="financial-dashboard">
    <!-- Season Header -->
    <div class="season-header">
      <div class="season-info">
        <span class="season-label">Temporada</span>
        <span class="season-year">{{ seasonLabel }}</span>
      </div>
      <div class="status-badge" :class="statusClass">
        <span class="badge-dot"></span>
        <span class="badge-text">{{ statusLabel }}</span>
      </div>
    </div>

    <!-- Main Balance Card - Compact -->
    <div class="balance-card" :class="statusClass">
      <div class="balance-row">
        <div class="balance-main">
          <span class="balance-label">Balance acumulado</span>
          <span class="balance-amount" :class="healthData.currentBalance >= 0 ? 'positive' : 'negative'">
            {{ formatCurrency(healthData.currentBalance) }}
          </span>
        </div>
        <div class="balance-target">
          <span class="target-label">Objetivo fin temporada</span>
          <span class="target-amount">{{ formatCurrency(healthData.targetSurplus) }}</span>
          <div class="progress-mini">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progressWidth }"></div>
            </div>
            <span class="progress-label">{{ Math.round(healthData.progressPercent) }}%</span>
          </div>
        </div>
      </div>
      
      <!-- Quick Insight - Only if action needed -->
      <div v-if="mainInsight && healthData.status !== 'excellent' && healthData.status !== 'good'" class="balance-insight">
        <q-icon :name="mainInsight.icon" size="18px" />
        <span>{{ mainInsight.text }}</span>
      </div>
    </div>

    <!-- Three Column Stats -->
    <div class="stats-grid">
      <div class="stat-card income">
        <div class="stat-header">
          <q-icon name="trending_up" size="20px" />
          <span>Ingresos</span>
        </div>
        <span class="stat-value">{{ formatCurrencyShort(healthData.totalIncomeYTD) }}</span>
        <div v-if="incomeDeviation !== 0" class="stat-comparison">
          <span :class="incomeDeviation >= 0 ? 'positive' : 'negative'">
            {{ incomeDeviation >= 0 ? '+' : '' }}{{ incomeDeviation }}%
          </span>
          <span class="vs-text">vs previsto</span>
        </div>
      </div>

      <div class="stat-card expense">
        <div class="stat-header">
          <q-icon name="trending_down" size="20px" />
          <span>Gastos</span>
        </div>
        <span class="stat-value">{{ formatCurrencyShort(healthData.totalExpensesYTD) }}</span>
        <div v-if="expenseDeviation !== 0" class="stat-comparison">
          <span :class="expenseDeviation <= 0 ? 'positive' : 'negative'">
            {{ expenseDeviation >= 0 ? '+' : '' }}{{ expenseDeviation }}%
          </span>
          <span class="vs-text">vs previsto</span>
        </div>
      </div>

      <div class="stat-card projection">
        <div class="stat-header">
          <q-icon name="auto_graph" size="20px" />
          <span>Proyección</span>
        </div>
        <span class="stat-value" :class="healthData.projectedYearEndBalance >= 0 ? 'positive' : 'negative'">
          {{ formatCurrencyShort(healthData.projectedYearEndBalance) }}
        </span>
        <span class="stat-label">al cierre temporada</span>
      </div>
    </div>

    <!-- Compact Alerts -->
    <div v-if="criticalAlerts.length > 0" class="alerts-strip">
      <q-icon name="warning_amber" size="18px" />
      <span class="alert-text">{{ criticalAlerts[0].message }}</span>
      <q-badge v-if="criticalAlerts.length > 1" color="warning" text-color="dark">
        +{{ criticalAlerts.length - 1 }}
      </q-badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FinancialHealthData, BudgetAlert } from 'src/types'

const props = defineProps<{
  healthData: FinancialHealthData
  alerts?: BudgetAlert[]
  seasonYear?: number
}>()

const alerts = computed(() => props.alerts || [])
const criticalAlerts = computed(() => alerts.value.filter(a => a.severity === 'critical' || a.severity === 'warning'))

const statusClass = computed(() => `status-${props.healthData.status}`)

// Calculate season label (e.g., "2025-26")
const seasonLabel = computed(() => {
  const now = new Date()
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return `${year}-${(year + 1).toString().slice(-2)}`
})

const statusLabel = computed(() => {
  switch (props.healthData.status) {
    case 'excellent': return 'Excelente'
    case 'good': return 'En buen camino'
    case 'warning': return 'Requiere atención'
    case 'critical': return 'Acción urgente'
    default: return 'Normal'
  }
})

const progressWidth = computed(() => {
  const progress = Math.min(150, Math.max(0, props.healthData.progressPercent))
  return `${Math.min(100, progress)}%`
})

const incomeDeviation = computed(() => {
  if (!props.healthData.budgetedIncomeYTD) return 0
  return Math.round(((props.healthData.totalIncomeYTD - props.healthData.budgetedIncomeYTD) / props.healthData.budgetedIncomeYTD) * 100)
})

const expenseDeviation = computed(() => {
  if (!props.healthData.budgetedExpensesYTD) return 0
  return Math.round(((props.healthData.totalExpensesYTD - props.healthData.budgetedExpensesYTD) / props.healthData.budgetedExpensesYTD) * 100)
})

const mainInsight = computed(() => {
  const h = props.healthData
  
  if (h.status === 'critical') {
    return {
      type: 'danger',
      icon: 'priority_high',
      text: `Necesitamos ${formatCurrency(h.gapToTarget)} más en ingresos para el objetivo`
    }
  }
  
  if (h.status === 'warning') {
    return {
      type: 'warning',
      icon: 'trending_down',
      text: h.statusMessage
    }
  }
  
  if (h.gapToTarget <= 0) {
    return {
      type: 'success',
      icon: 'check_circle',
      text: 'Vamos camino de superar el objetivo de temporada'
    }
  }
  
  return {
    type: 'info',
    icon: 'lightbulb',
    text: h.statusMessage
  }
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatCurrencyShort(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`
  return `${value}€`
}
</script>

<style lang="scss" scoped>
.financial-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

// === SEASON HEADER ===
.season-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-1);
}

.season-info {
  display: flex;
  flex-direction: column;
  
  .season-label {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .season-year {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  
  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  &.status-excellent {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
    .badge-dot { background: #10B981; }
  }
  
  &.status-good {
    background: rgba(99, 102, 241, 0.15);
    color: #4F46E5;
    .badge-dot { background: #6366F1; }
  }
  
  &.status-warning {
    background: rgba(245, 158, 11, 0.15);
    color: #D97706;
    .badge-dot { background: #F59E0B; }
  }
  
  &.status-critical {
    background: rgba(239, 68, 68, 0.15);
    color: #DC2626;
    .badge-dot { background: #EF4444; }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

// === BALANCE CARD ===
.balance-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  border: 2px solid var(--color-border-light);
  
  &.status-excellent { border-color: rgba(16, 185, 129, 0.4); }
  &.status-good { border-color: rgba(99, 102, 241, 0.4); }
  &.status-warning { border-color: rgba(245, 158, 11, 0.4); }
  &.status-critical { border-color: rgba(239, 68, 68, 0.4); }
}

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  
  @media (max-width: 500px) {
    flex-direction: column;
    gap: var(--space-3);
  }
}

.balance-main {
  .balance-label {
    display: block;
    font-size: 0.8125rem;
    color: var(--color-text-tertiary);
    margin-bottom: var(--space-1);
  }
  
  .balance-amount {
    font-family: 'DM Sans', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    
    &.positive { color: #10B981; }
    &.negative { color: #EF4444; }
    
    @media (max-width: 500px) {
      font-size: 1.75rem;
    }
  }
}

.balance-target {
  text-align: right;
  
  @media (max-width: 500px) {
    text-align: left;
    width: 100%;
  }
  
  .target-label {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    margin-bottom: var(--space-1);
  }
  
  .target-amount {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-2);
  }
}

.progress-mini {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  
  @media (max-width: 500px) {
    max-width: 200px;
  }
  
  .progress-track {
    flex: 1;
    height: 4px;
    background: var(--color-border-light);
    border-radius: var(--radius-full);
    overflow: hidden;
    min-width: 80px;
    
    @media (max-width: 500px) {
      min-width: 120px;
    }
  }
  
  .progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    transition: width 0.5s ease-out;
  }
  
  .progress-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }
}

.balance-insight {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: rgba(239, 68, 68, 0.08);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  color: #DC2626;
  
  .q-icon {
    flex-shrink: 0;
  }
}

// === STATS GRID ===
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
  
  .stat-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-tertiary);
  }
  
  &.income {
    .stat-header { color: #10B981; }
  }
  
  &.expense {
    .stat-header { color: #EF4444; }
  }
  
  &.projection {
    .stat-header { color: var(--color-primary); }
  }
  
  .stat-value {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: var(--space-1);
    
    &.positive { color: #10B981; }
    &.negative { color: #EF4444; }
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }
  
  .stat-comparison {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 0.75rem;
    
    .positive { color: #10B981; font-weight: 600; }
    .negative { color: #EF4444; font-weight: 600; }
    .vs-text { color: var(--color-text-tertiary); }
  }
}

// === ALERTS STRIP ===
.alerts-strip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  color: #B45309;
  
  .q-icon {
    flex-shrink: 0;
    color: #D97706;
  }
  
  .alert-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
