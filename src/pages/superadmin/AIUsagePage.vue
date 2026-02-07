<template>
  <q-page class="ai-usage-page">
    <div class="page-header">
      <div>
        <h1>Uso de IA</h1>
        <p class="header-subtitle">Registro de llamadas a servicios de inteligencia artificial</p>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <q-inner-loading :showing="loading" />

      <!-- Summary Cards -->
      <div class="summary-grid q-mb-lg">
        <div class="summary-card">
          <div class="summary-icon">
            <q-icon name="smart_toy" size="24px" />
          </div>
          <div class="summary-info">
            <span class="summary-label">Total llamadas</span>
            <span class="summary-value">{{ stats.totalCalls }}</span>
          </div>
        </div>
        <div class="summary-card positive-card">
          <div class="summary-icon">
            <q-icon name="check_circle" size="24px" />
          </div>
          <div class="summary-info">
            <span class="summary-label">Tasa de éxito</span>
            <span class="summary-value">{{ stats.successRate }}%</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">
            <q-icon name="timer" size="24px" />
          </div>
          <div class="summary-info">
            <span class="summary-label">Duración media</span>
            <span class="summary-value">{{ formatDuration(stats.avgDuration) }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">
            <q-icon name="today" size="24px" />
          </div>
          <div class="summary-info">
            <span class="summary-label">Hoy</span>
            <span class="summary-value">{{ stats.todayCalls }}</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="section-card q-mb-md">
        <div class="section-header">
          <h2 class="section-title">
            <q-icon name="filter_list" class="q-mr-xs" /> Filtros
          </h2>
          <q-btn
            v-if="hasActiveFilters"
            flat
            dense
            no-caps
            color="primary"
            label="Limpiar"
            icon="clear_all"
            @click="clearFilters"
          />
        </div>
        <div class="section-body">
          <div class="row q-col-gutter-sm items-end">
            <div class="col-12 col-sm-3">
              <q-select
                v-model="filters.functionName"
                :options="functionOptions"
                emit-value
                map-options
                outlined
                dense
                label="Función"
                clearable
              />
            </div>
            <div class="col-12 col-sm-3">
              <q-input
                v-model="filters.clubId"
                outlined
                dense
                label="Club ID"
                clearable
              />
            </div>
            <div class="col-12 col-sm-2">
              <q-select
                v-model="filters.status"
                :options="statusOptions"
                emit-value
                map-options
                outlined
                dense
                label="Estado"
                clearable
              />
            </div>
            <div class="col-12 col-sm-2">
              <q-input
                v-model="filters.dateFrom"
                outlined
                dense
                label="Desde"
                type="date"
              />
            </div>
            <div class="col-12 col-sm-2">
              <q-input
                v-model="filters.dateTo"
                outlined
                dense
                label="Hasta"
                type="date"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Results count -->
      <div class="row items-center justify-between q-mb-sm q-px-xs">
        <span class="text-caption text-grey-6">
          {{ filteredLogs.length }} registro{{ filteredLogs.length !== 1 ? 's' : '' }}
          <template v-if="filteredLogs.length !== logs.length">
            de {{ logs.length }} totales
          </template>
        </span>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="refresh"
          label="Recargar"
          @click="loadLogs"
        />
      </div>

      <!-- Table -->
      <div class="section-card">
        <q-table
          :rows="filteredLogs"
          :columns="columns"
          row-key="id"
          flat
          :rows-per-page-options="[25, 50, 100]"
          :pagination="initialPagination"
          class="usage-table"
        >
          <template #body-cell-createdAt="props">
            <q-td :props="props">
              <span class="text-no-wrap">{{ formatDate(props.row.createdAt) }}</span>
            </q-td>
          </template>

          <template #body-cell-userEmail="props">
            <q-td :props="props">
              <div class="user-cell">
                <span>{{ props.row.userEmail || 'N/A' }}</span>
                <span v-if="props.row.userEmail" class="text-caption text-grey-5 uid-text">
                  {{ props.row.userId.slice(0, 8) }}…
                </span>
              </div>
            </q-td>
          </template>

          <template #body-cell-clubId="props">
            <q-td :props="props">
              <code class="club-id-code">{{ props.row.clubId.slice(0, 12) }}…</code>
              <q-tooltip>{{ props.row.clubId }}</q-tooltip>
            </q-td>
          </template>

          <template #body-cell-functionName="props">
            <q-td :props="props">
              <q-badge
                outline
                :color="getFunctionColor(props.row.functionName)"
                :label="getFunctionLabel(props.row.functionName)"
              />
            </q-td>
          </template>

          <template #body-cell-durationMs="props">
            <q-td :props="props">
              <span :class="getDurationClass(props.row.durationMs)">
                {{ formatDuration(props.row.durationMs) }}
              </span>
            </q-td>
          </template>

          <template #body-cell-success="props">
            <q-td :props="props">
              <q-badge
                :color="props.row.success ? 'positive' : 'negative'"
                :label="props.row.success ? 'OK' : 'Error'"
              />
              <q-tooltip v-if="props.row.error">{{ props.row.error }}</q-tooltip>
            </q-td>
          </template>

          <template #no-data>
            <div class="text-center q-pa-xl text-grey-6">
              <q-icon name="smart_toy" size="48px" class="q-mb-sm" style="opacity: 0.4" />
              <p class="q-mb-none">No hay registros de uso de IA</p>
              <p class="text-caption">Los registros aparecerán cuando los usuarios usen funciones de categorización o presupuesto</p>
            </div>
          </template>
        </q-table>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from 'src/boot/firebase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────
interface AIUsageLog {
  id: string
  userId: string
  userEmail: string
  clubId: string
  functionName: string
  inputSize: number
  success: boolean
  error?: string
  durationMs: number
  createdAt: Date
}

// ─── State ────────────────────────────────────────────────────────────
const loading = ref(true)
const logs = ref<AIUsageLog[]>([])

// ─── Filters ──────────────────────────────────────────────────────────
const filters = ref({
  functionName: null as string | null,
  clubId: '',
  status: null as boolean | null,
  dateFrom: '',
  dateTo: ''
})

const functionOptions = [
  { label: 'Categorización batch', value: 'suggestCategoriesBatch' },
  { label: 'Categorización individual', value: 'suggestCategory' },
  { label: 'Sugerencia presupuesto', value: 'suggestBudgetAllocations' }
]

const statusOptions = [
  { label: 'Exitoso', value: true },
  { label: 'Error', value: false }
]

const hasActiveFilters = computed(() => {
  return filters.value.functionName !== null
    || filters.value.clubId !== ''
    || filters.value.status !== null
    || filters.value.dateFrom !== ''
    || filters.value.dateTo !== ''
})

function clearFilters() {
  filters.value = {
    functionName: null,
    clubId: '',
    status: null,
    dateFrom: '',
    dateTo: ''
  }
}

// ─── Table config ─────────────────────────────────────────────────────
const columns = [
  { name: 'createdAt', label: 'Fecha', field: 'createdAt', sortable: true, align: 'left' as const },
  { name: 'userEmail', label: 'Usuario', field: 'userEmail', sortable: true, align: 'left' as const },
  { name: 'clubId', label: 'Club', field: 'clubId', sortable: true, align: 'left' as const },
  { name: 'functionName', label: 'Función', field: 'functionName', sortable: true, align: 'center' as const },
  { name: 'inputSize', label: 'Items', field: 'inputSize', sortable: true, align: 'center' as const },
  { name: 'durationMs', label: 'Duración', field: 'durationMs', sortable: true, align: 'right' as const },
  { name: 'success', label: 'Estado', field: 'success', sortable: true, align: 'center' as const }
]

const initialPagination = {
  rowsPerPage: 25,
  sortBy: 'createdAt',
  descending: true
}

// ─── Computed ─────────────────────────────────────────────────────────
const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    if (filters.value.functionName && log.functionName !== filters.value.functionName) return false
    if (filters.value.clubId && !log.clubId.toLowerCase().includes(filters.value.clubId.toLowerCase())) return false
    if (filters.value.status !== null && log.success !== filters.value.status) return false
    if (filters.value.dateFrom) {
      const from = new Date(filters.value.dateFrom)
      if (log.createdAt < from) return false
    }
    if (filters.value.dateTo) {
      const to = new Date(filters.value.dateTo)
      to.setHours(23, 59, 59, 999)
      if (log.createdAt > to) return false
    }
    return true
  })
})

const stats = computed(() => {
  const filtered = filteredLogs.value
  const total = filtered.length
  const successful = filtered.filter(l => l.success).length
  const totalDuration = filtered.reduce((sum, l) => sum + l.durationMs, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayLogs = filtered.filter(l => l.createdAt >= today)

  return {
    totalCalls: total,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    avgDuration: total > 0 ? Math.round(totalDuration / total) : 0,
    todayCalls: todayLogs.length
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────
function formatDate(date: Date): string {
  return format(date, "dd MMM yyyy · HH:mm", { locale: es })
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function getDurationClass(ms: number): string {
  if (ms < 2000) return 'duration-fast'
  if (ms < 5000) return 'duration-normal'
  return 'duration-slow'
}

function getFunctionLabel(name: string): string {
  const labels: Record<string, string> = {
    suggestCategoriesBatch: 'Batch',
    suggestCategory: 'Individual',
    suggestBudgetAllocations: 'Presupuesto'
  }
  return labels[name] || name
}

function getFunctionColor(name: string): string {
  const colors: Record<string, string> = {
    suggestCategoriesBatch: 'purple',
    suggestCategory: 'blue',
    suggestBudgetAllocations: 'orange'
  }
  return colors[name] || 'grey'
}

// ─── Data loading ─────────────────────────────────────────────────────
async function loadLogs() {
  loading.value = true
  try {
    const q = query(
      collection(db, 'ai_usage_logs'),
      orderBy('createdAt', 'desc'),
      limit(500)
    )
    const snap = await getDocs(q)
    logs.value = snap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        userId: data.userId || '',
        userEmail: data.userEmail || '',
        clubId: data.clubId || '',
        functionName: data.functionName || '',
        inputSize: data.inputSize || 0,
        success: data.success ?? true,
        error: data.error,
        durationMs: data.durationMs || 0,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt)
      }
    })
  } catch (err) {
    console.error('[SuperAdmin] Error loading AI usage logs:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadLogs)
</script>

<style lang="scss" scoped>
.ai-usage-page {
  background: var(--color-bg-primary);
}

.page-content {
  max-width: 960px;
  margin: 0 auto;
}

// ─── Summary Cards ────────────────────────────────────────────────────
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-elevated);
}

.summary-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(99, 91, 255, 0.12);
  color: #635BFF;
}

.positive-card .summary-icon {
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
}

.summary-info {
  display: flex;
  flex-direction: column;
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

// ─── Table & cells ────────────────────────────────────────────────────
.user-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.uid-text {
  font-size: 0.7rem;
  font-family: monospace;
}

.club-id-code {
  font-size: 0.8rem;
  background: rgba(0, 0, 0, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.duration-fast {
  color: #10B981;
  font-weight: 500;
}

.duration-normal {
  color: #F59E0B;
  font-weight: 500;
}

.duration-slow {
  color: #EF4444;
  font-weight: 600;
}

.usage-table {
  :deep(.q-table__top) {
    padding: 8px 12px;
  }

  :deep(th) {
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-tertiary);
  }

  :deep(td) {
    font-size: 0.85rem;
  }
}
</style>
