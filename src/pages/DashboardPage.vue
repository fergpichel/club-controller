<template>
  <q-page class="dashboard-page">
    <!-- Premium Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <p class="header-eyebrow">{{ greeting }}</p>
          <h1>{{ userName }}</h1>
          <p class="header-subtitle">{{ currentDateFormatted }}</p>
        </div>
        <div class="header-right">
          <q-btn
            round
            flat
            icon="refresh"
            class="refresh-btn"
            :loading="loading"
            @click="refreshData"
          >
            <q-tooltip>Actualizar</q-tooltip>
          </q-btn>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="page-content">
      <!-- Financial Health Dashboard - Main Feature -->
      <section class="health-section animate-in">
        <FinancialHealthDashboard
          :health-data="financialHealth"
          :alerts="budgetAlerts"
          :season-year="seasonYear"
        />
      </section>

      <!-- Monthly Pulse Widget -->
      <section class="pulse-section animate-in" style="animation-delay: 100ms">
        <div class="dashboard-grid-2col">
          <MonthlyPulseWidget
            :actual-income="monthlyIncome"
            :actual-expenses="monthlyExpenses"
            :expected-income="expectedMonthlyIncome"
            :expected-expenses="expectedMonthlyExpenses"
          />
          
          <!-- Quick Stats Mini Cards -->
          <div class="mini-stats-grid">
            <div class="mini-stat">
              <span class="mini-stat-value">{{ recentTransactions.length }}</span>
              <span class="mini-stat-label">Movimientos este mes</span>
            </div>
            <div class="mini-stat">
              <span class="mini-stat-value">{{ pendingCount }}</span>
              <span class="mini-stat-label">Pendientes de aprobar</span>
            </div>
            <div class="mini-stat">
              <span class="mini-stat-value text-positive">{{ formatCurrencyShort(avgDailyIncome) }}</span>
              <span class="mini-stat-label">Media diaria ingresos</span>
            </div>
            <div class="mini-stat">
              <span class="mini-stat-value text-negative">{{ formatCurrencyShort(avgDailyExpenses) }}</span>
              <span class="mini-stat-label">Media diaria gastos</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section class="charts-section">
        <div class="dashboard-grid">
          <!-- Trend Chart -->
          <div class="section-card animate-in" style="animation-delay: 150ms">
            <div class="section-header">
              <div>
                <h2 class="section-title">Evolución financiera</h2>
                <p class="section-subtitle">Comparativa ingresos vs gastos</p>
              </div>
              <div class="period-toggle">
                <button
                  v-for="period in [6, 12]"
                  :key="period"
                  :class="{ active: chartPeriod === period }"
                  @click="chartPeriod = period"
                >
                  {{ period }}M
                </button>
              </div>
            </div>
            <div class="section-body">
              <div class="chart-container">
                <Line v-if="trendChartData" :data="trendChartData" :options="lineChartOptions" />
                <div v-else class="chart-placeholder">
                  <span>Cargando datos...</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Category Chart -->
          <div class="section-card animate-in" style="animation-delay: 200ms">
            <div class="section-header">
              <div>
                <h2 class="section-title">Por categoría</h2>
                <p class="section-subtitle">Distribución de gastos</p>
              </div>
            </div>
            <div class="section-body">
              <div class="chart-container-sm">
                <Doughnut v-if="categoryChartData" :data="categoryChartData" :options="doughnutOptions" />
                <div v-else class="chart-placeholder">
                  <span>Sin datos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Budget Gauges -->
      <section v-if="hasTransactions" class="gauges-section animate-in" style="animation-delay: 220ms">
        <div class="gauges-grid">
          <BudgetGauge
            title="Cumplimiento Ingresos"
            type="income"
            :actual="financialHealth.totalIncomeYTD"
            :budgeted="financialHealth.budgetedIncomeYTD"
          />
          <BudgetGauge
            title="Control de Gastos"
            type="expense"
            :actual="financialHealth.totalExpensesYTD"
            :budgeted="financialHealth.budgetedExpensesYTD"
          />
        </div>
      </section>

      <!-- Waterfall Chart - Balance Evolution -->
      <section v-if="hasTransactions" class="waterfall-section animate-in" style="animation-delay: 250ms">
        <WaterfallChart
          title="Evolución del Balance"
          subtitle="Flujo de caja mensual de la temporada"
          :months="12"
          :starting-balance="0"
          :show-details="true"
        />
      </section>

      <!-- Activity Heatmap -->
      <section v-if="hasTransactions" class="heatmap-section animate-in" style="animation-delay: 280ms">
        <ActivityHeatmap
          title="Actividad Financiera"
          subtitle="Movimientos de los últimos 6 meses"
          :months="6"
        />
      </section>

      <!-- Transactions & Actions -->
      <section class="content-section">
        <div class="dashboard-grid">
          <!-- Recent Transactions -->
          <div class="section-card animate-in" style="animation-delay: 250ms">
            <div class="section-header">
              <div>
                <h2 class="section-title">Actividad reciente</h2>
                <p class="section-subtitle">Últimas transacciones</p>
              </div>
              <q-btn
                flat
                dense
                color="primary"
                label="Ver todo"
                no-caps
                class="btn-sm"
                :to="{ name: 'transactions' }"
              />
            </div>
            <div class="section-body section-body--flush">
              <div v-if="recentTransactions.length > 0" class="transactions-list">
                <TransactionItem
                  v-for="(transaction, index) in recentTransactions"
                  :key="transaction.id"
                  :transaction="transaction"
                  class="animate-stagger"
                  :style="{ animationDelay: `${300 + index * 50}ms` }"
                />
              </div>
              <div v-else class="empty-state">
                <div class="empty-illustration">
                  <q-icon name="receipt_long" />
                </div>
                <h3 class="empty-title">Sin actividad</h3>
                <p class="empty-description">
                  Registra tu primer movimiento para comenzar a ver el historial
                </p>
                <q-btn
                  color="primary"
                  label="Añadir transacción"
                  no-caps
                  unelevated
                  :to="{ name: 'new-transaction', params: { type: 'expense' } }"
                />
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="sidebar-stack">
            <!-- Pending Alert -->
            <div v-if="authStore.canApprove && pendingCount > 0" class="alert-card animate-in" style="animation-delay: 300ms">
              <div class="alert-icon">
                <q-icon name="pending_actions" size="24px" />
              </div>
              <div class="alert-content">
                <h3 class="alert-title">Pendiente de aprobación</h3>
                <p class="alert-description">
                  {{ pendingCount }} {{ pendingCount === 1 ? 'transacción requiere' : 'transacciones requieren' }} tu revisión
                </p>
              </div>
              <q-btn
                color="warning"
                label="Revisar"
                no-caps
                unelevated
                class="full-width"
                :to="{ name: 'pending' }"
              />
            </div>

            <!-- Quick Actions -->
            <div class="section-card animate-in" style="animation-delay: 350ms">
              <div class="section-header">
                <h2 class="section-title">Acciones rápidas</h2>
              </div>
              <div class="section-body">
                <div class="quick-actions-grid">
                  <router-link
                    :to="{ name: 'new-transaction', params: { type: 'income' } }"
                    class="quick-action action-success"
                  >
                    <q-icon name="add" />
                    <span>Ingreso</span>
                  </router-link>
                  <router-link
                    :to="{ name: 'new-transaction', params: { type: 'expense' } }"
                    class="quick-action action-danger"
                  >
                    <q-icon name="remove" />
                    <span>Gasto</span>
                  </router-link>
                  <router-link :to="{ name: 'statistics' }" class="quick-action action-accent">
                    <q-icon name="bar_chart" />
                    <span>Estadísticas</span>
                  </router-link>
                  <router-link :to="{ name: 'teams' }" class="quick-action action-info">
                    <q-icon name="groups" />
                    <span>Equipos</span>
                  </router-link>
                </div>
              </div>
            </div>

            <!-- Upcoming Events -->
            <div v-if="upcomingEvents.length > 0" class="section-card animate-in" style="animation-delay: 400ms">
              <div class="section-header">
                <h2 class="section-title">Próximos eventos</h2>
              </div>
              <div class="section-body section-body--flush">
                <div class="events-list">
                  <router-link
                    v-for="event in upcomingEvents.slice(0, 3)"
                    :key="event.id"
                    :to="{ name: 'event-detail', params: { id: event.id } }"
                    class="event-item"
                  >
                    <div class="event-date">
                      <span class="event-day">{{ formatDay(event.date) }}</span>
                      <span class="event-month">{{ formatMonth(event.date) }}</span>
                    </div>
                    <div class="event-info">
                      <p class="event-name">{{ event.name }}</p>
                      <p class="event-time">{{ formatTime(event.date) }}</p>
                    </div>
                    <q-icon name="chevron_right" class="event-arrow" />
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Doughnut } from 'vue-chartjs'
import { useAuthStore } from 'src/stores/auth'
import { useTransactionsStore } from 'src/stores/transactions'
import { useStatisticsStore } from 'src/stores/statistics'
import { useTeamsStore } from 'src/stores/teams'
import TransactionItem from 'src/components/TransactionItem.vue'
import FinancialHealthDashboard from 'src/components/FinancialHealthDashboard.vue'
import MonthlyPulseWidget from 'src/components/MonthlyPulseWidget.vue'
import WaterfallChart from 'src/components/WaterfallChart.vue'
import BudgetGauge from 'src/components/BudgetGauge.vue'
import ActivityHeatmap from 'src/components/ActivityHeatmap.vue'
import { calculateFinancialHealth, generateBudgetAlerts } from 'src/services/financialHealth'
import type { FinancialHealthData, BudgetAlert } from 'src/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const authStore = useAuthStore()
const transactionsStore = useTransactionsStore()
const statisticsStore = useStatisticsStore()
const teamsStore = useTeamsStore()

const loading = ref(false)
const chartPeriod = ref(6)

// Financial Health
const financialHealth = ref<FinancialHealthData>({
  currentBalance: 0,
  totalIncomeYTD: 0,
  totalExpensesYTD: 0,
  targetSurplus: 500,
  budgetedIncomeYTD: 0,
  budgetedExpensesYTD: 0,
  progressPercent: 0,
  balanceVsBudget: 0,
  projectedYearEndBalance: 0,
  gapToTarget: 0,
  status: 'good',
  statusMessage: 'Cargando...',
  monthlyTrend: 'stable',
  incomeOnTrack: true,
  expensesOnTrack: true
})
const budgetAlerts = ref<BudgetAlert[]>([])
const seasonYear = computed(() => {
  const now = new Date()
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
})

// Computed
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const userName = computed(() => {
  return authStore.user?.displayName || 'Usuario'
})

const currentDateFormatted = computed(() => {
  return format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })
})

const recentTransactions = computed(() => transactionsStore.transactions.slice(0, 5))
const pendingCount = computed(() => transactionsStore.pendingTransactions.length)
const hasTransactions = computed(() => transactionsStore.transactions.length > 0)
const upcomingEvents = computed(() => teamsStore.upcomingEvents)

// Monthly pulse data
const now = new Date()
const currentMonthTransactions = computed(() => {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  return transactionsStore.transactions.filter(t => {
    const date = new Date(t.date)
    return date >= startOfMonth && date <= endOfMonth
  })
})

const monthlyIncome = computed(() => 
  currentMonthTransactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
)

const monthlyExpenses = computed(() => 
  currentMonthTransactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
)

// Expected values - in a real app these would come from forecasts/budgets
const expectedMonthlyIncome = computed(() => {
  // Use budgeted values or estimate from historical data
  return financialHealth.value.budgetedIncomeYTD / 10 || 15000 // Avg per month
})

const expectedMonthlyExpenses = computed(() => {
  return financialHealth.value.budgetedExpensesYTD / 10 || 14500 // Avg per month
})

const avgDailyIncome = computed(() => {
  const dayOfMonth = now.getDate()
  return dayOfMonth > 0 ? monthlyIncome.value / dayOfMonth : 0
})

const avgDailyExpenses = computed(() => {
  const dayOfMonth = now.getDate()
  return dayOfMonth > 0 ? monthlyExpenses.value / dayOfMonth : 0
})

// Chart data
const trendChartData = computed(() => {
  const data = statisticsStore.trendData
  if (!data.length) return null

  return {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Ingresos',
        data: data.map(d => d.income),
        borderColor: '#00D4AA',
        backgroundColor: 'rgba(0, 212, 170, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#00D4AA',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2.5
      },
      {
        label: 'Gastos',
        data: data.map(d => d.expenses),
        borderColor: '#FF5470',
        backgroundColor: 'rgba(255, 84, 112, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#FF5470',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2.5
      }
    ]
  }
})

const categoryChartData = computed(() => {
  const data = statisticsStore.categoryStats
  if (!data.length) return null

  const colors = ['#635BFF', '#00D4AA', '#FF5470', '#FFB545', '#00B4D8', '#8B5CF6']

  return {
    labels: data.slice(0, 6).map(d => d.categoryName),
    datasets: [{
      data: data.slice(0, 6).map(d => d.total),
      backgroundColor: colors,
      borderWidth: 0,
      hoverOffset: 8
    }]
  }
})

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        font: {
          family: "'Inter', sans-serif",
          size: 12,
          weight: '500'
        },
        color: '#425466'
      }
    },
    tooltip: {
      backgroundColor: '#0A2540',
      titleFont: { family: "'Inter', sans-serif", size: 13, weight: '600' },
      bodyFont: { family: "'Inter', sans-serif", size: 12 },
      padding: 14,
      cornerRadius: 10,
      displayColors: true,
      callbacks: {
        label: (ctx: { dataset: { label: string }, parsed: { y: number } }) => {
          return ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        font: { family: "'Inter', sans-serif", size: 11 },
        color: '#8898AA'
      }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#E6EBF1' },
      border: { display: false },
      ticks: {
        font: { family: "'Inter', sans-serif", size: 11 },
        color: '#8898AA',
        callback: (v: string | number) => formatCurrencyShort(Number(v))
      }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
        font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
        color: '#425466'
      }
    },
    tooltip: {
      backgroundColor: '#0A2540',
      titleFont: { family: "'Inter', sans-serif", size: 13, weight: '600' },
      bodyFont: { family: "'Inter', sans-serif", size: 12 },
      padding: 14,
      cornerRadius: 10
    }
  },
  cutout: '70%'
}

// Methods
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0
  }).format(value)
}

function formatCurrencyShort(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`
  return `${Math.round(value)}€`
}

function formatDay(date: Date): string {
  return format(new Date(date), 'd')
}

function formatMonth(date: Date): string {
  return format(new Date(date), 'MMM', { locale: es }).toUpperCase()
}

function formatTime(date: Date): string {
  return format(new Date(date), 'HH:mm')
}

function updateFinancialHealth() {
  const transactions = transactionsStore.transactions
  financialHealth.value = calculateFinancialHealth(transactions)
  budgetAlerts.value = generateBudgetAlerts(transactions, financialHealth.value)
}

async function refreshData() {
  loading.value = true
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    await Promise.all([
      statisticsStore.fetchMonthlyStats(year, month),
      statisticsStore.fetchTrendData(chartPeriod.value),
      statisticsStore.fetchCategoryStats(
        new Date(year, month - 1, 1),
        new Date(year, month, 0),
        'expense'
      ),
      transactionsStore.fetchTransactions({}),
      teamsStore.fetchEvents()
    ])

    // Update financial health after fetching transactions
    updateFinancialHealth()
  } finally {
    loading.value = false
  }
}

watch(chartPeriod, () => {
  statisticsStore.fetchTrendData(chartPeriod.value)
})

// Watch for transaction changes (using length to avoid deep comparison)
watch(
  () => transactionsStore.transactions.length,
  () => {
    updateFinancialHealth()
  }
)

onMounted(() => {
  refreshData()
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  background: transparent;
  min-height: 100vh;
}

// Header overrides for this page
.page-header {
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: var(--space-1);

    @media (min-width: 768px) {
      font-size: 2.5rem;
    }
  }

  .refresh-btn {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }
  }
}

// Health section - Main feature
.health-section {
  position: relative;
  z-index: 10;
  margin-bottom: var(--space-6);
}

// Pulse section
.pulse-section {
  margin-bottom: var(--space-6);
}

.dashboard-grid-2col {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
  
  @media (min-width: 900px) {
    grid-template-columns: 1fr 320px;
  }
}

.mini-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  
  @media (min-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.mini-stat {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  text-align: center;
  transition: all var(--duration-fast) var(--ease-out);
  
  &:hover {
    border-color: var(--color-border);
    box-shadow: var(--shadow-sm);
  }
  
  .mini-stat-value {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: var(--space-1);
    
    &.text-positive { color: #10B981; }
    &.text-negative { color: #EF4444; }
  }
  
  .mini-stat-label {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

// Charts section
.charts-section {
  margin-bottom: var(--space-6);
}

// Gauges section
.gauges-section {
  margin-bottom: var(--space-6);
}

.gauges-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
}

// Waterfall section
.waterfall-section {
  margin-bottom: var(--space-6);
}

// Heatmap section
.heatmap-section {
  margin-bottom: var(--space-6);
}

// Content section
.content-section {
  .sidebar-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }
}

// Alert card
.alert-card {
  background: linear-gradient(135deg, #FFF8E6 0%, #FFF2D6 100%);
  border: 1px solid rgba(255, 181, 69, 0.3);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  .alert-icon {
    width: 48px;
    height: 48px;
    background: var(--color-warning-bg);
    color: var(--color-warning-dark);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .alert-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  .alert-description {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    margin: var(--space-1) 0 0;
  }
}

// Transactions list
.transactions-list {
  padding: var(--space-3);
}

// Events list
.events-list {
  padding: var(--space-2);
}

.event-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-tertiary);

    .event-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .event-date {
    width: 44px;
    height: 44px;
    background: var(--color-accent);
    color: white;
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .event-day {
      font-size: 1.125rem;
      font-weight: 700;
      line-height: 1;
    }

    .event-month {
      font-size: 0.5625rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-top: 2px;
    }
  }

  .event-info {
    flex: 1;
    min-width: 0;

    .event-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }

    .event-time {
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
      margin: 2px 0 0;
    }
  }

  .event-arrow {
    color: var(--color-text-muted);
    opacity: 0;
    transform: translateX(-8px);
    transition: all var(--duration-fast) var(--ease-out);
  }
}
</style>
