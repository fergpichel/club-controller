<template>
  <div class="monthly-pulse">
    <!-- Header -->
    <div class="pulse-header">
      <div class="header-left">
        <h3 class="pulse-title">{{ currentMonthName }}</h3>
        <span class="pulse-subtitle">{{ daysRemaining }} días restantes</span>
      </div>
      <div class="header-right">
        <div class="day-progress">
          <svg class="progress-ring" viewBox="0 0 36 36">
            <circle
              class="progress-bg"
              cx="18" cy="18" r="15"
              fill="none"
              stroke-width="3"
            />
            <circle
              class="progress-fill"
              cx="18" cy="18" r="15"
              fill="none"
              stroke-width="3"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dayProgressOffset"
              stroke-linecap="round"
            />
          </svg>
          <span class="progress-text">{{ dayOfMonth }}</span>
        </div>
      </div>
    </div>

    <!-- Main Balance -->
    <div class="pulse-balance">
      <span class="balance-label">Balance del mes</span>
      <span class="balance-amount" :class="balanceClass">
        {{ formatCurrency(monthBalance) }}
      </span>
      <span v-if="projectedBalance !== monthBalance" class="balance-projection">
        Proyección fin de mes: 
        <strong :class="projectedBalanceClass">{{ formatCurrency(projectedBalance) }}</strong>
      </span>
    </div>

    <!-- Income Bar -->
    <div class="metric-bar">
      <div class="bar-header">
        <div class="bar-label">
          <q-icon name="arrow_upward" size="16px" class="icon-income" />
          <span>Ingresos</span>
        </div>
        <div class="bar-values">
          <span class="value-actual">{{ formatCurrency(actualIncome) }}</span>
          <span class="value-expected">/ {{ formatCurrency(expectedIncome) }}</span>
        </div>
      </div>
      <div class="bar-track">
        <!-- Expected (ghost bar) -->
        <div 
          class="bar-expected"
          :style="{ width: `${Math.min(100, expectedIncomePercent)}%` }"
        ></div>
        <!-- Actual -->
        <div 
          class="bar-actual bar-income"
          :style="{ width: `${Math.min(100, actualIncomePercent)}%` }"
        ></div>
      </div>
      <div class="bar-footer">
        <span :class="incomeStatusClass">
          {{ incomeStatusText }}
        </span>
      </div>
    </div>

    <!-- Expenses Bar -->
    <div class="metric-bar">
      <div class="bar-header">
        <div class="bar-label">
          <q-icon name="arrow_downward" size="16px" class="icon-expense" />
          <span>Gastos</span>
        </div>
        <div class="bar-values">
          <span class="value-actual">{{ formatCurrency(actualExpenses) }}</span>
          <span class="value-expected">/ {{ formatCurrency(expectedExpenses) }}</span>
        </div>
      </div>
      <div class="bar-track">
        <!-- Expected (ghost bar) -->
        <div 
          class="bar-expected"
          :style="{ width: `${Math.min(100, expectedExpensePercent)}%` }"
        ></div>
        <!-- Actual -->
        <div 
          class="bar-actual bar-expense"
          :style="{ width: `${Math.min(100, actualExpensePercent)}%` }"
        ></div>
      </div>
      <div class="bar-footer">
        <span :class="expenseStatusClass">
          {{ expenseStatusText }}
        </span>
      </div>
    </div>

    <!-- Quick Insight -->
    <div v-if="insight" class="pulse-insight" :class="insight.type">
      <q-icon :name="insight.icon" size="18px" />
      <span>{{ insight.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, getDaysInMonth, differenceInDays, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const props = defineProps<{
  actualIncome: number
  actualExpenses: number
  expectedIncome: number
  expectedExpenses: number
}>()

const now = new Date()
const currentMonthName = computed(() => format(now, 'MMMM yyyy', { locale: es }))
const daysInMonth = getDaysInMonth(now)
const dayOfMonth = now.getDate()
const daysRemaining = computed(() => differenceInDays(endOfMonth(now), now))

// Progress ring calculations
const circumference = 2 * Math.PI * 15
const dayProgressOffset = computed(() => {
  const progress = dayOfMonth / daysInMonth
  return circumference * (1 - progress)
})

// Balance calculations
const monthBalance = computed(() => props.actualIncome - props.actualExpenses)
const expectedBalance = computed(() => props.expectedIncome - props.expectedExpenses)

// Projection: extrapolate current pace to end of month
const projectedBalance = computed(() => {
  if (dayOfMonth <= 1) return expectedBalance.value
  
  const dailyIncomeRate = props.actualIncome / dayOfMonth
  const dailyExpenseRate = props.actualExpenses / dayOfMonth
  
  const projectedMonthIncome = dailyIncomeRate * daysInMonth
  const projectedMonthExpenses = dailyExpenseRate * daysInMonth
  
  return Math.round(projectedMonthIncome - projectedMonthExpenses)
})

// Progress percentages (relative to expected totals)
const maxValue = computed(() => Math.max(props.expectedIncome, props.expectedExpenses, props.actualIncome, props.actualExpenses))

const actualIncomePercent = computed(() => (props.actualIncome / maxValue.value) * 100)
const expectedIncomePercent = computed(() => (props.expectedIncome / maxValue.value) * 100)
const actualExpensePercent = computed(() => (props.actualExpenses / maxValue.value) * 100)
const expectedExpensePercent = computed(() => (props.expectedExpenses / maxValue.value) * 100)

// Income status
const incomeStatusClass = computed(() => {
  const ratio = props.actualIncome / (props.expectedIncome * (dayOfMonth / daysInMonth))
  if (ratio >= 1) return 'status-good'
  if (ratio >= 0.8) return 'status-warning'
  return 'status-bad'
})

const incomeStatusText = computed(() => {
  const expectedSoFar = props.expectedIncome * (dayOfMonth / daysInMonth)
  const diff = props.actualIncome - expectedSoFar
  if (diff >= 0) return `+${formatCurrency(diff)} sobre lo esperado`
  return `${formatCurrency(diff)} bajo lo esperado`
})

// Expense status (lower is better)
const expenseStatusClass = computed(() => {
  const ratio = props.actualExpenses / (props.expectedExpenses * (dayOfMonth / daysInMonth))
  if (ratio <= 0.9) return 'status-good'
  if (ratio <= 1.1) return 'status-warning'
  return 'status-bad'
})

const expenseStatusText = computed(() => {
  const expectedSoFar = props.expectedExpenses * (dayOfMonth / daysInMonth)
  const diff = props.actualExpenses - expectedSoFar
  if (diff <= 0) return `${formatCurrency(Math.abs(diff))} menos de lo esperado`
  return `+${formatCurrency(diff)} sobre lo esperado`
})

// Balance classes
const balanceClass = computed(() => monthBalance.value >= 0 ? 'positive' : 'negative')
const projectedBalanceClass = computed(() => projectedBalance.value >= 0 ? 'positive' : 'negative')

// Main insight
const insight = computed(() => {
  const projDiff = projectedBalance.value - expectedBalance.value
  
  if (projectedBalance.value < 0 && expectedBalance.value >= 0) {
    return {
      type: 'danger',
      icon: 'warning',
      text: `Al ritmo actual, cerraremos con ${formatCurrency(Math.abs(projectedBalance.value))} de déficit`
    }
  }
  
  if (projDiff < -500) {
    return {
      type: 'warning',
      icon: 'trending_down',
      text: `Vamos ${formatCurrency(Math.abs(projDiff))} por debajo de lo previsto para este mes`
    }
  }
  
  if (projDiff > 500) {
    return {
      type: 'success',
      icon: 'trending_up',
      text: `Vamos ${formatCurrency(projDiff)} por encima de lo previsto`
    }
  }
  
  return {
    type: 'info',
    icon: 'check',
    text: 'El mes va según lo esperado'
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
</script>

<style lang="scss" scoped>
.monthly-pulse {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  border: 1px solid var(--color-border-light);
}

// === HEADER ===
.pulse-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-5);
}

.pulse-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  text-transform: capitalize;
}

.pulse-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
}

.day-progress {
  position: relative;
  width: 44px;
  height: 44px;
  
  .progress-ring {
    transform: rotate(-90deg);
    
    .progress-bg {
      stroke: var(--color-border-light);
    }
    
    .progress-fill {
      stroke: var(--color-accent);
      transition: stroke-dashoffset 0.3s ease;
    }
  }
  
  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }
}

// === BALANCE ===
.pulse-balance {
  text-align: center;
  padding: var(--space-5) 0;
  margin-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.balance-label {
  display: block;
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-2);
}

.balance-amount {
  display: block;
  font-family: 'DM Sans', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  
  &.positive { color: #10B981; }
  &.negative { color: #EF4444; }
}

.balance-projection {
  display: block;
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
  margin-top: var(--space-2);
  
  strong {
    font-weight: 600;
    &.positive { color: #10B981; }
    &.negative { color: #EF4444; }
  }
}

// === METRIC BARS ===
.metric-bar {
  margin-bottom: var(--space-5);
  
  &:last-of-type {
    margin-bottom: var(--space-4);
  }
}

.bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.bar-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  
  .icon-income { color: #10B981; }
  .icon-expense { color: #EF4444; }
}

.bar-values {
  font-family: 'DM Sans', sans-serif;
  
  .value-actual {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }
  
  .value-expected {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }
}

.bar-track {
  position: relative;
  height: 12px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar-expected {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--color-border);
  opacity: 0.4;
  border-radius: var(--radius-full);
}

.bar-actual {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease-out;
  
  &.bar-income {
    background: linear-gradient(90deg, #10B981 0%, #34D399 100%);
  }
  
  &.bar-expense {
    background: linear-gradient(90deg, #EF4444 0%, #F87171 100%);
  }
}

.bar-footer {
  margin-top: var(--space-2);
  font-size: 0.75rem;
  
  .status-good { color: #10B981; }
  .status-warning { color: #F59E0B; }
  .status-bad { color: #EF4444; }
}

// === INSIGHT ===
.pulse-insight {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  
  &.success {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }
  
  &.info {
    background: rgba(99, 102, 241, 0.1);
    color: #4F46E5;
  }
  
  &.warning {
    background: rgba(245, 158, 11, 0.1);
    color: #D97706;
  }
  
  &.danger {
    background: rgba(239, 68, 68, 0.1);
    color: #DC2626;
  }
}
</style>
