<template>
  <div class="profitability-dashboard">
    <!-- Club Summary Header -->
    <div class="summary-header">
      <div class="summary-grid">
        <div class="summary-stat">
          <span class="stat-value">{{ totalTeams }}</span>
          <span class="stat-label">Equipos</span>
        </div>
        <div class="summary-stat stat-positive">
          <span class="stat-value">{{ profitableTeams }}</span>
          <span class="stat-label">Rentables</span>
        </div>
        <div class="summary-stat stat-warning">
          <span class="stat-value">{{ deficitTeams }}</span>
          <span class="stat-label">En déficit</span>
        </div>
        <div class="summary-stat stat-negative">
          <span class="stat-value">{{ criticalTeams }}</span>
          <span class="stat-label">Críticos</span>
        </div>
      </div>
      
      <div class="club-balance">
        <div class="balance-row">
          <span>Ingresos club</span>
          <span class="text-positive">{{ formatCurrency(clubSummary?.totalClubIncome || 0) }}</span>
        </div>
        <div class="balance-row">
          <span>Gastos club</span>
          <span class="text-negative">{{ formatCurrency(clubSummary?.totalClubExpenses || 0) }}</span>
        </div>
        <div class="balance-row balance-total">
          <span>Balance</span>
          <span :class="(clubSummary?.clubBalance || 0) >= 0 ? 'text-positive' : 'text-negative'">
            {{ formatCurrency(clubSummary?.clubBalance || 0) }}
          </span>
        </div>
        <div v-if="clubSummary?.unallocatedExpenses" class="balance-row unallocated">
          <span>Gastos no asignados</span>
          <span class="text-muted">{{ formatCurrency(clubSummary.unallocatedExpenses) }}</span>
        </div>
      </div>
    </div>

    <!-- Alerts Section -->
    <section v-if="topAlerts.length > 0" class="alerts-section">
      <h3 class="section-title">
        <q-icon name="notifications_active" class="q-mr-sm" />
        Alertas que requieren atención
      </h3>
      <div class="alerts-list">
        <div
          v-for="alert in topAlerts"
          :key="alert.id"
          class="alert-card"
          :class="alert.severity"
        >
          <div class="alert-icon">
            <q-icon :name="getAlertIcon(alert.type)" />
          </div>
          <div class="alert-content">
            <div class="alert-header">
              <span class="alert-team">{{ alert.teamName }}</span>
              <q-badge :color="getSeverityBadgeColor(alert.severity)">
                {{ getSeverityLabel(alert.severity) }}
              </q-badge>
            </div>
            <h4 class="alert-title">{{ alert.title }}</h4>
            <p class="alert-message">{{ alert.message }}</p>
            <p class="alert-recommendation">
              <q-icon name="lightbulb" size="14px" />
              {{ alert.recommendation }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Teams Grid -->
    <section class="teams-section">
      <div class="section-header">
        <h3 class="section-title">Rentabilidad por equipo</h3>
        <q-btn-toggle
          v-model="viewMode"
          flat
          toggle-color="primary"
          :options="[
            { label: 'Tarjetas', value: 'cards' },
            { label: 'Tabla', value: 'table' }
          ]"
        />
      </div>

      <!-- Cards View -->
      <div v-if="viewMode === 'cards'" class="teams-grid">
        <div
          v-for="team in teamFinancials"
          :key="team.teamId"
          class="team-card"
          :class="team.status"
        >
          <div class="team-header">
            <div class="team-avatar" :style="{ backgroundColor: team.teamColor }">
              {{ team.teamName.charAt(0) }}
            </div>
            <div class="team-info">
              <h4 class="team-name">{{ team.teamName }}</h4>
              <span class="team-meta">{{ team.playersCount }} jugadores · {{ getAgeGroupLabel(team.ageGroup) }}</span>
            </div>
            <q-badge :color="getStatusBadgeColor(team.status)" class="status-badge">
              {{ getStatusLabel(team.status) }}
            </q-badge>
          </div>

          <div class="team-finances">
            <div class="finance-row">
              <span>Ingresos</span>
              <span class="text-positive">{{ formatCurrency(team.totalIncome) }}</span>
            </div>
            <div class="finance-row">
              <span>Gastos</span>
              <span class="text-negative">{{ formatCurrency(team.totalExpenses) }}</span>
            </div>
            <div class="finance-row balance-row">
              <span>Balance</span>
              <span :class="team.balance >= 0 ? 'text-positive' : 'text-negative'">
                {{ formatCurrency(team.balance) }}
              </span>
            </div>
          </div>

          <q-separator />

          <div class="fee-analysis">
            <div class="fee-header">
              <span class="fee-label">Análisis de cuota</span>
              <q-icon 
                name="info" 
                size="16px" 
                class="cursor-pointer"
              >
                <q-tooltip>
                  Cuota mínima = (Gastos - Otros ingresos) / Jugadores / Meses
                </q-tooltip>
              </q-icon>
            </div>
            
            <div class="fee-comparison">
              <div class="fee-item">
                <span class="fee-value">{{ formatCurrency(team.currentMonthlyFee) }}</span>
                <span class="fee-desc">Cuota actual</span>
              </div>
              <div class="fee-arrow">
                <q-icon 
                  :name="team.feeGap >= 0 ? 'check_circle' : 'warning'" 
                  :color="team.feeGap >= 0 ? 'positive' : 'warning'"
                />
              </div>
              <div class="fee-item">
                <span class="fee-value">{{ formatCurrency(team.minSustainableFee) }}</span>
                <span class="fee-desc">Cuota mínima</span>
              </div>
            </div>

            <div v-if="team.feeGap < 0" class="fee-warning">
              <q-icon name="trending_up" size="14px" />
              Subir cuota en {{ formatCurrency(Math.abs(team.feeGap)) }}/mes
            </div>
            <div v-else class="fee-ok">
              <q-icon name="check" size="14px" />
              Margen de {{ formatCurrency(team.feeGap) }}/mes
            </div>

            <div class="coverage-bar">
              <span class="coverage-label">Cobertura por cuotas: {{ team.feeCoveragePercent.toFixed(0) }}%</span>
              <q-linear-progress
                :value="Math.min(team.feeCoveragePercent / 100, 1)"
                :color="getCoverageColor(team.feeCoveragePercent)"
                size="8px"
                rounded
              />
            </div>
          </div>

          <div class="team-breakdown">
            <details>
              <summary>Ver desglose</summary>
              <div class="breakdown-content">
                <h5>Ingresos</h5>
                <div class="breakdown-row">
                  <span>Cuotas</span>
                  <span>{{ formatCurrency(team.incomeFromFees) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Patrocinios</span>
                  <span>{{ formatCurrency(team.incomeFromSponsors) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Subvenciones</span>
                  <span>{{ formatCurrency(team.incomeFromGrants) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Otros</span>
                  <span>{{ formatCurrency(team.incomeOther + team.incomeFromEvents) }}</span>
                </div>
                
                <h5>Gastos</h5>
                <div class="breakdown-row">
                  <span>Entrenadores</span>
                  <span>{{ formatCurrency(team.expensesCoaches) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Equipaciones</span>
                  <span>{{ formatCurrency(team.expensesEquipment) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Material</span>
                  <span>{{ formatCurrency(team.expensesMaterial) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Transporte</span>
                  <span>{{ formatCurrency(team.expensesTransport) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Licencias/Federación</span>
                  <span>{{ formatCurrency(team.expensesFees) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Otros</span>
                  <span>{{ formatCurrency(team.expensesOther) }}</span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="teams-table-wrapper">
        <q-table
          :rows="teamFinancials"
          :columns="tableColumns"
          row-key="teamId"
          flat
          bordered
          dense
          :pagination="{ rowsPerPage: 25 }"
        >
          <template #body-cell-teamName="slotProps">
            <q-td :props="slotProps">
              <div class="table-team-cell">
                <div class="team-dot" :style="{ backgroundColor: slotProps.row.teamColor }"></div>
                <span>{{ slotProps.row.teamName }}</span>
              </div>
            </q-td>
          </template>
          <template #body-cell-status="slotProps">
            <q-td :props="slotProps">
              <q-badge :color="getStatusBadgeColor(slotProps.row.status)">
                {{ getStatusLabel(slotProps.row.status) }}
              </q-badge>
            </q-td>
          </template>
          <template #body-cell-balance="slotProps">
            <q-td :props="slotProps" :class="slotProps.row.balance >= 0 ? 'text-positive' : 'text-negative'">
              {{ formatCurrency(slotProps.row.balance) }}
            </q-td>
          </template>
          <template #body-cell-feeGap="slotProps">
            <q-td :props="slotProps" :class="slotProps.row.feeGap >= 0 ? 'text-positive' : 'text-negative'">
              {{ formatCurrency(slotProps.row.feeGap) }}
            </q-td>
          </template>
        </q-table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTransactionsStore } from 'src/stores/transactions'
import { useTeamsStore } from 'src/stores/teams'
import { useCategoriesStore } from 'src/stores/categories'
import {
  calculateTeamFinancials,
  generateTeamAlerts,
  calculateClubProfitability,
} from 'src/services/profitabilityAnalysis'
import { formatCurrency } from 'src/utils/formatters'
import { computeSeason } from 'src/types'
import type { TeamFinancials, TeamProfitabilityAlert, ClubProfitabilitySummary, AgeGroup, Season } from 'src/types'

const props = withDefaults(defineProps<{
  season?: Season
}>(), {
  season: () => computeSeason(new Date())
})

const transactionsStore = useTransactionsStore()
const teamsStore = useTeamsStore()
const categoriesStore = useCategoriesStore()

const viewMode = ref<'cards' | 'table'>('cards')
const teamFinancials = ref<TeamFinancials[]>([])
const clubSummary = ref<ClubProfitabilitySummary | null>(null)
const topAlerts = ref<TeamProfitabilityAlert[]>([])

// Sample monthly fees (would come from team settings in real app)
const sampleFees: Record<string, number> = {}

// Computed
const totalTeams = computed(() => clubSummary.value?.totalTeams || 0)
const profitableTeams = computed(() => clubSummary.value?.profitableTeams || 0)
const deficitTeams = computed(() => clubSummary.value?.deficitTeams || 0)
const criticalTeams = computed(() => clubSummary.value?.criticalTeams || 0)

const tableColumns = [
  { name: 'teamName', label: 'Equipo', field: 'teamName', sortable: true, align: 'left' as const },
  { name: 'playersCount', label: 'Jugadores', field: 'playersCount', sortable: true },
  { name: 'totalIncome', label: 'Ingresos', field: 'totalIncome', sortable: true, format: (v: number) => formatCurrency(v) },
  { name: 'totalExpenses', label: 'Gastos', field: 'totalExpenses', sortable: true, format: (v: number) => formatCurrency(v) },
  { name: 'balance', label: 'Balance', field: 'balance', sortable: true },
  { name: 'currentMonthlyFee', label: 'Cuota', field: 'currentMonthlyFee', sortable: true, format: (v: number) => formatCurrency(v) },
  { name: 'minSustainableFee', label: 'Cuota mín.', field: 'minSustainableFee', sortable: true, format: (v: number) => formatCurrency(v) },
  { name: 'feeGap', label: 'Diferencia', field: 'feeGap', sortable: true },
  { name: 'status', label: 'Estado', field: 'status', sortable: true }
]

// Methods
function getAgeGroupLabel(ageGroup?: AgeGroup): string {
  const labels: Record<string, string> = {
    biberon: 'Biberón',
    prebenjamin: 'Prebenjamín',
    benjamin: 'Benjamín',
    alevin: 'Alevín',
    infantil: 'Infantil',
    cadete: 'Cadete',
    juvenil: 'Juvenil',
    senior: 'Senior'
  }
  return ageGroup ? labels[ageGroup] || ageGroup : 'Sin categoría'
}

function getStatusLabel(status: TeamFinancials['status']): string {
  const labels = {
    surplus: 'Superávit',
    balanced: 'Equilibrado',
    deficit: 'Déficit',
    critical: 'Crítico'
  }
  return labels[status]
}

function getStatusBadgeColor(status: TeamFinancials['status']): string {
  const colors = {
    surplus: 'positive',
    balanced: 'primary',
    deficit: 'warning',
    critical: 'negative'
  }
  return colors[status]
}

function getSeverityLabel(severity: TeamProfitabilityAlert['severity']): string {
  const labels = { info: 'Info', warning: 'Atención', critical: 'Crítico' }
  return labels[severity]
}

function getSeverityBadgeColor(severity: TeamProfitabilityAlert['severity']): string {
  const colors = { info: 'info', warning: 'warning', critical: 'negative' }
  return colors[severity]
}

function getAlertIcon(type: TeamProfitabilityAlert['type']): string {
  const icons: Record<string, string> = {
    fee_too_low: 'trending_down',
    high_expense_category: 'trending_up',
    no_sponsors: 'handshake',
    coach_cost_high: 'person',
    deficit_projected: 'warning',
    expense_spike: 'show_chart',
    low_players: 'groups'
  }
  return icons[type] || 'info'
}

function getCoverageColor(percent: number): string {
  if (percent >= 80) return 'positive'
  if (percent >= 60) return 'primary'
  if (percent >= 40) return 'warning'
  return 'negative'
}

function recalculate() {
  // Filter teams by the selected season (only show teams that belong to this season)
  const teams = teamsStore.getTeamsBySeason(props.season).filter(t => t.isActive)
  const transactions = transactionsStore.transactions
  const categories = categoriesStore.categories

  // If there are no teams for this season, show empty state
  if (teams.length === 0) {
    teamFinancials.value = []
    clubSummary.value = null
    topAlerts.value = []
    return
  }

  // Calculate financials for each team (even if transactions are empty → shows 0 values)
  teamFinancials.value = teams.map(team => {
    const estimatedFee = team.ageGroup === 'senior' ? 35 : 
      ['juvenil', 'cadete'].includes(team.ageGroup || '') ? 30 : 25
    sampleFees[team.id] = estimatedFee

    return calculateTeamFinancials(team, transactions, categories, estimatedFee)
  })

  // Generate alerts
  const allAlerts: TeamProfitabilityAlert[] = []
  teamFinancials.value.forEach(financials => {
    const alerts = generateTeamAlerts(financials, transactions, categories)
    allAlerts.push(...alerts)
  })

  // Sort by severity and take top
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  topAlerts.value = allAlerts
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 6)

  // Calculate club summary
  clubSummary.value = calculateClubProfitability(teams, transactions, categories, sampleFees)
}

// Recalculate whenever season, transactions, teams or categories change
watch(
  [
    () => props.season,
    () => transactionsStore.transactions,
    () => teamsStore.teams,
    () => categoriesStore.categories
  ],
  () => {
    recalculate()
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.profitability-dashboard {
  padding: var(--space-4);
}

// Summary Header
.summary-header {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.summary-stat {
  text-align: center;
  padding: var(--space-4);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);

  .stat-value {
    display: block;
    font-family: 'DM Sans', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &.stat-positive .stat-value { color: var(--color-success); }
  &.stat-warning .stat-value { color: var(--color-warning); }
  &.stat-negative .stat-value { color: var(--color-danger); }
}

.club-balance {
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);

  .balance-row {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) 0;
    font-size: 0.9375rem;

    &.balance-total {
      border-top: 1px solid var(--color-border);
      margin-top: var(--space-2);
      padding-top: var(--space-3);
      font-weight: 700;
    }

    &.unallocated {
      font-size: 0.8125rem;
      opacity: 0.7;
    }
  }
}

// Alerts Section
.alerts-section {
  margin-bottom: var(--space-6);

  .section-title {
    display: flex;
    align-items: center;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: var(--space-4);
  }
}

.alerts-list {
  display: grid;
  gap: var(--space-3);

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.alert-card {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  border-left: 4px solid;

  &.info { border-left-color: var(--color-info); }
  &.warning { border-left-color: var(--color-warning); }
  &.critical { border-left-color: var(--color-danger); }

  .alert-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &.info .alert-icon { background: rgba(0, 180, 216, 0.1); color: var(--color-info); }
  &.warning .alert-icon { background: var(--color-warning-bg); color: var(--color-warning-dark); }
  &.critical .alert-icon { background: var(--color-danger-bg); color: var(--color-danger); }

  .alert-content {
    flex: 1;
    min-width: 0;
  }

  .alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-1);
  }

  .alert-team {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-tertiary);
  }

  .alert-title {
    font-size: 0.9375rem;
    font-weight: 700;
    margin: 0 0 var(--space-1);
  }

  .alert-message {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-2);
  }

  .alert-recommendation {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    font-size: 0.75rem;
    color: var(--color-accent);
    margin: 0;
    padding: var(--space-2);
    background: rgba(99, 91, 255, 0.05);
    border-radius: var(--radius-sm);
  }
}

// Teams Section
.teams-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .section-title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
  }
}

.teams-grid {
  display: grid;
  gap: var(--space-4);

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.team-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-out);

  &:hover {
    box-shadow: var(--shadow-card-hover);
    border-color: var(--color-border);
  }

  &.surplus { border-top: 3px solid var(--color-success); }
  &.balanced { border-top: 3px solid var(--color-accent); }
  &.deficit { border-top: 3px solid var(--color-warning); }
  &.critical { border-top: 3px solid var(--color-danger); }
}

.team-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);

  .team-avatar {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .team-info {
    flex: 1;
    min-width: 0;
  }

  .team-name {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .team-meta {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }

  .status-badge {
    flex-shrink: 0;
  }
}

.team-finances {
  padding: 0 var(--space-4) var(--space-4);

  .finance-row {
    display: flex;
    justify-content: space-between;
    padding: var(--space-1) 0;
    font-size: 0.875rem;

    &.balance-row {
      font-weight: 700;
      padding-top: var(--space-2);
      border-top: 1px dashed var(--color-border-light);
      margin-top: var(--space-1);
    }
  }
}

.fee-analysis {
  padding: var(--space-4);
  background: var(--color-bg-tertiary);

  .fee-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-3);

    .fee-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary);
    }
  }

  .fee-comparison {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }

  .fee-item {
    text-align: center;

    .fee-value {
      display: block;
      font-family: 'DM Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .fee-desc {
      font-size: 0.6875rem;
      color: var(--color-text-tertiary);
    }
  }

  .fee-arrow {
    padding: 0 var(--space-2);
  }

  .fee-warning, .fee-ok {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.75rem;
    font-weight: 600;
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    margin-bottom: var(--space-3);
  }

  .fee-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-dark);
  }

  .fee-ok {
    background: var(--color-success-bg);
    color: var(--color-success-dark);
  }

  .coverage-bar {
    .coverage-label {
      display: block;
      font-size: 0.6875rem;
      color: var(--color-text-tertiary);
      margin-bottom: var(--space-1);
    }
  }
}

.team-breakdown {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border-light);

  summary {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-accent);
    cursor: pointer;
    user-select: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .breakdown-content {
    padding-top: var(--space-3);

    h5 {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-tertiary);
      margin: var(--space-3) 0 var(--space-2);

      &:first-child {
        margin-top: 0;
      }
    }

    .breakdown-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      padding: var(--space-1) 0;
      color: var(--color-text-secondary);
    }
  }
}

// Table View
.teams-table-wrapper {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  overflow: hidden;

  .table-team-cell {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .team-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
  }
}

// Utilities
.text-positive { color: var(--color-success) !important; }
.text-negative { color: var(--color-danger) !important; }
.text-muted { color: var(--color-text-muted) !important; }
</style>
