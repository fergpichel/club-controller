<template>
  <q-page class="financial-overview-page">
    <!-- Header -->
    <header class="page-header overview-header">
      <div class="header-content">
        <div class="header-left">
          <p class="header-eyebrow">Cuadro de Mando</p>
          <h1>Análisis Financiero</h1>
          <p class="header-subtitle">Visión integral de ingresos, gastos y proyecciones</p>
        </div>
        <div class="header-right">
          <q-select
            v-model="primarySeason"
            :options="seasonOptions"
            label="Temporada"
            outlined
            dense
            emit-value
            map-options
            dark
            class="season-select"
          />
        </div>
      </div>
    </header>

    <div class="page-content">
      <!-- Tabs -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <q-icon :name="tab.icon" size="18px" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- TAB 1: Evolución -->
      <div v-if="activeTab === 'evolution'" class="tab-content">
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card income">
            <div class="kpi-icon"><q-icon name="trending_up" /></div>
            <div class="kpi-body">
              <span class="kpi-label">Ingresos</span>
              <span class="kpi-value positive">{{ formatCurrency(kpis.income) }}</span>
              <span v-if="kpis.incomeChange !== null" class="kpi-change" :class="kpis.incomeChange >= 0 ? 'up' : 'down'">
                <q-icon :name="kpis.incomeChange >= 0 ? 'arrow_upward' : 'arrow_downward'" size="14px" />
                {{ Math.abs(kpis.incomeChange).toFixed(1) }}% vs anterior
              </span>
            </div>
          </div>
          <div class="kpi-card expense">
            <div class="kpi-icon"><q-icon name="trending_down" /></div>
            <div class="kpi-body">
              <span class="kpi-label">Gastos</span>
              <span class="kpi-value negative">{{ formatCurrency(kpis.expenses) }}</span>
              <span v-if="kpis.expenseChange !== null" class="kpi-change" :class="kpis.expenseChange <= 0 ? 'up' : 'down'">
                <q-icon :name="kpis.expenseChange <= 0 ? 'arrow_downward' : 'arrow_upward'" size="14px" />
                {{ Math.abs(kpis.expenseChange).toFixed(1) }}% vs anterior
              </span>
            </div>
          </div>
          <div class="kpi-card balance">
            <div class="kpi-icon"><q-icon name="account_balance" /></div>
            <div class="kpi-body">
              <span class="kpi-label">Balance neto</span>
              <span class="kpi-value" :class="kpis.balance >= 0 ? 'positive' : 'negative'">{{ formatCurrency(kpis.balance) }}</span>
            </div>
          </div>
          <div v-if="hasBudget" class="kpi-card budget">
            <div class="kpi-icon"><q-icon name="savings" /></div>
            <div class="kpi-body">
              <span class="kpi-label">Desviación presupuesto</span>
              <span class="kpi-value" :class="kpis.budgetDeviation >= 0 ? 'positive' : 'negative'">
                {{ kpis.budgetDeviation >= 0 ? '+' : '' }}{{ formatCurrency(kpis.budgetDeviation) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-panel" :class="{ expanded: showFilters }">
          <button class="filters-toggle" @click="showFilters = !showFilters">
            <q-icon name="filter_list" size="18px" />
            <span>Filtros</span>
            <q-badge v-if="activeFilterCount > 0" color="accent" text-color="white" :label="activeFilterCount" class="q-ml-sm" />
            <q-icon :name="showFilters ? 'expand_less' : 'expand_more'" size="18px" class="q-ml-auto" />
          </button>
          <div v-show="showFilters" class="filters-body">
            <div class="filters-grid">
              <q-select
                v-model="filters.categoryIds"
                :options="categoryOptions"
                label="Categorías"
                outlined
                dense
                multiple
                emit-value
                map-options
                clearable
                use-chips
                class="filter-field"
              >
                <template #prepend><q-icon name="category" size="18px" /></template>
              </q-select>
              <q-select
                v-model="filters.projectIds"
                :options="projectOptions"
                label="Proyectos"
                outlined
                dense
                multiple
                emit-value
                map-options
                clearable
                use-chips
                class="filter-field"
              >
                <template #prepend><q-icon name="folder" size="18px" /></template>
              </q-select>
              <q-select
                v-model="filters.eventIds"
                :options="eventOptions"
                label="Eventos"
                outlined
                dense
                multiple
                emit-value
                map-options
                clearable
                use-chips
                class="filter-field"
              >
                <template #prepend><q-icon name="event" size="18px" /></template>
              </q-select>
              <q-select
                v-model="filters.ageCategoryIds"
                :options="ageCategoryOptions"
                label="Categoría de edad"
                outlined
                dense
                multiple
                emit-value
                map-options
                clearable
                use-chips
                class="filter-field"
              >
                <template #prepend><q-icon name="groups" size="18px" /></template>
              </q-select>
              <q-select
                v-model="filters.teamIds"
                :options="teamOptionsForSeason"
                label="Equipos"
                outlined
                dense
                multiple
                emit-value
                map-options
                clearable
                use-chips
                class="filter-field"
              >
                <template #prepend><q-icon name="shield" size="18px" /></template>
              </q-select>
            </div>
            <div class="filters-actions">
              <q-btn flat dense no-caps label="Limpiar filtros" icon="clear_all" size="sm" @click="clearFilters" />
            </div>
          </div>
        </div>

        <!-- Comparison selector -->
        <div class="comparison-bar">
          <div class="comparison-left">
            <span class="comparison-label">Comparar con:</span>
            <div class="comparison-chips">
              <button
                v-for="option in comparisonOptions"
                :key="option.value"
                class="comparison-chip"
                :class="{ active: comparisonSeasons.includes(option.value) }"
                @click="toggleComparison(option.value)"
              >
                <span class="chip-dot" :style="{ background: option.color }"></span>
                {{ option.label }}
              </button>
            </div>
          </div>
          <div class="comparison-right">
            <div class="metric-toggle">
              <button
                v-for="m in metricOptions"
                :key="m.value"
                :class="{ active: selectedMetric === m.value }"
                @click="selectedMetric = m.value"
              >
                {{ m.label }}
              </button>
            </div>
            <div class="view-toggle">
              <q-btn
                flat
                dense
                round
                :icon="showCumulative ? 'show_chart' : 'bar_chart'"
                size="sm"
                @click="showCumulative = !showCumulative"
              >
                <q-tooltip>{{ showCumulative ? 'Acumulado' : 'Mensual' }}</q-tooltip>
              </q-btn>
              <q-btn
                v-if="hasBudget"
                flat
                dense
                round
                icon="savings"
                size="sm"
                :color="showBudgetLine ? 'accent' : 'grey'"
                @click="showBudgetLine = !showBudgetLine"
              >
                <q-tooltip>{{ showBudgetLine ? 'Ocultar presupuesto' : 'Mostrar presupuesto' }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Main Chart -->
        <div class="main-chart-card">
          <div v-if="loadingData" class="chart-loading">
            <q-spinner-dots size="40px" color="accent" />
            <span>Cargando datos financieros...</span>
          </div>
          <div v-else class="chart-wrapper">
            <Line :data="mainChartData" :options="mainChartOptions" />
          </div>
        </div>

        <!-- Monthly Summary Table -->
        <div class="summary-table-card">
          <div class="table-header-bar">
            <h3>Resumen mensual</h3>
            <q-btn flat dense no-caps icon="download" label="Exportar" size="sm" @click="exportSummary" />
          </div>
          <div class="table-scroll">
            <table class="summary-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th class="text-right">Ingresos</th>
                  <th class="text-right">Gastos</th>
                  <th class="text-right">Balance</th>
                  <th v-if="hasBudget && showBudgetLine" class="text-right">Presupuesto</th>
                  <th v-if="hasBudget && showBudgetLine" class="text-right">Desviación</th>
                  <th v-for="cs in comparisonSeasons" :key="cs" class="text-right comparison-col">
                    {{ cs }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in tableRows" :key="idx" :class="{ future: row.isFuture }">
                  <td class="month-cell">{{ row.monthName }}</td>
                  <td class="text-right">
                    <span class="positive">{{ row.isFuture ? '-' : formatCurrency(row.income) }}</span>
                  </td>
                  <td class="text-right">
                    <span class="negative">{{ row.isFuture ? '-' : formatCurrency(row.expenses) }}</span>
                  </td>
                  <td class="text-right">
                    <span :class="row.balance >= 0 ? 'positive' : 'negative'">
                      {{ row.isFuture ? '-' : formatCurrency(row.balance) }}
                    </span>
                  </td>
                  <td v-if="hasBudget && showBudgetLine" class="text-right">
                    {{ formatCurrency(row.budgetBalance) }}
                  </td>
                  <td v-if="hasBudget && showBudgetLine" class="text-right">
                    <span :class="row.deviation >= 0 ? 'positive' : 'negative'">
                      {{ row.isFuture ? '-' : (row.deviation >= 0 ? '+' : '') + formatCurrency(row.deviation) }}
                    </span>
                  </td>
                  <td v-for="cs in comparisonSeasons" :key="cs" class="text-right comparison-col">
                    <span class="muted">{{ formatCurrency(row.comparisons[cs] || 0) }}</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td><strong>Total</strong></td>
                  <td class="text-right"><strong class="positive">{{ formatCurrency(totals.income) }}</strong></td>
                  <td class="text-right"><strong class="negative">{{ formatCurrency(totals.expenses) }}</strong></td>
                  <td class="text-right">
                    <strong :class="totals.balance >= 0 ? 'positive' : 'negative'">{{ formatCurrency(totals.balance) }}</strong>
                  </td>
                  <td v-if="hasBudget && showBudgetLine" class="text-right"><strong>{{ formatCurrency(totals.budgetBalance) }}</strong></td>
                  <td v-if="hasBudget && showBudgetLine" class="text-right">
                    <strong :class="totals.deviation >= 0 ? 'positive' : 'negative'">
                      {{ (totals.deviation >= 0 ? '+' : '') + formatCurrency(totals.deviation) }}
                    </strong>
                  </td>
                  <td v-for="cs in comparisonSeasons" :key="cs" class="text-right comparison-col">
                    <strong class="muted">{{ formatCurrency(totals.comparisons[cs] || 0) }}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: Presupuesto -->
      <div v-if="activeTab === 'budget'" class="tab-content">
        <div v-if="!hasBudget" class="empty-state">
          <q-icon name="savings" size="64px" color="grey-5" />
          <h3>Sin presupuesto configurado</h3>
          <p>Configura el presupuesto para la temporada {{ primarySeason }} para ver la comparativa.</p>
          <q-btn color="accent" no-caps unelevated :to="{ name: 'budget' }" label="Ir a Presupuesto" icon="settings" />
        </div>

        <div v-else class="budget-content">
          <!-- Budget vs Actual Chart -->
          <div class="main-chart-card">
            <div class="chart-title-row">
              <h3>Real vs Presupuestado</h3>
              <div class="metric-toggle">
                <button
                  v-for="m in budgetMetricOptions"
                  :key="m.value"
                  :class="{ active: budgetMetric === m.value }"
                  @click="budgetMetric = m.value"
                >
                  {{ m.label }}
                </button>
              </div>
            </div>
            <div class="chart-wrapper">
              <Bar :data="budgetChartData" :options="budgetChartOptions" />
            </div>
          </div>

          <!-- Budget Variance Cards -->
          <div class="variance-grid">
            <div class="variance-card" v-for="cat in budgetVarianceByCategory" :key="cat.categoryId">
              <div class="variance-header">
                <q-icon :name="cat.icon" :style="{ color: cat.color }" size="20px" />
                <span class="variance-name">{{ cat.name }}</span>
                <q-badge
                  :color="cat.variance >= 0 ? 'positive' : 'negative'"
                  text-color="white"
                  :label="(cat.variance >= 0 ? '+' : '') + cat.variance.toFixed(1) + '%'"
                />
              </div>
              <div class="variance-bar-row">
                <div class="variance-bar">
                  <div
                    class="variance-fill"
                    :style="{ width: Math.min(cat.executionPercent, 100) + '%', background: cat.executionPercent > 100 ? '#EF4444' : '#635BFF' }"
                  ></div>
                </div>
                <span class="variance-percent">{{ cat.executionPercent.toFixed(0) }}%</span>
              </div>
              <div class="variance-amounts">
                <span>Real: {{ formatCurrency(cat.actual) }}</span>
                <span>Ppto: {{ formatCurrency(cat.budgeted) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Simulador -->
      <div v-if="activeTab === 'simulator'" class="tab-content">
        <WhatIfSimulator />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData
} from 'chart.js'
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore'
import { db } from 'src/boot/firebase'
import { format } from 'date-fns'
import { useAuthStore } from 'src/stores/auth'
import { useCategoriesStore } from 'src/stores/categories'
import { useTeamsStore } from 'src/stores/teams'
import { useBudgetStore } from 'src/stores/budget'
import { useCatalogsStore } from 'src/stores/catalogs'
import { computeSeason, getSeasonOptions, getSeasonDates } from 'src/types'
import type { Season } from 'src/types'
import { formatCurrency } from 'src/utils/formatters'
import WhatIfSimulator from 'src/components/WhatIfSimulator.vue'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// ─── STORES ────────────────────────────────────────────
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()
const teamsStore = useTeamsStore()
const budgetStore = useBudgetStore()
const catalogsStore = useCatalogsStore()

// ─── STATE ─────────────────────────────────────────────
const activeTab = ref<'evolution' | 'budget' | 'simulator'>('evolution')
const primarySeason = ref<Season>(computeSeason(new Date()))
const comparisonSeasons = ref<Season[]>([])
const selectedMetric = ref<'income' | 'expenses' | 'balance'>('balance')
const budgetMetric = ref<'income' | 'expenses' | 'both'>('both')
const showCumulative = ref(false)
const showBudgetLine = ref(false)
const showFilters = ref(false)
const loadingData = ref(false)

const filters = reactive({
  categoryIds: [] as string[],
  projectIds: [] as string[],
  eventIds: [] as string[],
  ageCategoryIds: [] as string[],
  teamIds: [] as string[]
})

// ─── TABS ──────────────────────────────────────────────
const tabs = [
  { id: 'evolution' as const, label: 'Evolución', icon: 'show_chart' },
  { id: 'budget' as const, label: 'Presupuesto', icon: 'savings' },
  { id: 'simulator' as const, label: 'Simulador', icon: 'psychology' }
]

// ─── SEASON OPTIONS ────────────────────────────────────
const seasonOptions = getSeasonOptions(6)

const metricOptions = [
  { value: 'income' as const, label: 'Ingresos' },
  { value: 'expenses' as const, label: 'Gastos' },
  { value: 'balance' as const, label: 'Balance' }
]

const budgetMetricOptions = [
  { value: 'income' as const, label: 'Ingresos' },
  { value: 'expenses' as const, label: 'Gastos' },
  { value: 'both' as const, label: 'Ambos' }
]

// Season comparison color palette (from vibrant → faded)
const comparisonColors = [
  { line: '#A3ACB9', fill: 'rgba(163, 172, 185, 0.08)' },
  { line: '#C4B5FD', fill: 'rgba(196, 181, 253, 0.06)' },
  { line: '#93C5FD', fill: 'rgba(147, 197, 253, 0.05)' }
]

// Primary colors per metric
const primaryColors: Record<string, { income: string; expenses: string; balance: string }> = {
  line: { income: '#10B981', expenses: '#EF4444', balance: '#635BFF' },
  fill: { income: 'rgba(16, 185, 129, 0.12)', expenses: 'rgba(239, 68, 68, 0.12)', balance: 'rgba(99, 91, 255, 0.12)' }
}

// ─── COMPARISON OPTIONS ────────────────────────────────
const comparisonOptions = computed(() => {
  const startYear = parseInt(primarySeason.value.split('/')[0])
  const options = []
  for (let i = 1; i <= 3; i++) {
    const y = startYear - i
    if (y >= 2018) {
      const season = `${y}/${String(y + 1).slice(-2)}`
      options.push({
        value: season,
        label: season,
        color: comparisonColors[i - 1]?.line || '#CCC'
      })
    }
  }
  return options
})

// ─── FILTER OPTIONS ────────────────────────────────────
const categoryOptions = computed(() => {
  const tree = categoriesStore.getCategoriesTree('income')
  const treeExpense = categoriesStore.getCategoriesTree('expense')
  const opts: { label: string; value: string }[] = []

  const addTree = (items: typeof tree, prefix: string) => {
    items.forEach(parent => {
      opts.push({ label: `${prefix} ${parent.name}`, value: parent.id })
      parent.subcategories.forEach(sub => {
        opts.push({ label: `  ↳ ${sub.name}`, value: sub.id })
      })
    })
  }

  addTree(tree, '📈')
  addTree(treeExpense, '📉')
  return opts
})

const projectOptions = computed(() =>
  teamsStore.projects.map(p => ({ label: p.name, value: p.id }))
)

const eventOptions = computed(() =>
  teamsStore.events.map(e => ({ label: e.name, value: e.id }))
)

const ageCategoryOptions = computed(() =>
  catalogsStore.activeAgeCategories.map(ac => ({ label: ac.name, value: ac.id }))
)

const teamOptionsForSeason = computed(() => {
  // Show teams from the primary season + comparison seasons
  const allSeasons = [primarySeason.value, ...comparisonSeasons.value]
  const seen = new Set<string>()
  const opts: { label: string; value: string }[] = []
  for (const season of allSeasons) {
    const teams = teamsStore.getTeamsBySeason(season)
    for (const t of teams) {
      if (!seen.has(t.id)) {
        seen.add(t.id)
        opts.push({ label: `${t.name} (${season})`, value: t.id })
      }
    }
  }
  return opts
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.categoryIds.length) count++
  if (filters.projectIds.length) count++
  if (filters.eventIds.length) count++
  if (filters.ageCategoryIds.length) count++
  if (filters.teamIds.length) count++
  return count
})

// ─── DATA ──────────────────────────────────────────────
// Season months: July → June
const seasonMonthsFull = ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio']
const seasonMonthsShort = ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']

interface MonthBucket { income: number; expenses: number; balance: number }

const primaryData = ref<MonthBucket[]>(emptyMonths())
const comparisonData = ref<Record<Season, MonthBucket[]>>({})
const budgetMonthly = ref<MonthBucket[]>(emptyMonths())
// Per-category actuals for budget variance
const categoryActuals = ref<Record<string, number>>({})

function emptyMonths(): MonthBucket[] {
  return Array.from({ length: 12 }, () => ({ income: 0, expenses: 0, balance: 0 }))
}

// ─── BUDGET ────────────────────────────────────────────
const hasBudget = computed(() => {
  const budget = budgetStore.getBudgetForSeason(primarySeason.value)
  return !!budget
})

// ─── FETCH DATA ────────────────────────────────────────
async function fetchSeasonData(season: Season, trackCategoryActuals = false): Promise<MonthBucket[]> {
  if (!authStore.clubId) return emptyMonths()

  const dates = getSeasonDates(season)
  const startYear = parseInt(season.split('/')[0])

  // Generate month keys in season order (Jul → Jun)
  const monthKeys: string[] = []
  for (let m = 6; m < 12; m++) monthKeys.push(format(new Date(startYear, m, 1), 'yyyy-MM'))
  for (let m = 0; m < 6; m++) monthKeys.push(format(new Date(startYear + 1, m, 1), 'yyyy-MM'))

  const buckets: Record<string, MonthBucket> = {}
  monthKeys.forEach(k => { buckets[k] = { income: 0, expenses: 0, balance: 0 } })

  // Track per-category actuals for budget variance
  const catActuals: Record<string, number> = {}

  const q = query(
    collection(db, 'transactions'),
    where('clubId', '==', authStore.clubId),
    where('status', 'in', ['approved', 'pending', 'paid']),
    where('date', '>=', Timestamp.fromDate(dates.start)),
    where('date', '<=', Timestamp.fromDate(dates.end))
  )

  const snapshot = await getDocs(q)
  snapshot.forEach(docSnap => {
    const data = docSnap.data()
    const txDate = data.date?.toDate() || new Date()
    const key = format(txDate, 'yyyy-MM')

    // Apply filters
    if (!passesFilters(data)) return

    if (buckets[key]) {
      if (data.type === 'income') {
        buckets[key].income += data.amount || 0
      } else {
        buckets[key].expenses += data.amount || 0
      }
    }

    // Track per-category for budget variance
    if (trackCategoryActuals) {
      const catId = data.categoryId as string
      if (catId) {
        // Roll up subcategory to parent
        const cat = categoriesStore.getCategoryById(catId)
        const parentId = cat?.parentId || catId
        catActuals[parentId] = (catActuals[parentId] || 0) + (data.amount || 0)
        // Also keep the specific ID for direct matches
        if (catId !== parentId) {
          catActuals[catId] = (catActuals[catId] || 0) + (data.amount || 0)
        }
      }
    }
  })

  if (trackCategoryActuals) {
    categoryActuals.value = catActuals
  }

  return monthKeys.map(k => {
    buckets[k].balance = buckets[k].income - buckets[k].expenses
    return buckets[k]
  })
}

function passesFilters(data: Record<string, unknown>): boolean {
  // Category filter
  if (filters.categoryIds.length > 0) {
    const txCatId = data.categoryId as string
    // Check if the transaction's category or its parent matches
    if (!filters.categoryIds.includes(txCatId)) {
      const cat = categoriesStore.getCategoryById(txCatId)
      if (!cat?.parentId || !filters.categoryIds.includes(cat.parentId)) {
        return false
      }
    }
  }

  // Project filter
  if (filters.projectIds.length > 0) {
    if (!filters.projectIds.includes(data.projectId as string)) return false
  }

  // Event filter
  if (filters.eventIds.length > 0) {
    if (!filters.eventIds.includes(data.eventId as string)) return false
  }

  // Team filter
  if (filters.teamIds.length > 0) {
    if (!filters.teamIds.includes(data.teamId as string)) return false
  }

  // Age category filter — match via team's ageCategoryId
  if (filters.ageCategoryIds.length > 0) {
    const teamId = data.teamId as string
    if (!teamId) return false
    const team = teamsStore.teams.find(t => t.id === teamId)
    if (!team?.ageCategoryId || !filters.ageCategoryIds.includes(team.ageCategoryId)) {
      return false
    }
  }

  return true
}

function computeBudgetMonthly(): MonthBucket[] {
  const budget = budgetStore.getBudgetForSeason(primarySeason.value)
  if (!budget) return emptyMonths()

  const monthlyIncome = budget.incomeAllocations.reduce((s, a) => s + a.amount, 0) / 12
  const monthlyExpense = budget.expenseAllocations.reduce((s, a) => s + a.amount, 0) / 12

  return Array.from({ length: 12 }, () => ({
    income: Math.round(monthlyIncome),
    expenses: Math.round(monthlyExpense),
    balance: Math.round(monthlyIncome - monthlyExpense)
  }))
}

async function loadAllData() {
  loadingData.value = true
  try {
    // Fetch primary season (track per-category actuals for budget tab)
    primaryData.value = await fetchSeasonData(primarySeason.value, true)

    // Fetch comparison seasons
    const compData: Record<Season, MonthBucket[]> = {}
    await Promise.all(
      comparisonSeasons.value.map(async (season) => {
        compData[season] = await fetchSeasonData(season)
      })
    )
    comparisonData.value = compData

    // Budget
    budgetMonthly.value = computeBudgetMonthly()
  } finally {
    loadingData.value = false
  }
}

// ─── KPIs ──────────────────────────────────────────────
const kpis = computed(() => {
  const now = new Date()
  const jsMonth = now.getMonth()
  const currentMonthInSeason = jsMonth >= 6 ? jsMonth - 6 : jsMonth + 6

  // Only sum up to current month (not future)
  let income = 0, expenses = 0
  primaryData.value.forEach((m, idx) => {
    if (idx <= currentMonthInSeason) {
      income += m.income
      expenses += m.expenses
    }
  })

  // Previous season for change calculation
  const prevSeason = comparisonOptions.value[0]?.value
  const prevData = comparisonData.value[prevSeason]
  let prevIncome = 0, prevExpenses = 0
  if (prevData) {
    prevData.forEach((m, idx) => {
      if (idx <= currentMonthInSeason) {
        prevIncome += m.income
        prevExpenses += m.expenses
      }
    })
  }

  const incomeChange = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : null
  const expenseChange = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : null

  // Budget deviation
  let budgetDeviation = 0
  if (hasBudget.value) {
    let budgetedBalance = 0
    budgetMonthly.value.forEach((m, idx) => {
      if (idx <= currentMonthInSeason) {
        budgetedBalance += m.balance
      }
    })
    budgetDeviation = (income - expenses) - budgetedBalance
  }

  return {
    income,
    expenses,
    balance: income - expenses,
    incomeChange,
    expenseChange,
    budgetDeviation
  }
})

// ─── CHART DATA ────────────────────────────────────────
const mainChartData = computed((): ChartData<'line'> => {
  const labels = seasonMonthsShort
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasets: any[] = []

  const now = new Date()
  const jsMonth = now.getMonth()
  const currentMonthInSeason = jsMonth >= 6 ? jsMonth - 6 : jsMonth + 6

  // Helper to get metric value
  const getVal = (m: MonthBucket, metric: string) => {
    if (metric === 'income') return m.income
    if (metric === 'expenses') return m.expenses
    return m.balance
  }

  // Transform to cumulative if needed
  const toCumulative = (arr: (number | null)[]) => {
    let sum = 0
    return arr.map(v => {
      if (v === null) return null
      sum += v
      return sum
    })
  }

  // Primary season data
  const primaryValues = primaryData.value.map((m, idx) => {
    if (idx > currentMonthInSeason) return null
    return getVal(m, selectedMetric.value)
  })

  const finalPrimary = showCumulative.value ? toCumulative(primaryValues) : primaryValues
  const metricColor = primaryColors.line[selectedMetric.value]
  const metricFill = primaryColors.fill[selectedMetric.value]

  datasets.push({
    label: `${primarySeason.value}`,
    data: finalPrimary,
    borderColor: metricColor,
    backgroundColor: metricFill,
    fill: true,
    tension: 0.4,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: metricColor,
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    borderWidth: 3
  })

  // Budget line
  if (showBudgetLine.value && hasBudget.value) {
    const budgetValues = budgetMonthly.value.map(m => getVal(m, selectedMetric.value))
    const finalBudget = showCumulative.value ? toCumulative(budgetValues) : budgetValues

    datasets.push({
      label: 'Presupuesto',
      data: finalBudget,
      borderColor: '#F59E0B',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 4,
      borderWidth: 2,
      borderDash: [8, 4]
    })
  }

  // Comparison seasons
  comparisonSeasons.value.forEach((season, idx) => {
    const data = comparisonData.value[season]
    if (!data) return

    const values = data.map(m => getVal(m, selectedMetric.value))
    const finalValues = showCumulative.value ? toCumulative(values) : values
    const color = comparisonColors[idx] || { line: '#CCC', fill: 'transparent' }

    datasets.push({
      label: season,
      data: finalValues,
      borderColor: color.line,
      backgroundColor: color.fill,
      fill: false,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 4,
      pointBackgroundColor: color.line,
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      borderWidth: 2,
      borderDash: [5, 5]
    })
  })

  return { labels, datasets }
})

const mainChartOptions = computed(() => ({
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
      padding: 14,
      cornerRadius: 10,
      titleFont: { family: 'Inter', size: 13, weight: '600' as const },
      bodyFont: { family: 'Inter', size: 12 },
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
          if (Math.abs(numValue) >= 1_000_000) return `${(numValue / 1_000_000).toFixed(1)}M€`
          if (Math.abs(numValue) >= 1_000) return `${(numValue / 1_000).toFixed(0)}k€`
          return `${numValue}€`
        }
      }
    }
  }
}))

// ─── BUDGET CHART (TAB 2) ──────────────────────────────
const budgetChartData = computed((): ChartData<'bar'> => {
  const labels = seasonMonthsShort
  const budget = budgetStore.getBudgetForSeason(primarySeason.value)
  if (!budget) return { labels, datasets: [] }

  const monthlyBudgetIncome = budget.incomeAllocations.reduce((s, a) => s + a.amount, 0) / 12
  const monthlyBudgetExpense = budget.expenseAllocations.reduce((s, a) => s + a.amount, 0) / 12

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasets: any[] = []

  if (budgetMetric.value === 'income' || budgetMetric.value === 'both') {
    datasets.push({
      label: 'Ingresos reales',
      data: primaryData.value.map(m => m.income),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: '#10B981',
      borderWidth: 2,
      borderRadius: 6
    })
    datasets.push({
      label: 'Ingresos presupuestados',
      data: Array(12).fill(Math.round(monthlyBudgetIncome)),
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderColor: '#10B981',
      borderWidth: 2,
      borderDash: [5, 5],
      borderRadius: 6
    })
  }

  if (budgetMetric.value === 'expenses' || budgetMetric.value === 'both') {
    datasets.push({
      label: 'Gastos reales',
      data: primaryData.value.map(m => m.expenses),
      backgroundColor: 'rgba(239, 68, 68, 0.7)',
      borderColor: '#EF4444',
      borderWidth: 2,
      borderRadius: 6
    })
    datasets.push({
      label: 'Gastos presupuestados',
      data: Array(12).fill(Math.round(monthlyBudgetExpense)),
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderColor: '#EF4444',
      borderWidth: 2,
      borderDash: [5, 5],
      borderRadius: 6
    })
  }

  return { labels, datasets }
})

const budgetChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 16,
        font: { family: 'Inter', size: 12 }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(10, 37, 64, 0.95)',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (context: { dataset: { label: string }; parsed: { y: number } }) =>
          `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Inter', size: 11 }, color: '#8898AA' }
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
}

// ─── BUDGET VARIANCE BY CATEGORY ───────────────────────
const budgetVarianceByCategory = computed(() => {
  const budget = budgetStore.getBudgetForSeason(primarySeason.value)
  if (!budget) return []

  const now = new Date()
  const jsMonth = now.getMonth()
  const currentMonthInSeason = jsMonth >= 6 ? jsMonth - 6 : jsMonth + 6
  const monthsElapsed = currentMonthInSeason + 1

  // Combine income + expense allocations
  const allAllocations = [
    ...budget.incomeAllocations.map(a => ({ ...a, type: 'income' as const })),
    ...budget.expenseAllocations.map(a => ({ ...a, type: 'expense' as const }))
  ]

  return allAllocations.map(alloc => {
    const cat = categoriesStore.getCategoryById(alloc.categoryId)
    const proratedBudget = (alloc.amount / 12) * monthsElapsed

    // Look up actual spend from per-category tracking
    const actual = categoryActuals.value[alloc.categoryId] || 0

    const executionPercent = proratedBudget > 0 ? (actual / proratedBudget) * 100 : 0
    const variance = proratedBudget > 0 ? ((actual - proratedBudget) / proratedBudget) * 100 : 0

    return {
      categoryId: alloc.categoryId,
      name: cat?.name || 'Sin categoría',
      icon: cat?.icon || 'category',
      color: cat?.color || '#9E9E9E',
      type: alloc.type,
      budgeted: Math.round(proratedBudget),
      actual: Math.round(actual),
      executionPercent,
      variance
    }
  }).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
})

// ─── TABLE DATA ────────────────────────────────────────
const tableRows = computed(() => {
  const now = new Date()
  const jsMonth = now.getMonth()
  const currentMonthInSeason = jsMonth >= 6 ? jsMonth - 6 : jsMonth + 6

  return seasonMonthsFull.map((monthName, idx) => {
    const primary = primaryData.value[idx]
    const isFuture = idx > currentMonthInSeason

    const comparisons: Record<Season, number> = {}
    comparisonSeasons.value.forEach(season => {
      const data = comparisonData.value[season]
      if (data) {
        const val = selectedMetric.value === 'income'
          ? data[idx].income
          : selectedMetric.value === 'expenses'
            ? data[idx].expenses
            : data[idx].balance
        comparisons[season] = val
      }
    })

    const budgetBal = budgetMonthly.value[idx].balance
    const deviation = isFuture ? 0 : primary.balance - budgetBal

    return {
      monthName,
      income: primary.income,
      expenses: primary.expenses,
      balance: primary.balance,
      budgetBalance: budgetBal,
      deviation,
      isFuture,
      comparisons
    }
  })
})

const totals = computed(() => {
  const now = new Date()
  const jsMonth = now.getMonth()
  const currentMonthInSeason = jsMonth >= 6 ? jsMonth - 6 : jsMonth + 6

  let income = 0, expenses = 0
  primaryData.value.forEach((m, idx) => {
    if (idx <= currentMonthInSeason) {
      income += m.income
      expenses += m.expenses
    }
  })

  // Prorate budget to current month
  let budgetBalanceProrated = 0
  budgetMonthly.value.forEach((m, idx) => {
    if (idx <= currentMonthInSeason) budgetBalanceProrated += m.balance
  })

  const comparisons: Record<Season, number> = {}
  comparisonSeasons.value.forEach(season => {
    const data = comparisonData.value[season]
    if (data) {
      comparisons[season] = data.reduce((sum, m) => {
        const val = selectedMetric.value === 'income'
          ? m.income
          : selectedMetric.value === 'expenses'
            ? m.expenses
            : m.balance
        return sum + val
      }, 0)
    }
  })

  return {
    income,
    expenses,
    balance: income - expenses,
    budgetBalance: budgetBalanceProrated,
    deviation: (income - expenses) - budgetBalanceProrated,
    comparisons
  }
})

// ─── ACTIONS ───────────────────────────────────────────
function toggleComparison(season: Season) {
  const idx = comparisonSeasons.value.indexOf(season)
  if (idx >= 0) {
    comparisonSeasons.value.splice(idx, 1)
  } else {
    if (comparisonSeasons.value.length < 3) {
      comparisonSeasons.value.push(season)
    }
  }
}

function clearFilters() {
  filters.categoryIds = []
  filters.projectIds = []
  filters.eventIds = []
  filters.ageCategoryIds = []
  filters.teamIds = []
}

function exportSummary() {
  // CSV export
  const headers = ['Mes', 'Ingresos', 'Gastos', 'Balance']
  if (hasBudget.value && showBudgetLine.value) {
    headers.push('Presupuesto', 'Desviación')
  }
  comparisonSeasons.value.forEach(cs => headers.push(cs))

  const rows = tableRows.value.map(row => {
    const vals = [row.monthName, row.income, row.expenses, row.balance]
    if (hasBudget.value && showBudgetLine.value) {
      vals.push(row.budgetBalance, row.deviation)
    }
    comparisonSeasons.value.forEach(cs => vals.push(row.comparisons[cs] || 0))
    return vals.join(';')
  })

  const csv = [headers.join(';'), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `analisis-financiero-${primarySeason.value.replace('/', '-')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ─── WATCHERS ──────────────────────────────────────────
watch([primarySeason, comparisonSeasons, () => filters.categoryIds, () => filters.projectIds, () => filters.eventIds, () => filters.ageCategoryIds, () => filters.teamIds], () => {
  loadAllData()
}, { deep: true })

// ─── LIFECYCLE ─────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    categoriesStore.fetchCategories(),
    teamsStore.fetchAll(),
    budgetStore.fetchBudgets(),
    catalogsStore.fetchAgeCategories()
  ])
  await loadAllData()
})
</script>

<style lang="scss" scoped>
.financial-overview-page {
  background: var(--color-bg-primary);
  min-height: 100vh;
}

// ─── HEADER ──────────────────────────────────────────
.overview-header {
  background: var(--gradient-header);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 60%;
    height: 200%;
    background: radial-gradient(ellipse, rgba(99, 91, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }
}

.page-header {
  padding: var(--space-6) var(--space-6) var(--space-5);

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .header-eyebrow {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.5);
    margin: 0 0 var(--space-1);
  }

  h1 {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
    line-height: 1.2;
  }

  .header-subtitle {
    font-size: 0.9375rem;
    color: rgba(255, 255, 255, 0.6);
    margin: var(--space-1) 0 0;
  }
}

.season-select {
  min-width: 180px;

  :deep(.q-field__control) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  :deep(.q-field__label),
  :deep(.q-field__native) {
    color: rgba(255, 255, 255, 0.9) !important;
  }
}

// ─── PAGE CONTENT ────────────────────────────────────
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-5) var(--space-10);
}

// ─── TABS ────────────────────────────────────────────
.tab-bar {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  flex: 1;
  justify-content: center;

  &:hover {
    color: var(--color-text-primary);
  }

  &.active {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-sm);
  }
}

// ─── KPI CARDS ───────────────────────────────────────
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.kpi-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  transition: all var(--duration-fast) var(--ease-out);

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .kpi-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    flex-shrink: 0;
  }

  &.income .kpi-icon { background: rgba(16, 185, 129, 0.12); color: #10B981; }
  &.expense .kpi-icon { background: rgba(239, 68, 68, 0.12); color: #EF4444; }
  &.balance .kpi-icon { background: rgba(99, 91, 255, 0.12); color: #635BFF; }
  &.budget .kpi-icon { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }

  .kpi-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .kpi-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .kpi-value {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.375rem;
    font-weight: 700;
    line-height: 1.2;

    &.positive { color: #10B981; }
    &.negative { color: #EF4444; }
  }

  .kpi-change {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.75rem;
    font-weight: 600;

    &.up { color: #10B981; }
    &.down { color: #EF4444; }
  }
}

// ─── FILTERS ─────────────────────────────────────────
.filters-panel {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  margin-bottom: var(--space-5);
  overflow: hidden;
}

.filters-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--duration-fast);

  &:hover { color: var(--color-text-primary); }
}

.filters-body {
  padding: 0 var(--space-4) var(--space-4);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);
}

// ─── COMPARISON BAR ──────────────────────────────────
.comparison-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.comparison-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.comparison-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
}

.comparison-chips {
  display: flex;
  gap: var(--space-2);
}

.comparison-chip {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);

  .chip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  &:hover {
    border-color: var(--color-accent);
  }

  &.active {
    background: rgba(99, 91, 255, 0.08);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
}

.comparison-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
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

.view-toggle {
  display: flex;
  gap: var(--space-1);
}

// ─── MAIN CHART ──────────────────────────────────────
.main-chart-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  padding: var(--space-5);
  margin-bottom: var(--space-5);

  .chart-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
  }
}

.chart-wrapper {
  height: 380px;
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 380px;
  gap: var(--space-3);
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

// ─── SUMMARY TABLE ───────────────────────────────────
.summary-table-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
  margin-bottom: var(--space-5);
}

.table-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.table-scroll {
  overflow-x: auto;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;

  th, td {
    padding: var(--space-2) var(--space-3);
    white-space: nowrap;
  }

  thead th {
    background: var(--color-bg-tertiary);
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    position: sticky;
    top: 0;
  }

  tbody td {
    border-top: 1px solid var(--color-border-light);
    color: var(--color-text-secondary);
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
  }

  .month-cell {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .future {
    opacity: 0.35;
  }

  .total-row {
    td {
      border-top: 2px solid var(--color-border);
      background: var(--color-bg-tertiary);
      font-weight: 700;
    }
  }

  .comparison-col {
    border-left: 1px dashed var(--color-border-light);
  }
}

.positive { color: #10B981; }
.negative { color: #EF4444; }
.muted { color: var(--color-text-tertiary); }

// ─── EMPTY STATE ─────────────────────────────────────
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-6);
  text-align: center;

  h3 {
    margin: var(--space-4) 0 var(--space-2);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  p {
    margin: 0 0 var(--space-5);
    color: var(--color-text-secondary);
    max-width: 400px;
  }
}

// ─── BUDGET CONTENT ──────────────────────────────────
.budget-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.variance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.variance-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  padding: var(--space-4);
  transition: all var(--duration-fast) var(--ease-out);

  &:hover {
    box-shadow: var(--shadow-md);
  }
}

.variance-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);

  .variance-name {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.variance-bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.variance-bar {
  flex: 1;
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: 3px;
  overflow: hidden;

  .variance-fill {
    height: 100%;
    border-radius: 3px;
    transition: width var(--duration-normal) var(--ease-out);
  }
}

.variance-percent {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  min-width: 36px;
  text-align: right;
}

.variance-amounts {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

// ─── RESPONSIVE ──────────────────────────────────────
@media (max-width: 768px) {
  .page-header .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .comparison-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .kpi-grid {
    grid-template-columns: 1fr 1fr;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .chart-wrapper {
    height: 260px;
  }

  .tab-btn span {
    display: none;
  }

  .tab-btn {
    justify-content: center;
    padding: var(--space-2) var(--space-3);
  }
}
</style>
