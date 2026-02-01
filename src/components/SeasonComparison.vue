<template>
  <div class="season-comparison">
    <div class="comparison-header">
      <div class="header-left">
        <h3>{{ title }}</h3>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-right">
        <div class="metric-toggle">
          <button 
            v-for="metric in metrics"
            :key="metric.value"
            :class="{ active: selectedMetric === metric.value }"
            @click="selectedMetric = metric.value"
          >
            {{ metric.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Season Selector -->
    <div class="season-badges">
      <div class="season-badge current">
        <span class="season-dot"></span>
        <span class="season-label">{{ currentSeasonLabel }}</span>
        <span class="season-value" :class="selectedMetric === 'balance' ? (currentTotal >= 0 ? 'positive' : 'negative') : ''">
          {{ formatCurrency(currentTotal) }}
        </span>
      </div>
      <div class="season-badge previous">
        <span class="season-dot"></span>
        <span class="season-label">{{ previousSeasonLabel }}</span>
        <span class="season-value" :class="selectedMetric === 'balance' ? (previousTotal >= 0 ? 'positive' : 'negative') : ''">
          {{ formatCurrency(previousTotal) }}
        </span>
      </div>
      <div class="season-badge difference" :class="difference >= 0 ? 'positive' : 'negative'">
        <q-icon :name="difference >= 0 ? 'trending_up' : 'trending_down'" />
        <span class="diff-value">{{ difference >= 0 ? '+' : '' }}{{ formatCurrency(difference) }}</span>
        <span class="diff-percent">({{ differencePercent >= 0 ? '+' : '' }}{{ differencePercent.toFixed(1) }}%)</span>
      </div>
    </div>

    <!-- Chart -->
    <div class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Monthly Comparison Table -->
    <div class="monthly-table">
      <div class="table-header">
        <span class="col-month">Mes</span>
        <span class="col-current">{{ currentSeasonLabel.split(' ')[1] }}</span>
        <span class="col-previous">{{ previousSeasonLabel.split(' ')[1] }}</span>
        <span class="col-diff">Diferencia</span>
      </div>
      <div 
        v-for="month in monthlyComparison" 
        :key="month.month"
        class="table-row"
        :class="{ future: month.isFuture }"
      >
        <span class="col-month">{{ month.monthName }}</span>
        <span class="col-current">{{ month.isFuture ? '-' : formatCurrencyShort(month.current) }}</span>
        <span class="col-previous">{{ formatCurrencyShort(month.previous) }}</span>
        <span class="col-diff" :class="month.diff >= 0 ? 'positive' : 'negative'">
          {{ month.isFuture ? '-' : (month.diff >= 0 ? '+' : '') + formatCurrencyShort(month.diff) }}
        </span>
      </div>
    </div>

    <!-- Insights -->
    <div class="insights-row">
      <div v-for="insight in insights" :key="insight.id" class="insight-card" :class="insight.type">
        <q-icon :name="insight.icon" size="20px" />
        <span>{{ insight.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { startOfMonth, endOfMonth } from 'date-fns'
import { useTransactionsStore } from 'src/stores/transactions'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

withDefaults(defineProps<{
  title?: string
  subtitle?: string
}>(), {
  title: 'Comparativa de Temporadas',
  subtitle: 'Evolución mensual vs temporada anterior'
})

const transactionsStore = useTransactionsStore()
const selectedMetric = ref<'income' | 'expenses' | 'balance'>('balance')

const metrics = [
  { value: 'income', label: 'Ingresos' },
  { value: 'expenses', label: 'Gastos' },
  { value: 'balance', label: 'Balance' }
]

// Season calculations (Sept - Aug)
const now = new Date()
const currentSeasonStart = now.getMonth() >= 8 
  ? new Date(now.getFullYear(), 8, 1) 
  : new Date(now.getFullYear() - 1, 8, 1)
const previousSeasonStart = new Date(currentSeasonStart.getFullYear() - 1, 8, 1)

const currentSeasonLabel = computed(() => {
  const year = currentSeasonStart.getFullYear()
  return `Temporada ${year}-${(year + 1).toString().slice(-2)}`
})

const previousSeasonLabel = computed(() => {
  const year = previousSeasonStart.getFullYear()
  return `Temporada ${year}-${(year + 1).toString().slice(-2)}`
})

// Season months (Sept to Aug)
const seasonMonths = ['sep', 'oct', 'nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago']
const seasonMonthsFull = ['Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto']

// Get data for a specific month in a season
const getMonthData = (seasonStart: Date, monthIndex: number) => {
  const year = monthIndex < 4 ? seasonStart.getFullYear() : seasonStart.getFullYear() + 1
  const month = monthIndex < 4 ? 8 + monthIndex : monthIndex - 4 // Convert to JS month (0-11)
  
  const monthStart = startOfMonth(new Date(year, month, 1))
  const monthEnd = endOfMonth(monthStart)
  
  const monthTxns = transactionsStore.transactions.filter(t => {
    const txnDate = new Date(t.date)
    return txnDate >= monthStart && txnDate <= monthEnd && t.status !== 'rejected'
  })
  
  const income = monthTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const expenses = monthTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  
  return { income, expenses, balance: income - expenses }
}

// Monthly comparison data
const monthlyComparison = computed(() => {
  const currentMonthInSeason = now.getMonth() >= 8 
    ? now.getMonth() - 8 
    : now.getMonth() + 4
  
  return seasonMonths.map((month, index) => {
    const current = getMonthData(currentSeasonStart, index)
    const previous = getMonthData(previousSeasonStart, index)
    const isFuture = index > currentMonthInSeason
    
    const currentValue = selectedMetric.value === 'income' ? current.income 
      : selectedMetric.value === 'expenses' ? current.expenses 
      : current.balance
    
    const previousValue = selectedMetric.value === 'income' ? previous.income 
      : selectedMetric.value === 'expenses' ? previous.expenses 
      : previous.balance
    
    return {
      month,
      monthName: seasonMonthsFull[index],
      current: currentValue,
      previous: previousValue,
      diff: currentValue - previousValue,
      isFuture
    }
  })
})

// Totals
const currentTotal = computed(() => {
  return monthlyComparison.value
    .filter(m => !m.isFuture)
    .reduce((sum, m) => sum + m.current, 0)
})

const previousTotal = computed(() => {
  const currentMonthInSeason = now.getMonth() >= 8 
    ? now.getMonth() - 8 
    : now.getMonth() + 4
  
  return monthlyComparison.value
    .filter((_, index) => index <= currentMonthInSeason)
    .reduce((sum, m) => sum + m.previous, 0)
})

const difference = computed(() => currentTotal.value - previousTotal.value)
const differencePercent = computed(() => {
  if (previousTotal.value === 0) return 0
  return ((currentTotal.value - previousTotal.value) / Math.abs(previousTotal.value)) * 100
})

// Chart data
const chartData = computed(() => {
  const labels = seasonMonthsFull.map(m => m.slice(0, 3))
  
  return {
    labels,
    datasets: [
      {
        label: currentSeasonLabel.value,
        data: monthlyComparison.value.map(m => m.isFuture ? null : m.current),
        borderColor: '#635BFF',
        backgroundColor: 'rgba(99, 91, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#635BFF',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 3
      },
      {
        label: previousSeasonLabel.value,
        data: monthlyComparison.value.map(m => m.previous),
        borderColor: '#A3ACB9',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#A3ACB9',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2,
        borderDash: [5, 5]
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: { family: 'Inter', size: 12 }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(10, 37, 64, 0.95)',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: { dataset: { label: string }; parsed: { y: number | null } }) => {
          if (context.parsed.y === null) return ''
          return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: '#8898AA'
      }
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: '#8898AA',
        callback: (value: number | string) => {
          const numValue = typeof value === 'string' ? parseFloat(value) : value
          return `${(numValue / 1000).toFixed(0)}k€`
        }
      }
    }
  }
}))

// Insights
const insights = computed(() => {
  const result = []
  
  // Overall comparison
  if (difference.value > 0) {
    result.push({
      id: 'overall',
      type: 'success',
      icon: 'trending_up',
      text: selectedMetric.value === 'expenses'
        ? `Los gastos son un ${Math.abs(differencePercent.value).toFixed(0)}% mayores que la temporada anterior.`
        : `Mejora del ${differencePercent.value.toFixed(0)}% respecto a la temporada anterior.`
    })
  } else if (difference.value < 0) {
    result.push({
      id: 'overall',
      type: selectedMetric.value === 'expenses' ? 'success' : 'warning',
      icon: selectedMetric.value === 'expenses' ? 'savings' : 'trending_down',
      text: selectedMetric.value === 'expenses'
        ? `Los gastos son un ${Math.abs(differencePercent.value).toFixed(0)}% menores que la temporada anterior.`
        : `Descenso del ${Math.abs(differencePercent.value).toFixed(0)}% respecto a la temporada anterior.`
    })
  }
  
  // Best month comparison
  const bestMonth = monthlyComparison.value
    .filter(m => !m.isFuture)
    .reduce((best, m) => m.diff > best.diff ? m : best, { diff: -Infinity, monthName: '' })
  
  if (bestMonth.monthName) {
    result.push({
      id: 'best',
      type: 'info',
      icon: 'emoji_events',
      text: `${bestMonth.monthName} es el mes con mayor mejora: +${formatCurrencyShort(bestMonth.diff)} vs año anterior.`
    })
  }
  
  return result
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatCurrencyShort(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toFixed(1).replace('.0', '')}k€`
  }
  return `${Math.round(amount)}€`
}

onMounted(async () => {
  await transactionsStore.fetchTransactions({})
})
</script>

<style lang="scss" scoped>
.season-comparison {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--space-4);

  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .subtitle {
    margin: var(--space-1) 0 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }
}

.metric-toggle {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);

  button {
    padding: var(--space-1) var(--space-3);
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--duration-fast);

    &.active {
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
      box-shadow: var(--shadow-xs);
    }
  }
}

// Season Badges
.season-badges {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.season-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);

  .season-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  &.current .season-dot {
    background: #635BFF;
  }

  &.previous .season-dot {
    background: #A3ACB9;
  }

  .season-label {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }

  .season-value {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-text-primary);

    &.positive { color: #10B981; }
    &.negative { color: #EF4444; }
  }

  &.difference {
    margin-left: auto;
    
    &.positive {
      background: rgba(16, 185, 129, 0.1);
      color: #10B981;
    }
    
    &.negative {
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
    }

    .diff-value {
      font-family: 'DM Sans', sans-serif;
      font-weight: 700;
    }

    .diff-percent {
      font-size: 0.75rem;
      opacity: 0.8;
    }
  }
}

// Chart
.chart-container {
  height: 300px;
}

// Monthly Table
.monthly-table {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-bg-tertiary);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: 0.8125rem;
  border-top: 1px solid var(--color-border-light);

  &.future {
    opacity: 0.4;
  }

  .col-month {
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .col-current, .col-previous {
    font-family: 'DM Sans', sans-serif;
    color: var(--color-text-secondary);
    text-align: right;
  }

  .col-diff {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    text-align: right;

    &.positive { color: #10B981; }
    &.negative { color: #EF4444; }
  }
}

// Insights
.insights-row {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  flex: 1;
  min-width: 200px;

  &.success {
    background: rgba(16, 185, 129, 0.08);
    color: #059669;
  }

  &.warning {
    background: rgba(245, 158, 11, 0.08);
    color: #D97706;
  }

  &.info {
    background: rgba(99, 91, 255, 0.08);
    color: #635BFF;
  }

  .q-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }
}
</style>
