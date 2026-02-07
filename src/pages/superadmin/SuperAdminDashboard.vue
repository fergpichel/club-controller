<template>
  <q-page class="sa-dashboard">
    <div class="page-header">
      <div>
        <h1>Panel de Administración</h1>
        <p class="header-subtitle">Vista general del sistema Grootter Finance</p>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <q-inner-loading :showing="loading" />

      <!-- Summary Cards -->
      <div class="summary-grid q-mb-lg">
        <div class="summary-card">
          <div class="summary-icon clubs-icon">
            <q-icon name="business" size="24px" />
          </div>
          <div class="summary-info">
            <span class="summary-label">Clubs</span>
            <span class="summary-value">{{ stats?.totalClubs ?? '—' }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon users-icon">
            <q-icon name="group" size="24px" />
          </div>
          <div class="summary-info">
            <span class="summary-label">Usuarios</span>
            <span class="summary-value">{{ stats?.totalUsers ?? '—' }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon ai-icon">
            <q-icon name="smart_toy" size="24px" />
          </div>
          <div class="summary-info">
            <span class="summary-label">Llamadas IA (30d)</span>
            <span class="summary-value">{{ stats?.aiCallsLast30d ?? '—' }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon season-icon">
            <q-icon name="date_range" size="24px" />
          </div>
          <div class="summary-info">
            <span class="summary-label">Temporada</span>
            <span class="summary-value">{{ currentSeason }}</span>
          </div>
        </div>
      </div>

      <!-- Error banner -->
      <q-banner v-if="error" class="q-mb-md bg-negative text-white" rounded>
        <template #avatar>
          <q-icon name="error" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat label="Reintentar" @click="loadStats" />
        </template>
      </q-banner>

      <div class="row q-col-gutter-md">
        <!-- Clubs Table -->
        <div class="col-12 col-md-7">
          <div class="section-card">
            <div class="section-header">
              <h2 class="section-title">
                <q-icon name="business" class="q-mr-xs" /> Clubs registrados
              </h2>
              <q-badge :label="`${stats?.totalClubs ?? 0}`" color="primary" />
            </div>
            <q-table
              :rows="stats?.clubs ?? []"
              :columns="clubColumns"
              row-key="id"
              flat
              :rows-per-page-options="[10, 25]"
              :pagination="{ rowsPerPage: 10 }"
              class="clubs-table"
            >
              <template #body-cell-name="props">
                <q-td :props="props">
                  <div class="club-name-cell">
                    <div class="club-avatar">
                      {{ props.row.name.charAt(0).toUpperCase() }}
                    </div>
                    <span class="club-name-text">{{ props.row.name }}</span>
                  </div>
                </q-td>
              </template>
              <template #body-cell-userCount="props">
                <q-td :props="props">
                  <q-badge
                    outline
                    :color="props.row.userCount > 0 ? 'primary' : 'grey'"
                    :label="`${props.row.userCount} usuario${props.row.userCount !== 1 ? 's' : ''}`"
                  />
                </q-td>
              </template>
              <template #body-cell-createdAt="props">
                <q-td :props="props">
                  <span class="text-caption text-grey-6">
                    {{ props.row.createdAt ? formatDate(props.row.createdAt) : '—' }}
                  </span>
                </q-td>
              </template>
              <template #no-data>
                <div class="text-center q-pa-lg text-grey-6">
                  <q-icon name="business" size="36px" class="q-mb-sm" style="opacity: 0.3" />
                  <p>No hay clubs registrados</p>
                </div>
              </template>
            </q-table>
          </div>
        </div>

        <!-- Recent AI Activity -->
        <div class="col-12 col-md-5">
          <div class="section-card activity-card">
            <div class="section-header">
              <h2 class="section-title">
                <q-icon name="smart_toy" class="q-mr-xs" /> Actividad IA
              </h2>
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                label="Ver todo"
                icon-right="arrow_forward"
                :to="{ name: 'ai-usage' }"
                color="primary"
              />
            </div>
            <div class="activity-list">
              <div
                v-if="!stats?.recentAIUsage?.length"
                class="text-center q-pa-lg text-grey-6"
              >
                <q-icon name="smart_toy" size="36px" class="q-mb-sm" style="opacity: 0.3" />
                <p>Sin actividad reciente</p>
              </div>
              <div
                v-for="(log, i) in stats?.recentAIUsage ?? []"
                :key="i"
                class="activity-item"
              >
                <div class="activity-dot" :class="log.success ? 'dot-success' : 'dot-error'" />
                <div class="activity-body">
                  <span class="activity-fn">{{ getFunctionLabel(log.functionName) }}</span>
                  <span class="activity-user">{{ log.userEmail || 'N/A' }}</span>
                </div>
                <div class="activity-meta">
                  <span class="activity-duration">{{ formatDuration(log.durationMs) }}</span>
                  <span class="activity-time">{{ formatTimeAgo(log.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from 'src/boot/firebase'
import { computeSeason } from 'src/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────
interface BackofficeStats {
  totalClubs: number
  totalUsers: number
  totalAICalls: number
  aiCallsLast30d: number
  clubs: {
    id: string
    name: string
    userCount: number
    createdAt: string | null
  }[]
  recentAIUsage: {
    functionName: string
    userEmail: string
    clubId: string
    success: boolean
    durationMs: number
    createdAt: string | null
  }[]
}

// ─── State ────────────────────────────────────────────────────────────
const loading = ref(true)
const error = ref<string | null>(null)
const stats = ref<BackofficeStats | null>(null)

const currentSeason = computed(() => computeSeason(new Date()))

// ─── Table config ─────────────────────────────────────────────────────
const clubColumns = [
  { name: 'name', label: 'Club', field: 'name', sortable: true, align: 'left' as const },
  { name: 'userCount', label: 'Usuarios', field: 'userCount', sortable: true, align: 'center' as const },
  { name: 'createdAt', label: 'Creado', field: 'createdAt', sortable: true, align: 'right' as const }
]

// ─── Helpers ──────────────────────────────────────────────────────────
function formatDate(isoStr: string): string {
  return format(new Date(isoStr), 'dd MMM yyyy', { locale: es })
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatTimeAgo(isoStr: string | null): string {
  if (!isoStr) return '—'
  const diffMs = Date.now() - new Date(isoStr).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d`
  return format(new Date(isoStr), 'dd MMM', { locale: es })
}

function getFunctionLabel(name: string): string {
  const labels: Record<string, string> = {
    suggestCategoriesBatch: 'Categorización batch',
    suggestCategory: 'Categorización',
    suggestBudgetAllocations: 'Presupuesto'
  }
  return labels[name] || name
}

// ─── Data loading ─────────────────────────────────────────────────────
async function loadStats() {
  loading.value = true
  error.value = null
  try {
    const fn = httpsCallable<void, BackofficeStats>(functions, 'getBackofficeStats')
    const result = await fn()
    stats.value = result.data
  } catch (err: unknown) {
    console.error('[SuperAdmin] Error loading stats:', err)
    error.value = 'Error al cargar las estadísticas. Verifica que las Cloud Functions estén desplegadas.'
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<style lang="scss" scoped>
.sa-dashboard {
  background: var(--color-bg-primary);
}

.page-content {
  max-width: 1100px;
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
}

.clubs-icon {
  background: rgba(99, 91, 255, 0.12);
  color: #635BFF;
}

.users-icon {
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
}

.ai-icon {
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
}

.season-icon {
  background: rgba(245, 158, 11, 0.12);
  color: #F59E0B;
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

// ─── Clubs Table ──────────────────────────────────────────────────────
.clubs-table {
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

.club-name-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.club-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: rgba(99, 91, 255, 0.1);
  color: #635BFF;
  font-weight: 700;
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.club-name-text {
  font-weight: 600;
}

// ─── Activity Feed ────────────────────────────────────────────────────
.activity-card {
  display: flex;
  flex-direction: column;
}

.activity-list {
  max-height: 480px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  transition: background var(--duration-fast) var(--ease-out);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-bg-tertiary);
  }
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.dot-success {
    background: #10B981;
  }

  &.dot-error {
    background: #EF4444;
  }
}

.activity-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.activity-fn {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.activity-user {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.activity-duration {
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
  color: var(--color-text-secondary);
}

.activity-time {
  font-size: 0.625rem;
  color: var(--color-text-muted);
}
</style>
