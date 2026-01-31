<template>
  <q-page class="category-stats-page">
    <div class="page-header">
      <div class="row items-center">
        <q-btn flat round icon="arrow_back" color="white" @click="$router.back()" />
        <div class="q-ml-sm">
          <h1>{{ category?.name || 'Categoría' }}</h1>
          <p class="text-white-7">Desglose de {{ category?.type === 'income' ? 'ingresos' : 'gastos' }}</p>
        </div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Period selector -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row items-center q-gutter-md">
            <q-select
              v-model="selectedPeriod"
              :options="periodOptions"
              label="Período"
              outlined
              dense
              emit-value
              map-options
              style="min-width: 150px"
            />
            <q-select
              v-if="selectedPeriod === 'month'"
              v-model="selectedMonth"
              :options="monthOptions"
              label="Mes"
              outlined
              dense
              emit-value
              map-options
              style="min-width: 150px"
            />
            <q-select
              v-model="selectedYear"
              :options="yearOptions"
              label="Año"
              outlined
              dense
              emit-value
              map-options
              style="min-width: 100px"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Total summary -->
      <q-card class="summary-card q-mb-md">
        <q-card-section>
          <div class="row items-center justify-between">
            <div>
              <p class="text-caption text-grey-6">Total {{ category?.name }}</p>
              <p class="total-amount" :class="category?.type">
                {{ formatCurrency(totalAmount) }}
              </p>
              <p class="text-caption">{{ totalTransactions }} transacciones</p>
            </div>
            <q-avatar :style="{ background: category?.color }" size="56px" text-color="white">
              <q-icon :name="category?.icon || 'category'" size="28px" />
            </q-avatar>
          </div>
        </q-card-section>
      </q-card>

      <!-- Subcategories breakdown -->
      <q-card v-if="subcategoriesData.length > 0" class="q-mb-md">
        <q-card-section>
          <h3 class="section-title">Desglose por subcategoría</h3>
          <p class="text-caption text-grey-6 q-mb-md">
            Detalle de {{ category?.name }} por tipo específico
          </p>

          <div class="subcategories-list">
            <div
              v-for="sub in subcategoriesData"
              :key="sub.id"
              class="subcategory-item"
            >
              <div class="subcategory-info">
                <q-icon :name="sub.icon" :style="{ color: sub.color }" size="20px" />
                <div class="subcategory-details">
                  <p class="subcategory-name">{{ sub.name }}</p>
                  <p class="subcategory-count">{{ sub.count }} transacciones</p>
                </div>
              </div>
              <div class="subcategory-amount">
                <p class="amount" :class="category?.type">{{ formatCurrency(sub.total) }}</p>
                <p class="percentage">{{ sub.percentage.toFixed(1) }}%</p>
              </div>
              <q-linear-progress
                :value="sub.percentage / 100"
                :color="category?.type === 'income' ? 'positive' : 'negative'"
                class="subcategory-bar"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Trend Chart - Adapts to selected period -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm">
            <div>
              <h3 class="section-title">{{ chartTitle }}</h3>
              <p class="text-caption text-grey-6">
                {{ category?.type === 'income' ? 'Ingresos' : 'Gastos' }} de {{ category?.name }}
              </p>
            </div>
            <q-toggle
              v-if="selectedPeriod === 'year'"
              v-model="showYearComparison"
              label="Comparar años"
              dense
              color="primary"
            />
          </div>
          
          <!-- Year comparison legend (only for year view with comparison) -->
          <div v-if="selectedPeriod === 'year' && showYearComparison" class="year-legend q-mb-md">
            <div class="year-legend-item current">
              <span class="year-dot"></span>
              <span>{{ selectedYear }}</span>
            </div>
            <div class="year-legend-item previous">
              <span class="year-dot"></span>
              <span>{{ selectedYear - 1 }}</span>
            </div>
            <div v-if="hasThirdYear" class="year-legend-item older">
              <span class="year-dot"></span>
              <span>{{ selectedYear - 2 }}</span>
            </div>
          </div>
          
          <div class="trend-chart-container">
            <!-- Bar chart for month comparison -->
            <Bar v-if="selectedPeriod === 'month'" :data="trendChartData" :options="barChartOptions" />
            <!-- Line chart for year/all views -->
            <Line v-else :data="trendChartData" :options="lineChartOptions" />
          </div>
          
          <!-- Period totals comparison -->
          <div v-if="selectedPeriod !== 'all' && yearTotals.previous > 0" class="year-totals q-mt-md">
            <div class="year-total-item">
              <span class="year-label">{{ selectedPeriod === 'month' ? `${monthLabels[selectedMonth - 1]} ${selectedYear}` : selectedYear }}</span>
              <span class="year-amount" :class="category?.type">{{ formatCurrency(yearTotals.current) }}</span>
            </div>
            <div class="year-total-item">
              <span class="year-label">{{ selectedPeriod === 'month' ? `${monthLabels[selectedMonth - 1]} ${selectedYear - 1}` : selectedYear - 1 }}</span>
              <span class="year-amount muted">{{ formatCurrency(yearTotals.previous) }}</span>
              <span class="year-diff" :class="yearDiffClass">
                {{ yearDiffPercent }}
              </span>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Distribution Chart -->
      <q-card v-if="subcategoriesData.length > 0" class="q-mb-md">
        <q-card-section>
          <h3 class="section-title">Distribución por subcategoría</h3>
          <div class="chart-container">
            <Doughnut :data="chartData" :options="chartOptions" />
          </div>
        </q-card-section>
      </q-card>

      <!-- Recent transactions in this category -->
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <h3 class="section-title">Últimas transacciones</h3>
            <q-btn
              flat
              dense
              color="primary"
              label="Ver todas"
              no-caps
              :to="{ name: 'transactions', query: { categoryId: id } }"
            />
          </div>

          <q-list v-if="recentTransactions.length > 0" separator>
            <q-item
              v-for="txn in recentTransactions"
              :key="txn.id"
              clickable
              :to="{ name: 'transaction-detail', params: { id: txn.id } }"
            >
              <q-item-section avatar>
                <q-avatar
                  :color="txn.type === 'income' ? 'positive' : 'negative'"
                  text-color="white"
                  size="40px"
                >
                  <q-icon :name="getSubcategoryIcon(txn.categoryId)" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ txn.description }}</q-item-label>
                <q-item-label caption>
                  {{ getSubcategoryName(txn.categoryId) }} · {{ formatDate(txn.date) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label :class="txn.type === 'income' ? 'text-positive' : 'text-negative'">
                  {{ txn.type === 'income' ? '+' : '-' }}{{ formatCurrency(txn.amount) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-else class="text-center q-pa-lg text-grey-6">
            <q-icon name="receipt_long" size="48px" class="q-mb-sm" />
            <p>No hay transacciones en este período</p>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Doughnut, Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler
} from 'chart.js'
import { useCategoriesStore } from 'src/stores/categories'
import { useTransactionsStore } from 'src/stores/transactions'

ChartJS.register(ArcElement, BarElement, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

const props = defineProps<{ id?: string }>()

const categoriesStore = useCategoriesStore()
const transactionsStore = useTransactionsStore()

// Period selection
const selectedPeriod = ref<'month' | 'year' | 'all'>('year')
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const showYearComparison = ref(false)

const periodOptions = [
  { label: 'Este mes', value: 'month' },
  { label: 'Este año', value: 'year' },
  { label: 'Todo', value: 'all' }
]

const monthOptions = [
  { label: 'Enero', value: 1 },
  { label: 'Febrero', value: 2 },
  { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 },
  { label: 'Mayo', value: 5 },
  { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 },
  { label: 'Agosto', value: 8 },
  { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 },
  { label: 'Noviembre', value: 11 },
  { label: 'Diciembre', value: 12 }
]

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear, currentYear - 1, currentYear - 2].map(y => ({
    label: y.toString(),
    value: y
  }))
})

// Category data
const category = computed(() => categoriesStore.getCategoryById(props.id || ''))

const subcategories = computed(() => {
  if (!props.id) return []
  return categoriesStore.getSubcategories(props.id)
})

// Filter transactions by period and category (including subcategories)
const filteredTransactions = computed(() => {
  if (!props.id) return []
  
  const categoryIds = categoriesStore.getAllCategoryIds(props.id)
  
  return transactionsStore.transactions.filter(t => {
    // Check category
    if (!categoryIds.includes(t.categoryId)) return false
    
    // Check period
    const txnDate = new Date(t.date)
    if (selectedPeriod.value === 'month') {
      return txnDate.getMonth() + 1 === selectedMonth.value && 
             txnDate.getFullYear() === selectedYear.value
    } else if (selectedPeriod.value === 'year') {
      return txnDate.getFullYear() === selectedYear.value
    }
    return true
  })
})

// Total calculations
const totalAmount = computed(() => 
  filteredTransactions.value.reduce((sum, t) => sum + t.amount, 0)
)

const totalTransactions = computed(() => filteredTransactions.value.length)

// Subcategories breakdown
const subcategoriesData = computed(() => {
  if (subcategories.value.length === 0) return []
  
  const data = subcategories.value.map(sub => {
    const txns = filteredTransactions.value.filter(t => t.categoryId === sub.id)
    const total = txns.reduce((sum, t) => sum + t.amount, 0)
    
    return {
      id: sub.id,
      name: sub.name,
      icon: sub.icon,
      color: sub.color,
      total,
      count: txns.length,
      percentage: totalAmount.value > 0 ? (total / totalAmount.value) * 100 : 0
    }
  })
  
  // Add "direct" transactions (assigned to parent category, not subcategory)
  const directTxns = filteredTransactions.value.filter(t => t.categoryId === props.id)
  if (directTxns.length > 0) {
    const directTotal = directTxns.reduce((sum, t) => sum + t.amount, 0)
    data.push({
      id: 'direct',
      name: 'Sin subcategoría',
      icon: category.value?.icon || 'category',
      color: category.value?.color || '#9E9E9E',
      total: directTotal,
      count: directTxns.length,
      percentage: totalAmount.value > 0 ? (directTotal / totalAmount.value) * 100 : 0
    })
  }
  
  return data.sort((a, b) => b.total - a.total)
})

// Recent transactions
const recentTransactions = computed(() => 
  [...filteredTransactions.value]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
)

// Chart data
const chartData = computed(() => ({
  labels: subcategoriesData.value.map(s => s.name),
  datasets: [{
    data: subcategoriesData.value.map(s => s.total),
    backgroundColor: subcategoriesData.value.map(s => s.color),
    borderWidth: 0
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true
      }
    }
  }
}

// Trend chart data - Monthly evolution with year comparison
const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Get all transactions for this category
const categoryTransactions = computed(() => {
  if (!props.id) return []
  const categoryIds = categoriesStore.getAllCategoryIds(props.id)
  return transactionsStore.transactions.filter(t => categoryIds.includes(t.categoryId))
})

// Get monthly data for a specific year
function getYearMonthlyData(year: number): number[] {
  return monthLabels.map((_, monthIndex) => {
    return categoryTransactions.value
      .filter(t => {
        const txnDate = new Date(t.date)
        return txnDate.getFullYear() === year && txnDate.getMonth() === monthIndex
      })
      .reduce((sum, t) => sum + t.amount, 0)
  })
}

// Get data for a specific month across years
function getMonthAcrossYears(month: number): { year: number; total: number }[] {
  const years = new Set<number>()
  categoryTransactions.value.forEach(t => {
    const txnDate = new Date(t.date)
    if (txnDate.getMonth() === month - 1) {
      years.add(txnDate.getFullYear())
    }
  })
  
  return Array.from(years)
    .sort((a, b) => a - b)
    .map(year => ({
      year,
      total: categoryTransactions.value
        .filter(t => {
          const txnDate = new Date(t.date)
          return txnDate.getFullYear() === year && txnDate.getMonth() === month - 1
        })
        .reduce((sum, t) => sum + t.amount, 0)
    }))
}

// Get historical data (last 24 months)
function getHistoricalData(): { label: string; total: number }[] {
  const result: { label: string; total: number }[] = []
  const now = new Date()
  
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    
    const total = categoryTransactions.value
      .filter(t => {
        const txnDate = new Date(t.date)
        return txnDate.getFullYear() === year && txnDate.getMonth() === month
      })
      .reduce((sum, t) => sum + t.amount, 0)
    
    result.push({
      label: d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
      total
    })
  }
  
  return result
}

// Check if we have data for 2 years ago
const hasThirdYear = computed(() => {
  const twoYearsAgo = selectedYear.value - 2
  return categoryTransactions.value.some(t => {
    const txnDate = new Date(t.date)
    return txnDate.getFullYear() === twoYearsAgo
  })
})

// Year/period totals for comparison
const yearTotals = computed(() => {
  if (selectedPeriod.value === 'month') {
    // Compare same month across years
    const monthData = getMonthAcrossYears(selectedMonth.value)
    const currentYearData = monthData.find(d => d.year === selectedYear.value)
    const previousYearData = monthData.find(d => d.year === selectedYear.value - 1)
    return {
      current: currentYearData?.total || 0,
      previous: previousYearData?.total || 0
    }
  } else {
    const currentData = getYearMonthlyData(selectedYear.value)
    const previousData = getYearMonthlyData(selectedYear.value - 1)
    return {
      current: currentData.reduce((a, b) => a + b, 0),
      previous: previousData.reduce((a, b) => a + b, 0)
    }
  }
})

const yearDiffPercent = computed(() => {
  const { current, previous } = yearTotals.value
  if (previous === 0) return current > 0 ? '+∞' : '0%'
  const diff = ((current - previous) / previous) * 100
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(1)}%`
})

const yearDiffClass = computed(() => {
  const { current, previous } = yearTotals.value
  const isIncome = category.value?.type === 'income'
  const isUp = current >= previous
  // For income, up is good. For expenses, down is good.
  if (isIncome) return isUp ? 'positive' : 'negative'
  return isUp ? 'negative' : 'positive'
})

// Chart title based on period
const chartTitle = computed(() => {
  if (selectedPeriod.value === 'month') {
    return `${monthLabels[selectedMonth.value - 1]} - Comparativa anual`
  } else if (selectedPeriod.value === 'year') {
    return `Evolución mensual ${selectedYear.value}`
  }
  return 'Evolución histórica (24 meses)'
})

const trendChartData = computed(() => {
  const isIncome = category.value?.type === 'income'
  const currentYear = selectedYear.value
  
  // Colors
  const colors = {
    current: isIncome ? '#00D4AA' : '#FF6B6B',
    previous: isIncome ? '#80EAD5' : '#FFB3B3',
    older: isIncome ? '#B3F2E6' : '#FFD9D9'
  }
  
  // CASE 1: "Este mes" - Show bar comparison of same month across years
  if (selectedPeriod.value === 'month') {
    const monthData = getMonthAcrossYears(selectedMonth.value)
    
    return {
      labels: monthData.map(d => d.year.toString()),
      datasets: [{
        label: monthLabels[selectedMonth.value - 1],
        data: monthData.map(d => d.total),
        backgroundColor: monthData.map(d => 
          d.year === currentYear ? colors.current : 
          d.year === currentYear - 1 ? colors.previous : colors.older
        ),
        borderRadius: 8,
        barThickness: 40
      }]
    }
  }
  
  // CASE 2: "Todo" - Show historical evolution (last 24 months)
  if (selectedPeriod.value === 'all') {
    const historicalData = getHistoricalData()
    
    return {
      labels: historicalData.map(d => d.label),
      datasets: [{
        label: category.value?.name || 'Categoría',
        data: historicalData.map(d => d.total),
        borderColor: colors.current,
        backgroundColor: isIncome ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 107, 107, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 2
      }]
    }
  }
  
  // CASE 3: "Este año" - Show monthly evolution with year comparison
  const datasets = []
  
  // Current year (always shown)
  datasets.push({
    label: `${currentYear}`,
    data: getYearMonthlyData(currentYear),
    borderColor: colors.current,
    backgroundColor: isIncome ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 107, 107, 0.1)',
    tension: 0.4,
    fill: !showYearComparison.value,
    pointRadius: 4,
    pointHoverRadius: 6,
    borderWidth: 3
  })
  
  // Previous year (if comparison enabled)
  if (showYearComparison.value) {
    datasets.push({
      label: `${currentYear - 1}`,
      data: getYearMonthlyData(currentYear - 1),
      borderColor: colors.previous,
      backgroundColor: 'transparent',
      tension: 0.4,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2,
      borderDash: [5, 5]
    })
    
    // Two years ago (if we have data)
    if (hasThirdYear.value) {
      datasets.push({
        label: `${currentYear - 2}`,
        data: getYearMonthlyData(currentYear - 2),
        borderColor: colors.older,
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderWidth: 1.5,
        borderDash: [2, 2]
      })
    }
  }
  
  return {
    labels: monthLabels,
    datasets
  }
})

const lineChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  plugins: {
    legend: {
      display: showYearComparison.value,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: { dataset: { label: string }, parsed: { y: number } }) {
          return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: number) {
          if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`
          return `${value}€`
        }
      }
    }
  }
}))

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context: { parsed: { y: number } }) {
          return formatCurrency(context.parsed.y)
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: number) {
          if (value >= 1000) return `${(value / 1000).toFixed(0)}k€`
          return `${value}€`
        }
      }
    }
  }
}

// Helpers
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function getSubcategoryName(categoryId: string): string {
  const cat = categoriesStore.getCategoryById(categoryId)
  return cat?.name || 'Sin categoría'
}

function getSubcategoryIcon(categoryId: string): string {
  const cat = categoriesStore.getCategoryById(categoryId)
  return cat?.icon || 'category'
}

// Load data
onMounted(async () => {
  await Promise.all([
    categoriesStore.fetchCategories(),
    transactionsStore.fetchTransactions({})
  ])
})

// Reload when period changes
watch([selectedPeriod, selectedMonth, selectedYear], () => {
  // Data is reactive, no need to reload
})
</script>

<style lang="scss" scoped>
.category-stats-page {
  background: var(--color-background);
}

.page-content {
  max-width: 800px;
  margin: 0 auto;
}

.summary-card {
  .total-amount {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    margin: 4px 0;
    
    &.income {
      color: var(--q-positive);
    }
    
    &.expense {
      color: var(--q-negative);
    }
  }
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.subcategories-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.subcategory-item {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 8px;
  padding: 12px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  
  .subcategory-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .subcategory-details {
      .subcategory-name {
        font-weight: 500;
        margin: 0;
      }
      
      .subcategory-count {
        font-size: 0.75rem;
        color: var(--color-text-tertiary);
        margin: 0;
      }
    }
  }
  
  .subcategory-amount {
    text-align: right;
    
    .amount {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      margin: 0;
      
      &.income {
        color: var(--q-positive);
      }
      
      &.expense {
        color: var(--q-negative);
      }
    }
    
    .percentage {
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
      margin: 0;
    }
  }
  
  .subcategory-bar {
    grid-column: 1 / -1;
    border-radius: 4px;
  }
}

.chart-container {
  max-width: 300px;
  margin: 0 auto;
}

.trend-chart-container {
  height: 280px;
  position: relative;
}

// Year comparison styles
.year-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.year-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  
  .year-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  
  &.current .year-dot {
    background: var(--q-negative);
  }
  
  &.previous .year-dot {
    background: #FFB3B3;
    border: 1px dashed #FFB3B3;
  }
  
  &.older .year-dot {
    background: #FFD9D9;
    border: 1px dotted #FFD9D9;
  }
}

// For income categories, adjust colors
.category-stats-page:has(.total-amount.income) {
  .year-legend-item {
    &.current .year-dot {
      background: var(--q-positive);
    }
    
    &.previous .year-dot {
      background: #80EAD5;
    }
    
    &.older .year-dot {
      background: #B3F2E6;
    }
  }
}

.year-totals {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 12px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.year-total-item {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .year-label {
    font-size: 0.8125rem;
    color: var(--color-text-tertiary);
    font-weight: 500;
  }
  
  .year-amount {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    
    &.income {
      color: var(--q-positive);
    }
    
    &.expense {
      color: var(--q-negative);
    }
    
    &.muted {
      color: var(--color-text-secondary);
    }
  }
  
  .year-diff {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    
    &.positive {
      color: var(--q-positive);
      background: rgba(0, 212, 170, 0.15);
    }
    
    &.negative {
      color: var(--q-negative);
      background: rgba(255, 107, 107, 0.15);
    }
  }
}
</style>
