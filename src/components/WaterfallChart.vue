<template>
  <div class="waterfall-chart">
    <!-- Header -->
    <div class="chart-header">
      <div class="header-left">
        <h3>{{ title }}</h3>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-right">
        <div class="legend">
          <span class="legend-item income">
            <span class="legend-dot"></span>
            Ingresos
          </span>
          <span class="legend-item expense">
            <span class="legend-dot"></span>
            Gastos
          </span>
          <span class="legend-item total">
            <span class="legend-dot"></span>
            Balance
          </span>
        </div>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="chart-container">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <!-- Summary -->
    <div class="summary-row">
      <div class="summary-item">
        <span class="summary-label">Balance inicial</span>
        <span class="summary-value">{{ formatCurrency(startingBalance) }}</span>
      </div>
      <div class="summary-item positive">
        <q-icon name="add_circle" size="20px" />
        <span class="summary-label">Total ingresos</span>
        <span class="summary-value">{{ formatCurrency(totalIncome) }}</span>
      </div>
      <div class="summary-item negative">
        <q-icon name="remove_circle" size="20px" />
        <span class="summary-label">Total gastos</span>
        <span class="summary-value">{{ formatCurrency(totalExpenses) }}</span>
      </div>
      <div class="summary-item" :class="netChange >= 0 ? 'positive' : 'negative'">
        <q-icon :name="netChange >= 0 ? 'trending_up' : 'trending_down'" size="20px" />
        <span class="summary-label">Balance final</span>
        <span class="summary-value">{{ formatCurrency(endingBalance) }}</span>
      </div>
    </div>

    <!-- Monthly Details (collapsible) -->
    <div v-if="showDetails" class="details-section">
      <q-expansion-item
        label="Ver detalle mensual"
        icon="list"
        header-class="details-header"
      >
        <div class="details-grid">
          <div 
            v-for="month in monthlyData" 
            :key="month.label"
            class="detail-card"
            :class="{ 
              positive: month.net > 0, 
              negative: month.net < 0,
              neutral: month.net === 0 
            }"
          >
            <span class="detail-month">{{ month.label }}</span>
            <div class="detail-row">
              <span class="detail-label">Ingresos</span>
              <span class="detail-value income">+{{ formatCurrencyShort(month.income) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Gastos</span>
              <span class="detail-value expense">-{{ formatCurrencyShort(month.expenses) }}</span>
            </div>
            <div class="detail-row net">
              <span class="detail-label">Neto</span>
              <span class="detail-value" :class="month.net >= 0 ? 'positive' : 'negative'">
                {{ month.net >= 0 ? '+' : '' }}{{ formatCurrencyShort(month.net) }}
              </span>
            </div>
          </div>
        </div>
      </q-expansion-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTransactionsStore } from 'src/stores/transactions'
import { computeSeason, getSeasonDates } from 'src/types'
import { formatCurrency, formatCurrencyShort } from 'src/utils/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  title?: string
  subtitle?: string
  months?: number
  startingBalance?: number
  showDetails?: boolean
  season?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Evolución del Balance',
  subtitle: 'Flujo de caja mensual',
  months: 12,
  startingBalance: 0,
  showDetails: true,
  season: ''
})

const transactionsStore = useTransactionsStore()

// Determine season to use
const effectiveSeason = computed(() => props.season || computeSeason(new Date()))

// Generate the 12 season months (Jul → Jun)
const seasonMonths = computed(() => {
  const dates = getSeasonDates(effectiveSeason.value)
  const startYear = dates.start.getFullYear()
  const months: Date[] = []
  // Jul(6)..Dec(11) of startYear
  for (let m = 6; m < 12; m++) {
    months.push(new Date(startYear, m, 1))
  }
  // Jan(0)..Jun(5) of startYear+1
  for (let m = 0; m < 6; m++) {
    months.push(new Date(startYear + 1, m, 1))
  }
  return months
})

// Calculate monthly data aligned to season
const monthlyData = computed(() => {
  const now = new Date()

  return seasonMonths.value.map(monthDate => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const isFuture = monthStart > now

    const monthTransactions = isFuture ? [] : transactionsStore.transactions.filter(t => {
      const txnDate = new Date(t.date)
      return txnDate >= monthStart && txnDate <= monthEnd && t.status !== 'rejected'
    })

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      label: format(monthDate, 'MMM', { locale: es }),
      fullLabel: format(monthDate, 'MMMM yyyy', { locale: es }),
      income,
      expenses,
      net: income - expenses,
      isFuture
    }
  })
})

// Totals
const totalIncome = computed(() => monthlyData.value.reduce((sum, m) => sum + m.income, 0))
const totalExpenses = computed(() => monthlyData.value.reduce((sum, m) => sum + m.expenses, 0))
const netChange = computed(() => totalIncome.value - totalExpenses.value)
const endingBalance = computed(() => props.startingBalance + netChange.value)

// Chart data for waterfall
const chartData = computed(() => {
  const labels = ['Inicio', ...monthlyData.value.map(m => m.label), 'Final']
  
  // Calculate cumulative balance for waterfall effect
  let runningBalance = props.startingBalance
  const balanceData: (number | null)[] = [props.startingBalance]
  const incomeData: (number | null)[] = [null]
  const expenseData: (number | null)[] = [null]
  const floatingIncomeBase: number[] = [0]
  const floatingExpenseBase: number[] = [0]
  
  monthlyData.value.forEach(month => {
    // Income bar floats from running balance
    floatingIncomeBase.push(runningBalance)
    incomeData.push(month.income)
    
    runningBalance += month.income
    
    // Expense bar floats from new running balance (going down)
    floatingExpenseBase.push(runningBalance - month.expenses)
    expenseData.push(month.expenses)
    
    runningBalance -= month.expenses
    balanceData.push(null) // No balance bar for months
  })
  
  // Final balance
  balanceData.push(endingBalance.value)
  incomeData.push(null)
  expenseData.push(null)
  floatingIncomeBase.push(0)
  floatingExpenseBase.push(0)

  return {
    labels,
    datasets: [
      // Balance bars (start and end)
      {
        label: 'Balance',
        data: balanceData,
        backgroundColor: balanceData.map(v => 
          v === null ? 'transparent' : (v >= 0 ? 'rgba(99, 91, 255, 0.8)' : 'rgba(239, 68, 68, 0.8)')
        ),
        borderColor: balanceData.map(v => 
          v === null ? 'transparent' : (v >= 0 ? '#635BFF' : '#EF4444')
        ),
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.6
      },
      // Income bars (floating)
      {
        label: 'Ingresos',
        data: incomeData.map((v, i) => {
          if (v === null) return null
          return [floatingIncomeBase[i], floatingIncomeBase[i] + v]
        }),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10B981',
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.6
      },
      // Expense bars (floating, going down)
      {
        label: 'Gastos',
        data: expenseData.map((v, i) => {
          if (v === null) return null
          return [floatingExpenseBase[i], floatingExpenseBase[i] + v]
        }),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#EF4444',
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.6
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(10, 37, 64, 0.95)',
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: 'Inter', size: 13, weight: '600' as const },
      bodyFont: { family: 'Inter', size: 12 },
      callbacks: {
        label: (context: { dataset: { label: string }; raw: number | [number, number] | null }) => {
          const label = context.dataset.label
          const raw = context.raw
          
          if (raw === null) return ''
          
          if (Array.isArray(raw)) {
            const value = raw[1] - raw[0]
            return `${label}: ${formatCurrency(value)}`
          }
          
          return `${label}: ${formatCurrency(raw as number)}`
        }
      }
    }
  },
  scales: {
    x: {
      stacked: false,
      grid: { display: false },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: '#8898AA'
      }
    },
    y: {
      stacked: false,
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

// Data is fetched by parent component
</script>

<style lang="scss" scoped>
.waterfall-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
}

// Header
.chart-header {
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

.legend {
  display: flex;
  gap: var(--space-4);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-sm);
  }

  &.income .legend-dot {
    background: #10B981;
  }

  &.expense .legend-dot {
    background: #EF4444;
  }

  &.total .legend-dot {
    background: #635BFF;
  }
}

// Chart
.chart-container {
  height: 350px;
}

// Summary
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  text-align: center;

  .q-icon {
    color: var(--color-text-tertiary);
  }

  &.positive {
    background: rgba(16, 185, 129, 0.08);
    
    .q-icon { color: #10B981; }
    .summary-value { color: #10B981; }
  }

  &.negative {
    background: rgba(239, 68, 68, 0.08);
    
    .q-icon { color: #EF4444; }
    .summary-value { color: #EF4444; }
  }
}

.summary-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.summary-value {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

// Details Section
.details-section {
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--space-4);

  :deep(.details-header) {
    padding: var(--space-2) 0;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-3);
  padding: var(--space-4) 0;
}

.detail-card {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg-tertiary);
  border-left: 3px solid var(--color-border);

  &.positive {
    border-left-color: #10B981;
  }

  &.negative {
    border-left-color: #EF4444;
  }

  &.neutral {
    border-left-color: #8898AA;
  }
}

.detail-month {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  text-transform: capitalize;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 2px;

  &.net {
    padding-top: var(--space-1);
    margin-top: var(--space-1);
    border-top: 1px solid var(--color-border-light);
    font-weight: 600;
  }
}

.detail-label {
  color: var(--color-text-tertiary);
}

.detail-value {
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;

  &.income { color: #10B981; }
  &.expense { color: #EF4444; }
  &.positive { color: #10B981; }
  &.negative { color: #EF4444; }
}
</style>
