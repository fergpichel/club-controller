<template>
  <q-page class="forecasts-page">
    <div class="page-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Previsiones — {{ currentSeason }}</h1>
          <p class="header-subtitle">Estimación histórica vs datos reales de la temporada actual</p>
        </div>
        <q-btn
          color="primary"
          text-color="white"
          icon="auto_fix_high"
          :label="hasForecasts ? 'Regenerar previsión' : 'Generar desde histórico'"
          no-caps
          :loading="loading"
          @click="generate"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Empty state -->
      <div v-if="!hasForecasts && !loading" class="empty-state text-center q-pa-xl">
        <q-icon name="insights" size="80px" color="grey-5" />
        <h3 class="text-grey-5 q-mt-md q-mb-sm">Sin previsiones</h3>
        <p class="text-grey-6" style="max-width: 400px; margin: 0 auto;">
          Genera estimaciones basadas en temporadas anteriores para
          comparar con los datos reales de esta temporada.
        </p>
        <q-btn
          color="primary"
          icon="auto_fix_high"
          label="Generar previsión"
          no-caps
          class="q-mt-lg"
          :loading="loading"
          @click="generate"
        />
      </div>

      <template v-else-if="hasForecasts">
        <!-- Summary cards: Forecast vs Actual -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-4">
            <q-card class="summary-card">
              <q-card-section>
                <div class="text-caption text-grey q-mb-xs">Ingresos</div>
                <div class="row items-end q-gutter-sm">
                  <div>
                    <div class="text-caption text-grey-6">Previsto</div>
                    <div class="text-h6 text-positive">{{ formatCurrency(totalForecast.income) }}</div>
                  </div>
                  <q-icon name="arrow_forward" size="16px" color="grey-6" class="q-mb-xs" />
                  <div>
                    <div class="text-caption text-grey-6">Real</div>
                    <div class="text-h6">{{ formatCurrency(totalActual.income) }}</div>
                  </div>
                </div>
                <deviation-chip :forecast="totalForecast.income" :actual="totalActual.income" class="q-mt-sm" />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card class="summary-card">
              <q-card-section>
                <div class="text-caption text-grey q-mb-xs">Gastos</div>
                <div class="row items-end q-gutter-sm">
                  <div>
                    <div class="text-caption text-grey-6">Previsto</div>
                    <div class="text-h6 text-negative">{{ formatCurrency(totalForecast.expenses) }}</div>
                  </div>
                  <q-icon name="arrow_forward" size="16px" color="grey-6" class="q-mb-xs" />
                  <div>
                    <div class="text-caption text-grey-6">Real</div>
                    <div class="text-h6">{{ formatCurrency(totalActual.expenses) }}</div>
                  </div>
                </div>
                <deviation-chip :forecast="totalForecast.expenses" :actual="totalActual.expenses" invert class="q-mt-sm" />
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card class="summary-card">
              <q-card-section>
                <div class="text-caption text-grey q-mb-xs">Balance</div>
                <div class="row items-end q-gutter-sm">
                  <div>
                    <div class="text-caption text-grey-6">Previsto</div>
                    <div class="text-h6" :class="forecastBalance >= 0 ? 'text-positive' : 'text-negative'">
                      {{ formatCurrency(forecastBalance) }}
                    </div>
                  </div>
                  <q-icon name="arrow_forward" size="16px" color="grey-6" class="q-mb-xs" />
                  <div>
                    <div class="text-caption text-grey-6">Real</div>
                    <div class="text-h6" :class="actualBalance >= 0 ? 'text-positive' : 'text-negative'">
                      {{ formatCurrency(actualBalance) }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Filter toggle -->
        <div class="row items-center justify-between q-mb-md">
          <h3 class="section-title q-mb-none">Desglose mensual</h3>
          <q-btn-toggle
            v-model="viewType"
            no-caps
            dense
            rounded
            toggle-color="primary"
            :options="[
              { label: 'Todos', value: 'all' },
              { label: 'Ingresos', value: 'income' },
              { label: 'Gastos', value: 'expense' }
            ]"
          />
        </div>

        <!-- Monthly rows -->
        <div v-for="m in seasonMonths" :key="m.key" class="month-block q-mb-sm">
          <!-- Month header -->
          <div
            class="month-header row items-center justify-between q-pa-sm cursor-pointer"
            @click="toggleMonth(m.key)"
          >
            <div class="row items-center q-gutter-sm">
              <q-icon
                :name="expandedMonths.includes(m.key) ? 'expand_more' : 'chevron_right'"
                size="20px"
              />
              <span class="text-subtitle1 text-weight-medium">{{ m.label }}</span>
              <q-badge
                v-if="isMonthPast(m)"
                :color="getMonthDeviation(m).color"
                :label="getMonthDeviation(m).label"
              />
              <q-badge v-else-if="isCurrentMonth(m)" color="blue-7" label="En curso" />
              <q-badge v-else color="grey-7" label="Pendiente" />
            </div>

            <div class="row q-gutter-lg text-body2" style="min-width: 400px; justify-content: flex-end;">
              <div class="text-right" style="min-width: 100px;">
                <span class="text-grey-6">Previsto</span><br>
                <span class="text-weight-medium">{{ formatCurrency(getMonthForecastTotal(m.key)) }}</span>
              </div>
              <div class="text-right" style="min-width: 100px;">
                <span class="text-grey-6">Real</span><br>
                <span class="text-weight-medium">{{ formatCurrency(getMonthActualTotal(m.key)) }}</span>
              </div>
              <div class="text-right" style="min-width: 100px;">
                <span class="text-grey-6">Desviación</span><br>
                <span
                  class="text-weight-bold"
                  :class="getMonthDeviationAmount(m.key) >= 0 ? 'text-positive' : 'text-negative'"
                >
                  {{ getMonthDeviationAmount(m.key) >= 0 ? '+' : '' }}{{ formatCurrency(getMonthDeviationAmount(m.key)) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Month detail -->
          <q-slide-transition>
            <div v-if="expandedMonths.includes(m.key)">
              <!-- Progress bar -->
              <div class="q-px-md q-pt-sm q-pb-xs">
                <div class="row items-center q-gutter-sm text-caption text-grey-6">
                  <span>Ejecución: {{ getMonthExecutionPct(m.key) }}%</span>
                </div>
                <q-linear-progress
                  :value="getMonthExecutionPct(m.key) / 100"
                  :color="getMonthExecutionPct(m.key) > 110 ? 'negative' : getMonthExecutionPct(m.key) > 90 ? 'warning' : 'positive'"
                  track-color="grey-8"
                  rounded
                  size="6px"
                  class="q-mt-xs"
                />
              </div>

              <!-- Category breakdown -->
              <q-list separator dense class="q-px-sm">
                <q-item
                  v-for="cat in getMonthCategories(m.key)"
                  :key="cat.categoryId"
                  class="category-row"
                >
                  <q-item-section avatar style="min-width: 32px;">
                    <q-icon
                      :name="cat.type === 'income' ? 'trending_up' : 'trending_down'"
                      :color="cat.type === 'income' ? 'positive' : 'negative'"
                      size="18px"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-body2">{{ cat.categoryName }}</q-item-label>
                  </q-item-section>
                  <q-item-section side style="min-width: 90px;" class="text-right">
                    <q-item-label class="text-caption text-grey-6">Previsto</q-item-label>
                    <q-item-label class="text-body2">{{ formatCurrency(cat.forecast) }}</q-item-label>
                  </q-item-section>
                  <q-item-section side style="min-width: 90px;" class="text-right">
                    <q-item-label class="text-caption text-grey-6">Real</q-item-label>
                    <q-item-label class="text-body2">{{ formatCurrency(cat.actual) }}</q-item-label>
                  </q-item-section>
                  <q-item-section side style="min-width: 90px;" class="text-right">
                    <q-item-label class="text-caption text-grey-6">Desviación</q-item-label>
                    <q-item-label
                      class="text-body2 text-weight-medium"
                      :class="cat.deviationColor"
                    >
                      {{ cat.deviation >= 0 ? '+' : '' }}{{ formatCurrency(cat.deviation) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-slide-transition>
        </div>
      </template>

      <!-- Loading -->
      <div v-else class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
        <p class="text-grey-6 q-mt-sm">Cargando previsiones...</p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { useQuasar } from 'quasar'
import { useStatisticsStore } from 'src/stores/statistics'
import { useCategoriesStore } from 'src/stores/categories'
import { computeSeason, getSeasonDates } from 'src/types'
// Season and Forecast types used via statisticsStore
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore'
import { db } from 'src/boot/firebase'
import { useAuthStore } from 'src/stores/auth'
import { formatCurrency } from 'src/utils/formatters'

// --- Deviation chip sub-component ---
const DeviationChip = defineComponent({
  name: 'DeviationChip',
  props: {
    forecast: { type: Number, required: true },
    actual: { type: Number, required: true },
    invert: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      if (props.forecast === 0) return null
      const diff = props.actual - props.forecast
      const pct = Math.round((diff / props.forecast) * 100)
      // For expenses: being under budget is good (invert=true)
      const isGood = props.invert ? diff <= 0 : diff >= 0
      const color = isGood ? 'positive' : 'negative'
      const icon = diff >= 0 ? 'arrow_upward' : 'arrow_downward'
      return h('span', {
        class: `text-${color} text-weight-medium text-caption`
      }, [
        h('q-icon', { name: icon, size: '14px', class: 'q-mr-xs' }),
        `${pct >= 0 ? '+' : ''}${pct}%`
      ])
    }
  }
})

const $q = useQuasar()
const statisticsStore = useStatisticsStore()
const categoriesStore = useCategoriesStore()
const authStore = useAuthStore()

const currentSeason = computeSeason(new Date())
const loading = ref(false)
const viewType = ref<'all' | 'income' | 'expense'>('all')
const expandedMonths = ref<string[]>([])

// Actual transaction data grouped by month-category
interface ActualEntry {
  month: number
  year: number
  categoryId: string
  type: 'income' | 'expense'
  amount: number
}
const actualData = ref<ActualEntry[]>([])

const seasonMonths = computed(() => {
  const startYear = parseInt(currentSeason.split('/')[0])
  return [
    { month: 7, year: startYear, label: 'Julio', key: `${startYear}-07` },
    { month: 8, year: startYear, label: 'Agosto', key: `${startYear}-08` },
    { month: 9, year: startYear, label: 'Septiembre', key: `${startYear}-09` },
    { month: 10, year: startYear, label: 'Octubre', key: `${startYear}-10` },
    { month: 11, year: startYear, label: 'Noviembre', key: `${startYear}-11` },
    { month: 12, year: startYear, label: 'Diciembre', key: `${startYear}-12` },
    { month: 1, year: startYear + 1, label: 'Enero', key: `${startYear + 1}-01` },
    { month: 2, year: startYear + 1, label: 'Febrero', key: `${startYear + 1}-02` },
    { month: 3, year: startYear + 1, label: 'Marzo', key: `${startYear + 1}-03` },
    { month: 4, year: startYear + 1, label: 'Abril', key: `${startYear + 1}-04` },
    { month: 5, year: startYear + 1, label: 'Mayo', key: `${startYear + 1}-05` },
    { month: 6, year: startYear + 1, label: 'Junio', key: `${startYear + 1}-06` }
  ]
})

const hasForecasts = computed(() => statisticsStore.forecasts.length > 0)

// Filtered forecasts by viewType
const forecasts = computed(() => {
  if (viewType.value === 'all') return statisticsStore.forecasts
  return statisticsStore.forecasts.filter(f => f.type === viewType.value)
})

// --- Totals ---
const totalForecast = computed(() => ({
  income: statisticsStore.forecasts.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0),
  expenses: statisticsStore.forecasts.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
}))

const totalActual = computed(() => ({
  income: actualData.value.filter(a => a.type === 'income').reduce((s, a) => s + a.amount, 0),
  expenses: actualData.value.filter(a => a.type === 'expense').reduce((s, a) => s + a.amount, 0)
}))

const forecastBalance = computed(() => totalForecast.value.income - totalForecast.value.expenses)
const actualBalance = computed(() => totalActual.value.income - totalActual.value.expenses)

// --- Month helpers ---
function monthKey(month: number, year: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function isMonthPast(m: { month: number; year: number }) {
  const now = new Date()
  const endOfMonth = new Date(m.year, m.month, 0) // last day of the month
  return now > endOfMonth
}

function isCurrentMonth(m: { month: number; year: number }) {
  const now = new Date()
  return now.getFullYear() === m.year && now.getMonth() + 1 === m.month
}

function getMonthForecastsByKey(key: string) {
  const monthStr = key.split('-')[1]
  const month = parseInt(monthStr)
  return forecasts.value.filter(f => f.month === month)
}

function getMonthActualsByKey(key: string) {
  const [yearStr, monthStr] = key.split('-')
  const month = parseInt(monthStr)
  const year = parseInt(yearStr)
  let entries = actualData.value.filter(a => a.month === month && a.year === year)
  if (viewType.value !== 'all') {
    entries = entries.filter(a => a.type === viewType.value)
  }
  return entries
}

function getMonthForecastTotal(key: string) {
  const items = getMonthForecastsByKey(key)
  const income = items.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0)
  const expenses = items.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
  return income - expenses
}

function getMonthActualTotal(key: string) {
  const items = getMonthActualsByKey(key)
  const income = items.filter(a => a.type === 'income').reduce((s, a) => s + a.amount, 0)
  const expenses = items.filter(a => a.type === 'expense').reduce((s, a) => s + a.amount, 0)
  return income - expenses
}

function getMonthDeviationAmount(key: string) {
  return getMonthActualTotal(key) - getMonthForecastTotal(key)
}

function getMonthExecutionPct(key: string) {
  const forecastAbs = Math.abs(getMonthForecastTotal(key))
  if (forecastAbs === 0) return 0
  return Math.round((Math.abs(getMonthActualTotal(key)) / forecastAbs) * 100)
}

function getMonthDeviation(m: { key: string }) {
  const dev = getMonthDeviationAmount(m.key)
  const forecast = getMonthForecastTotal(m.key)
  if (forecast === 0) return { label: 'Sin previsión', color: 'grey-7' }
  const pct = Math.round((dev / Math.abs(forecast)) * 100)
  if (Math.abs(pct) <= 10) return { label: `${pct >= 0 ? '+' : ''}${pct}%`, color: 'positive' }
  if (dev > 0) return { label: `+${pct}%`, color: 'positive' }
  return { label: `${pct}%`, color: 'negative' }
}

interface CategoryComparison {
  categoryId: string
  categoryName: string
  type: 'income' | 'expense'
  forecast: number
  actual: number
  deviation: number
  deviationColor: string
}

function getMonthCategories(key: string): CategoryComparison[] {
  const forecastItems = getMonthForecastsByKey(key)
  const actualItems = getMonthActualsByKey(key)

  // Build a map of all categories in this month
  const catMap: Record<string, CategoryComparison> = {}

  forecastItems.forEach(f => {
    const id = `${f.categoryId}-${f.type}`
    if (!catMap[id]) {
      catMap[id] = {
        categoryId: f.categoryId,
        categoryName: f.categoryName || categoriesStore.getCategoryById(f.categoryId)?.name || 'Sin categoría',
        type: f.type,
        forecast: 0,
        actual: 0,
        deviation: 0,
        deviationColor: ''
      }
    }
    catMap[id].forecast += f.amount
  })

  actualItems.forEach(a => {
    const id = `${a.categoryId}-${a.type}`
    if (!catMap[id]) {
      catMap[id] = {
        categoryId: a.categoryId,
        categoryName: categoriesStore.getCategoryById(a.categoryId)?.name || 'Sin categoría',
        type: a.type,
        forecast: 0,
        actual: 0,
        deviation: 0,
        deviationColor: ''
      }
    }
    catMap[id].actual += a.amount
  })

  return Object.values(catMap).map(c => {
    c.deviation = c.actual - c.forecast
    // For expenses, being under forecast is good
    const isGood = c.type === 'expense' ? c.deviation <= 0 : c.deviation >= 0
    c.deviationColor = c.deviation === 0 ? 'text-grey-6' : isGood ? 'text-positive' : 'text-negative'
    return c
  }).sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
}

function toggleMonth(key: string) {
  const idx = expandedMonths.value.indexOf(key)
  if (idx >= 0) {
    expandedMonths.value.splice(idx, 1)
  } else {
    expandedMonths.value.push(key)
  }
}

// --- Fetch actual data ---
async function fetchActualData() {
  if (!authStore.clubId) return

  const dates = getSeasonDates(currentSeason)
  const q = query(
    collection(db, 'transactions'),
    where('clubId', '==', authStore.clubId),
    where('date', '>=', Timestamp.fromDate(dates.start)),
    where('date', '<=', Timestamp.fromDate(dates.end)),
    where('status', 'in', ['approved', 'pending', 'paid'])
  )

  const snapshot = await getDocs(q)
  const entries: ActualEntry[] = []

  snapshot.forEach(d => {
    const data = d.data()
    const date: Date = data.date?.toDate ? data.date.toDate() : new Date(data.date)
    entries.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      categoryId: data.categoryId || '',
      type: data.type as 'income' | 'expense',
      amount: data.amount || 0
    })
  })

  actualData.value = entries
}

async function generate() {
  loading.value = true
  const result = await statisticsStore.generateHistoricalForecasts(currentSeason)
  loading.value = false

  if (result.length > 0) {
    $q.notify({ type: 'positive', message: `${result.length} previsiones generadas` })
    // Auto-expand current month
    const now = new Date()
    const currentKey = monthKey(now.getMonth() + 1, now.getFullYear())
    if (!expandedMonths.value.includes(currentKey)) {
      expandedMonths.value.push(currentKey)
    }
  } else if (statisticsStore.error) {
    $q.notify({ type: 'warning', message: statisticsStore.error })
  } else {
    $q.notify({ type: 'info', message: 'No se generaron previsiones. Verifica que existan datos históricos.' })
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([
    statisticsStore.fetchForecasts(currentSeason),
    fetchActualData(),
    categoriesStore.fetchCategories()
  ])
  loading.value = false

  // Auto-expand current month
  const now = new Date()
  const currentKey = monthKey(now.getMonth() + 1, now.getFullYear())
  expandedMonths.value = [currentKey]
})
</script>

<style lang="scss" scoped>
.forecasts-page {
  background: var(--color-bg-primary);
}

.page-content {
  max-width: 1000px;
  margin: 0 auto;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.empty-state {
  margin-top: 60px;
}

.summary-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.month-block {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-elevated);
}

.month-header {
  background: var(--color-bg-secondary);
  transition: background 0.15s;

  &:hover {
    background: var(--color-bg-tertiary, var(--color-bg-secondary));
  }
}

.category-row {
  min-height: 40px;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
}
</style>
