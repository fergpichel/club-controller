<template>
  <div class="financial-hero">
    <!-- Main Hero Card - THE ONE NUMBER THAT MATTERS -->
    <div class="hero-card" :class="statusClass">
      <div class="hero-background">
        <div class="bg-shape bg-shape-1"></div>
        <div class="bg-shape bg-shape-2"></div>
      </div>
      
      <div class="hero-content">
        <!-- Status Badge -->
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span class="badge-text">{{ statusLabel }}</span>
        </div>

        <!-- Main Balance -->
        <div class="hero-balance">
          <span class="balance-label">Balance actual</span>
          <span class="balance-amount">{{ formatCurrency(healthData.currentBalance) }}</span>
          <span class="balance-context">
            Objetivo: <strong>{{ formatCurrency(healthData.targetSurplus) }}</strong> al final de temporada
          </span>
        </div>

        <!-- Visual Progress -->
        <div class="hero-progress">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progressWidth }"></div>
            <div class="progress-marker" :style="{ left: progressWidth }">
              <span class="marker-label">{{ Math.round(healthData.progressPercent) }}%</span>
            </div>
          </div>
          <div class="progress-labels">
            <span>0 €</span>
            <span>{{ formatCurrencyShort(healthData.targetSurplus) }}</span>
          </div>
        </div>

        <!-- Quick Insight -->
        <div v-if="mainInsight" class="hero-insight" :class="mainInsight.type">
          <q-icon :name="mainInsight.icon" size="20px" />
          <span>{{ mainInsight.text }}</span>
        </div>
      </div>
    </div>

    <!-- Two Key Metrics - Simple and Clear -->
    <div class="metrics-row">
      <div class="metric-card income">
        <div class="metric-icon">
          <q-icon name="arrow_upward" size="24px" />
        </div>
        <div class="metric-content">
          <span class="metric-value">{{ formatCurrency(healthData.totalIncomeYTD) }}</span>
          <span class="metric-label">Ingresos temporada</span>
          <div class="metric-comparison">
            <span v-if="incomeDeviation !== 0" :class="incomeDeviation >= 0 ? 'positive' : 'negative'">
              {{ incomeDeviation >= 0 ? '+' : '' }}{{ incomeDeviation }}% vs previsto
            </span>
          </div>
        </div>
      </div>

      <div class="metric-card expense">
        <div class="metric-icon">
          <q-icon name="arrow_downward" size="24px" />
        </div>
        <div class="metric-content">
          <span class="metric-value">{{ formatCurrency(healthData.totalExpensesYTD) }}</span>
          <span class="metric-label">Gastos temporada</span>
          <div class="metric-comparison">
            <span v-if="expenseDeviation !== 0" :class="expenseDeviation <= 0 ? 'positive' : 'negative'">
              {{ expenseDeviation >= 0 ? '+' : '' }}{{ expenseDeviation }}% vs previsto
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts - Only if critical -->
    <div v-if="criticalAlerts.length > 0" class="alerts-banner">
      <div class="alerts-header">
        <q-icon name="warning" size="24px" />
        <span>{{ criticalAlerts.length }} {{ criticalAlerts.length === 1 ? 'alerta requiere' : 'alertas requieren' }} atención</span>
      </div>
      <div class="alerts-list">
        <div v-for="alert in criticalAlerts.slice(0, 2)" :key="alert.id" class="alert-item">
          <span>{{ alert.message }}</span>
        </div>
      </div>
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
.financial-hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

// === HERO CARD ===
.hero-card {
  position: relative;
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
  overflow: hidden;
  color: white;
  
  @media (max-width: 600px) {
    padding: var(--space-6);
  }
  
  // Status-based backgrounds
  &.status-excellent {
    background: linear-gradient(135deg, #059669 0%, #10B981 100%);
    .badge-dot { background: #A7F3D0; }
    .progress-fill { background: rgba(255, 255, 255, 0.9); }
  }
  
  &.status-good {
    background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
    .badge-dot { background: #C7D2FE; }
    .progress-fill { background: rgba(255, 255, 255, 0.9); }
  }
  
  &.status-warning {
    background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%);
    .badge-dot { background: #FDE68A; }
    .progress-fill { background: rgba(255, 255, 255, 0.9); }
  }
  
  &.status-critical {
    background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
    .badge-dot { background: #FECACA; }
    .progress-fill { background: rgba(255, 255, 255, 0.9); }
  }
}

.hero-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  
  .bg-shape {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .bg-shape-1 {
    width: 300px;
    height: 300px;
    top: -100px;
    right: -50px;
  }
  
  .bg-shape-2 {
    width: 200px;
    height: 200px;
    bottom: -80px;
    left: -40px;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-6);
  
  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  .badge-text {
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.hero-balance {
  margin-bottom: var(--space-8);
  
  .balance-label {
    display: block;
    font-size: 0.875rem;
    opacity: 0.9;
    margin-bottom: var(--space-1);
  }
  
  .balance-amount {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 3.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin-bottom: var(--space-2);
    
    @media (max-width: 600px) {
      font-size: 2.5rem;
    }
  }
  
  .balance-context {
    font-size: 0.9375rem;
    opacity: 0.85;
    
    strong {
      font-weight: 600;
    }
  }
}

.hero-progress {
  margin-bottom: var(--space-6);
  
  .progress-track {
    position: relative;
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-full);
    overflow: visible;
    margin-bottom: var(--space-3);
  }
  
  .progress-fill {
    position: absolute;
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.8s ease-out;
  }
  
  .progress-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    
    .marker-label {
      display: block;
      background: white;
      color: #1F2937;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }
  
  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    opacity: 0.7;
  }
}

.hero-insight {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  font-size: 0.9375rem;
  
  .q-icon {
    flex-shrink: 0;
  }
  
  &.success { background: rgba(255, 255, 255, 0.2); }
  &.info { background: rgba(255, 255, 255, 0.15); }
  &.warning { background: rgba(0, 0, 0, 0.1); }
  &.danger { background: rgba(0, 0, 0, 0.15); }
}

// === METRICS ROW ===
.metrics-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  border: 1px solid var(--color-border-light);
  transition: all var(--duration-fast) var(--ease-out);
  
  &:hover {
    border-color: var(--color-border);
    box-shadow: var(--shadow-sm);
  }
  
  .metric-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  &.income .metric-icon {
    background: rgba(16, 185, 129, 0.1);
    color: #10B981;
  }
  
  &.expense .metric-icon {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }
  
  .metric-content {
    flex: 1;
    min-width: 0;
  }
  
  .metric-value {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
    letter-spacing: -0.01em;
    margin-bottom: var(--space-1);
  }
  
  .metric-label {
    display: block;
    font-size: 0.8125rem;
    color: var(--color-text-tertiary);
    margin-bottom: var(--space-2);
  }
  
  .metric-comparison {
    font-size: 0.8125rem;
    font-weight: 600;
    
    .positive { color: #10B981; }
    .negative { color: #EF4444; }
  }
}

// === ALERTS BANNER ===
.alerts-banner {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border: 1px solid rgba(217, 119, 6, 0.3);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  
  .alerts-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
    color: #92400E;
    font-weight: 600;
    
    .q-icon {
      color: #D97706;
    }
  }
  
  .alerts-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .alert-item {
    background: rgba(255, 255, 255, 0.6);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    color: #78350F;
  }
}
</style>
