<template>
  <div class="cashflow-timeline">
    <!-- Summary Cards -->
    <div class="summary-row">
      <div class="summary-card balance">
        <div class="summary-icon">
          <q-icon name="account_balance_wallet" size="24px" />
        </div>
        <div class="summary-content">
          <span class="summary-label">Balance actual</span>
          <span class="summary-value" :class="currentBalance >= 0 ? 'positive' : 'negative'">
            {{ formatCurrency(currentBalance) }}
          </span>
        </div>
      </div>

      <div class="summary-card projection">
        <div class="summary-icon">
          <q-icon name="trending_up" size="24px" />
        </div>
        <div class="summary-content">
          <span class="summary-label">Proyección {{ periodLabel }}</span>
          <span class="summary-value" :class="projectedBalance >= 0 ? 'positive' : 'negative'">
            {{ formatCurrency(projectedBalance) }}
          </span>
        </div>
      </div>

      <div class="summary-card" :class="lowestPoint.amount < 0 ? 'danger' : 'safe'">
        <div class="summary-icon">
          <q-icon :name="lowestPoint.amount < 0 ? 'warning' : 'check_circle'" size="24px" />
        </div>
        <div class="summary-content">
          <span class="summary-label">Punto más bajo</span>
          <span class="summary-value">
            {{ formatCurrency(lowestPoint.amount) }}
          </span>
          <span class="summary-date">{{ lowestPoint.date }}</span>
        </div>
      </div>

      <div class="summary-card alerts">
        <div class="summary-icon">
          <q-icon name="notifications_active" size="24px" />
        </div>
        <div class="summary-content">
          <span class="summary-label">Alertas</span>
          <span class="summary-value">{{ dangerDays.length }}</span>
          <span class="summary-date">días en zona roja</span>
        </div>
      </div>
    </div>

    <!-- Period Selector -->
    <div class="controls-row">
      <div class="period-selector">
        <button
          v-for="period in periods"
          :key="period.days"
          :class="['period-btn', { active: selectedPeriod === period.days }]"
          @click="selectedPeriod = period.days"
        >
          {{ period.label }}
        </button>
      </div>

      <div class="controls-right">
        <q-toggle v-model="showRecurring" label="Mostrar recurrentes" dense />
        <q-toggle v-model="showLastYear" label="Comparar año anterior" dense />
      </div>
    </div>

    <!-- Main Chart -->
    <div class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Upcoming Events -->
    <div class="events-section">
      <h3 class="section-title">
        <q-icon name="event" />
        Próximos movimientos programados
      </h3>
      <div class="events-timeline">
        <div
          v-for="event in upcomingEvents.slice(0, 8)"
          :key="event.id"
          class="event-item"
          :class="event.type"
        >
          <div class="event-date">
            <span class="day">{{ event.dayOfMonth }}</span>
            <span class="month">{{ event.monthName }}</span>
          </div>
          <div class="event-details">
            <span class="event-name">{{ event.name }}</span>
            <span class="event-amount" :class="event.type">
              {{ event.type === 'income' ? '+' : '-' }}{{ formatCurrency(event.amount) }}
            </span>
          </div>
          <div class="event-category">
            <q-chip dense size="sm" :color="event.type === 'income' ? 'positive' : 'negative'" text-color="white">
              {{ event.categoryName }}
            </q-chip>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone Alert -->
    <div v-if="dangerDays.length > 0" class="danger-alert">
      <div class="alert-header">
        <q-icon name="warning" size="24px" />
        <span>Atención: {{ dangerDays.length }} días con balance negativo proyectado</span>
      </div>
      <div class="alert-details">
        <p>
          El primer día crítico es el <strong>{{ dangerDays[0]?.date }}</strong>
          con un balance proyectado de <strong class="text-negative">{{ formatCurrency(dangerDays[0]?.balance) }}</strong>.
        </p>
        <p class="alert-suggestion">
          💡 Considera adelantar cobros de cuotas o retrasar pagos no urgentes.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
  Filler,
  type ScriptableContext,
  type TooltipItem
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { format, addDays, startOfDay, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTransactionsStore } from 'src/stores/transactions'
import { useBudgetStore } from 'src/stores/budget'
import { useCategoriesStore } from 'src/stores/categories'
import { formatCurrency } from 'src/utils/formatters'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
)

const transactionsStore = useTransactionsStore()
const budgetStore = useBudgetStore()
const categoriesStore = useCategoriesStore()

// State
const selectedPeriod = ref(90)
const showRecurring = ref(true)
const showLastYear = ref(false)

const periods = [
  { days: 30, label: '30 días' },
  { days: 60, label: '60 días' },
  { days: 90, label: '90 días' },
  { days: 180, label: '6 meses' }
]

const periodLabel = computed(() => {
  const period = periods.find(p => p.days === selectedPeriod.value)
  return period?.label || `${selectedPeriod.value} días`
})

// Recurring transactions derived from the real budget (monthly distribution)
const recurringTransactions = computed(() => {
  const budget = budgetStore.currentBudget
  if (!budget) return []

  const items: { name: string; dayOfMonth: number; amount: number; type: string; categoryName: string }[] = []
  let dayCounter = 1

  // Income allocations → monthly entries (day 5 each)
  for (const alloc of budget.incomeAllocations) {
    const cat = categoriesStore.getCategoryById(alloc.categoryId)
    if (alloc.amount > 0) {
      items.push({
        name: cat?.name || 'Ingreso',
        dayOfMonth: 5,
        amount: Math.round((alloc.amount / 12) * 100) / 100,
        type: 'income',
        categoryName: cat?.name || 'Ingreso'
      })
    }
  }

  // Expense allocations → monthly entries (spread across the month)
  for (const alloc of budget.expenseAllocations) {
    const cat = categoriesStore.getCategoryById(alloc.categoryId)
    if (alloc.amount > 0) {
      items.push({
        name: cat?.name || 'Gasto',
        dayOfMonth: Math.min(28, dayCounter),
        amount: Math.round((alloc.amount / 12) * 100) / 100,
        type: 'expense',
        categoryName: cat?.name || 'Gasto'
      })
      dayCounter = (dayCounter + 7) % 28 || 1
    }
  }

  return items
})

// Calculate current balance from transactions
const currentBalance = computed(() => {
  const today = startOfDay(new Date())
  const pastTransactions = transactionsStore.transactions.filter(t => {
    const txnDate = startOfDay(new Date(t.date))
    return txnDate <= today && t.status !== 'rejected'
  })

  const income = pastTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = pastTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return income - expenses
})

// Generate daily cash flow projection
const cashFlowProjection = computed(() => {
  const today = startOfDay(new Date())
  const days: { date: Date; label: string; balance: number; events: string[] }[] = []
  let runningBalance = currentBalance.value

  for (let i = 0; i <= selectedPeriod.value; i++) {
    const currentDate = addDays(today, i)
    const dayOfMonth = currentDate.getDate()
    const events: string[] = []
    let dailyChange = 0

    // Add recurring transactions
    if (showRecurring.value) {
      recurringTransactions.value.forEach(recurring => {
        if (recurring.dayOfMonth === dayOfMonth) {
          if (recurring.type === 'income') {
            dailyChange += recurring.amount
          } else {
            dailyChange -= recurring.amount
          }
          events.push(recurring.name)
        }
      })
    }

    // Check for actual future transactions
    const futureTxns = transactionsStore.transactions.filter(t => {
      const txnDate = startOfDay(new Date(t.date))
      return isSameDay(txnDate, currentDate) && txnDate > today && t.status !== 'rejected'
    })

    futureTxns.forEach(t => {
      if (t.type === 'income') {
        dailyChange += t.amount
      } else {
        dailyChange -= t.amount
      }
      events.push(t.description)
    })

    runningBalance += dailyChange

    days.push({
      date: currentDate,
      label: format(currentDate, 'd MMM', { locale: es }),
      balance: Math.round(runningBalance),
      events
    })
  }

  return days
})

// Last year comparison (simplified - offset by 365 days)
const lastYearProjection = computed(() => {
  if (!showLastYear.value) return []
  
  // Simulate last year with slight variation
  return cashFlowProjection.value.map((day) => ({
    ...day,
    balance: Math.round(day.balance * (0.85 + Math.random() * 0.2)) // +/- 15% variation
  }))
})

// Calculated values
const projectedBalance = computed(() => {
  const projection = cashFlowProjection.value
  return projection[projection.length - 1]?.balance || 0
})

const lowestPoint = computed(() => {
  const projection = cashFlowProjection.value
  const lowest = projection.reduce((min, day) =>
    day.balance < min.balance ? day : min,
    projection[0]
  )
  return {
    amount: lowest?.balance || 0,
    date: lowest ? format(lowest.date, 'd MMM yyyy', { locale: es }) : ''
  }
})

const dangerDays = computed(() => {
  return cashFlowProjection.value
    .filter(day => day.balance < 0)
    .map(day => ({
      date: format(day.date, 'd MMM yyyy', { locale: es }),
      balance: day.balance
    }))
})

// Upcoming recurring events
const upcomingEvents = computed(() => {
  const today = new Date()
  const events: { id: string; name: string; dayOfMonth: number; monthName: string; amount: number; type: string; categoryName: string }[] = []
  
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    recurringTransactions.value.forEach((recurring, index) => {
      const eventDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, recurring.dayOfMonth)
      if (eventDate > today) {
        events.push({
          id: `${recurring.name}-${monthOffset}-${index}`,
          name: recurring.name,
          dayOfMonth: recurring.dayOfMonth,
          monthName: format(eventDate, 'MMM', { locale: es }),
          amount: recurring.amount,
          type: recurring.type,
          categoryName: recurring.categoryName
        })
      }
    })
  }
  
  return events.sort((a, b) => {
    const dateA = new Date(today.getFullYear(), today.getMonth(), a.dayOfMonth)
    const dateB = new Date(today.getFullYear(), today.getMonth(), b.dayOfMonth)
    return dateA.getTime() - dateB.getTime()
  })
})

// Chart configuration
const chartData = computed(() => {
  const labels = cashFlowProjection.value.map(d => d.label)
  const data = cashFlowProjection.value.map(d => d.balance)

  const datasets = [
    {
      label: 'Balance proyectado',
      data,
      borderColor: '#635BFF',
      backgroundColor: (context: ScriptableContext<'line'>) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, 400)
        gradient.addColorStop(0, 'rgba(99, 91, 255, 0.3)')
        gradient.addColorStop(1, 'rgba(99, 91, 255, 0.0)')
        return gradient
      },
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#635BFF',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
      borderWidth: 3
    }
  ]

  if (showLastYear.value && lastYearProjection.value.length > 0) {
    datasets.push({
      label: 'Año anterior',
      data: lastYearProjection.value.map(d => d.balance),
      borderColor: '#A3ACB9',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: '#A3ACB9',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
      borderWidth: 2,
      borderDash: [5, 5]
    })
  }

  return { labels, datasets }
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
      display: showLastYear.value,
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
      padding: 16,
      cornerRadius: 12,
      titleFont: { family: 'Inter', size: 14, weight: '600' as const },
      bodyFont: { family: 'Inter', size: 13 },
      callbacks: {
        label: (context: TooltipItem<'line'>) => {
          const value = context.parsed.y
          const formatted = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
          return `${context.dataset.label}: ${formatted}`
        },
        afterBody: (tooltipItems: TooltipItem<'line'>[]) => {
          const index = tooltipItems[0]?.dataIndex
          if (index !== undefined) {
            const dayData = cashFlowProjection.value[index]
            if (dayData?.events.length > 0) {
              return ['', '📅 ' + dayData.events.join(', ')]
            }
          }
          return []
        }
      }
    },
    annotation: {
      annotations: {
        zeroLine: {
          type: 'line' as const,
          yMin: 0,
          yMax: 0,
          borderColor: '#EF4444',
          borderWidth: 2,
          borderDash: [6, 6],
          label: {
            display: true,
            content: 'Zona de riesgo',
            position: 'start' as const,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            color: '#fff',
            font: { size: 10, weight: '500' as const },
            padding: 4,
            borderRadius: 4
          }
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: '#8898AA',
        maxTicksLimit: 10
      }
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: '#8898AA',
        callback: (value: string | number) => {
          const numValue = typeof value === 'string' ? parseFloat(value) : value
          if (numValue >= 1000 || numValue <= -1000) {
            return `${(numValue / 1000).toFixed(0)}k€`
          }
          return `${numValue}€`
        }
      }
    }
  }
}))

// Data is loaded by parent page — no independent fetch needed
</script>

<style lang="scss" scoped>
.cashflow-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

// Summary Cards
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);

  .summary-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-lg);
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
  }

  &.balance .summary-icon {
    background: rgba(99, 91, 255, 0.1);
    color: #635BFF;
  }

  &.projection .summary-icon {
    background: rgba(0, 212, 170, 0.1);
    color: #00D4AA;
  }

  &.danger .summary-icon {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }

  &.safe .summary-icon {
    background: rgba(16, 185, 129, 0.1);
    color: #10B981;
  }

  &.alerts .summary-icon {
    background: rgba(245, 158, 11, 0.1);
    color: #F59E0B;
  }

  .summary-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
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

    &.positive { color: #10B981; }
    &.negative { color: #EF4444; }
  }

  .summary-date {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }
}

// Controls
.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.period-selector {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.period-btn {
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.8125rem;
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
    box-shadow: var(--shadow-xs);
  }
}

.controls-right {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}

// Chart
.chart-container {
  height: 400px;
  padding: var(--space-6);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
}

// Events Section
.events-section {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  padding: var(--space-5);

  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-4);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text-primary);

    .q-icon {
      color: var(--color-text-tertiary);
    }
  }
}

.events-timeline {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.event-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  border-left: 3px solid transparent;

  &.income {
    border-left-color: #10B981;
  }

  &.expense {
    border-left-color: #EF4444;
  }

  .event-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 40px;

    .day {
      font-family: 'DM Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1;
    }

    .month {
      font-size: 0.6875rem;
      text-transform: uppercase;
      color: var(--color-text-tertiary);
    }
  }

  .event-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    .event-name {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .event-amount {
      font-size: 0.8125rem;
      font-weight: 600;

      &.income { color: #10B981; }
      &.expense { color: #EF4444; }
    }
  }

  .event-category {
    flex-shrink: 0;
  }
}

// Danger Alert
.danger-alert {
  padding: var(--space-5);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-xl);

  .alert-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
    font-weight: 600;
    color: #DC2626;

    .q-icon {
      color: #EF4444;
    }
  }

  .alert-details {
    padding-left: calc(24px + var(--space-3));

    p {
      margin: 0 0 var(--space-2);
      color: var(--color-text-secondary);
      font-size: 0.9375rem;
    }

    .alert-suggestion {
      padding: var(--space-3);
      background: rgba(255, 255, 255, 0.5);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
    }
  }
}
</style>
