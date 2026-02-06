<template>
  <div class="team-radar-chart">
    <div class="radar-header">
      <div class="header-left">
        <h3>{{ title }}</h3>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-right">
        <q-select
          v-model="selectedTeams"
          :options="teamOptions"
          multiple
          dense
          outlined
          label="Equipos a comparar"
          emit-value
          map-options
          style="min-width: 250px"
          :max-values="4"
        >
          <template #option="{ itemProps, opt, selected, toggleOption }">
            <q-item v-bind="itemProps">
              <q-item-section side>
                <q-checkbox :model-value="selected" @update:model-value="toggleOption(opt)" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ opt.label }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <span class="team-color-dot" :style="{ background: opt.color }"></span>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </div>

    <!-- Radar Chart -->
    <div class="chart-container">
      <Radar v-if="chartData.datasets.length > 0" :data="chartData" :options="chartOptions" />
      <div v-else class="empty-state">
        <q-icon name="groups" size="48px" />
        <p>Selecciona equipos para comparar</p>
      </div>
    </div>

    <!-- Metrics Legend -->
    <div class="metrics-legend">
      <div v-for="metric in metrics" :key="metric.key" class="metric-item">
        <q-icon :name="metric.icon" size="18px" />
        <div class="metric-info">
          <span class="metric-name">{{ metric.name }}</span>
          <span class="metric-desc">{{ metric.description }}</span>
        </div>
      </div>
    </div>

    <!-- Team Cards -->
    <div v-if="selectedTeams.length > 0" class="team-cards">
      <div 
        v-for="team in selectedTeamData" 
        :key="team.id"
        class="team-card"
        :style="{ '--team-color': team.color }"
      >
        <div class="team-header">
          <q-avatar :style="{ background: team.color }" text-color="white" size="36px">
            {{ team.name.charAt(0) }}
          </q-avatar>
          <div class="team-info">
            <span class="team-name">{{ team.name }}</span>
            <span class="team-category">{{ team.category }}</span>
          </div>
        </div>
        <div class="team-metrics">
          <div class="metric-row">
            <span class="metric-label">Ingresos</span>
            <span class="metric-value positive">{{ formatCurrency(team.income) }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Gastos</span>
            <span class="metric-value negative">{{ formatCurrency(team.expenses) }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Balance</span>
            <span class="metric-value" :class="team.balance >= 0 ? 'positive' : 'negative'">
              {{ formatCurrency(team.balance) }}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Coste/jugador</span>
            <span class="metric-value">{{ formatCurrency(team.costPerPlayer) }}</span>
          </div>
        </div>
        <div class="team-badge" :class="team.balance >= 0 ? 'surplus' : 'deficit'">
          {{ team.balance >= 0 ? 'Superávit' : 'Déficit' }}
        </div>
      </div>
    </div>

    <!-- Insights -->
    <div v-if="insights.length > 0" class="insights-section">
      <div v-for="insight in insights" :key="insight.id" class="insight-card" :class="insight.type">
        <q-icon :name="insight.icon" size="20px" />
        <span>{{ insight.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import { useTransactionsStore } from 'src/stores/transactions'
import { useTeamsStore } from 'src/stores/teams'
import { formatCurrency } from 'src/utils/formatters'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

withDefaults(defineProps<{
  title?: string
  subtitle?: string
}>(), {
  title: 'Comparativa de Equipos',
  subtitle: 'Análisis multidimensional'
})

const transactionsStore = useTransactionsStore()
const teamsStore = useTeamsStore()

const selectedTeams = ref<string[]>([])

// Team colors
const teamColors = [
  '#635BFF', '#10B981', '#F59E0B', '#EF4444',
  '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6'
]

// Metrics for radar
const metrics = [
  { key: 'income', name: 'Ingresos', description: 'Total de ingresos generados', icon: 'trending_up' },
  { key: 'profitability', name: 'Rentabilidad', description: 'Balance ingresos - gastos', icon: 'account_balance' },
  { key: 'efficiency', name: 'Eficiencia', description: 'Ratio ingresos/gastos', icon: 'speed' },
  { key: 'activity', name: 'Actividad', description: 'Número de transacciones', icon: 'receipt_long' },
  { key: 'costControl', name: 'Control costes', description: 'Coste por jugador', icon: 'savings' }
]

// Calculate team statistics
const teamStats = computed(() => {
  const stats: Record<string, {
    id: string
    name: string
    category: string
    color: string
    income: number
    expenses: number
    balance: number
    transactions: number
    players: number
    costPerPlayer: number
  }> = {}

  teamsStore.teams.forEach((team, index) => {
    stats[team.id] = {
      id: team.id,
      name: team.name,
      category: team.category || 'General',
      color: teamColors[index % teamColors.length],
      income: 0,
      expenses: 0,
      balance: 0,
      transactions: 0,
      players: team.playersCount || 15,
      costPerPlayer: 0
    }
  })

  transactionsStore.transactions
    .filter(t => t.teamId && t.status !== 'rejected')
    .forEach(t => {
      if (stats[t.teamId!]) {
        if (t.type === 'income') {
          stats[t.teamId!].income += t.amount
        } else {
          stats[t.teamId!].expenses += t.amount
        }
        stats[t.teamId!].transactions++
      }
    })

  // Calculate derived stats
  Object.values(stats).forEach(team => {
    team.balance = team.income - team.expenses
    team.costPerPlayer = team.players > 0 ? team.expenses / team.players : 0
  })

  return stats
})

// Team options for selector
const teamOptions = computed(() => {
  return Object.values(teamStats.value)
    .filter(t => t.transactions > 0)
    .sort((a, b) => b.income - a.income)
    .map(team => ({
      value: team.id,
      label: team.name,
      color: team.color
    }))
})

// Selected team data
const selectedTeamData = computed(() => {
  return selectedTeams.value
    .map(id => teamStats.value[id])
    .filter(Boolean)
})

// Normalize values for radar (0-100 scale)
const normalizedData = computed(() => {
  const allTeams = Object.values(teamStats.value).filter(t => t.transactions > 0)
  
  const maxIncome = Math.max(...allTeams.map(t => t.income), 1)
  const maxTransactions = Math.max(...allTeams.map(t => t.transactions), 1)
  const maxCostPerPlayer = Math.max(...allTeams.map(t => t.costPerPlayer), 1)
  
  return selectedTeamData.value.map(team => ({
    ...team,
    normalizedIncome: (team.income / maxIncome) * 100,
    normalizedProfitability: Math.max(0, 50 + (team.balance / maxIncome) * 50), // Center at 50
    normalizedEfficiency: team.expenses > 0 ? Math.min(100, (team.income / team.expenses) * 50) : 0,
    normalizedActivity: (team.transactions / maxTransactions) * 100,
    normalizedCostControl: 100 - (team.costPerPlayer / maxCostPerPlayer) * 100 // Inverted: lower cost = higher score
  }))
})

// Chart data
const chartData = computed(() => {
  if (normalizedData.value.length === 0) {
    return { labels: [], datasets: [] }
  }

  return {
    labels: metrics.map(m => m.name),
    datasets: normalizedData.value.map(team => ({
      label: team.name,
      data: [
        team.normalizedIncome,
        team.normalizedProfitability,
        team.normalizedEfficiency,
        team.normalizedActivity,
        team.normalizedCostControl
      ],
      backgroundColor: `${team.color}20`,
      borderColor: team.color,
      borderWidth: 2,
      pointBackgroundColor: team.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    }))
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: { family: 'Inter', size: 12 }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(10, 37, 64, 0.95)',
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20,
        display: false
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      angleLines: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      pointLabels: {
        font: { family: 'Inter', size: 11, weight: '500' },
        color: '#697586'
      }
    }
  }
}

// Insights
const insights = computed(() => {
  if (selectedTeamData.value.length < 2) return []
  
  const result = []
  
  // Most profitable
  const mostProfitable = [...selectedTeamData.value].sort((a, b) => b.balance - a.balance)[0]
  if (mostProfitable.balance > 0) {
    result.push({
      id: 'profitable',
      type: 'success',
      icon: 'emoji_events',
      text: `${mostProfitable.name} es el más rentable con un superávit de ${formatCurrency(mostProfitable.balance)}.`
    })
  }
  
  // Most efficient (best income/expense ratio)
  const mostEfficient = [...selectedTeamData.value]
    .filter(t => t.expenses > 0)
    .sort((a, b) => (b.income / b.expenses) - (a.income / a.expenses))[0]
  if (mostEfficient) {
    const ratio = (mostEfficient.income / mostEfficient.expenses).toFixed(2)
    result.push({
      id: 'efficient',
      type: 'info',
      icon: 'speed',
      text: `${mostEfficient.name} tiene la mejor eficiencia: genera ${ratio}€ por cada euro gastado.`
    })
  }
  
  // Highest cost per player
  const highestCost = [...selectedTeamData.value].sort((a, b) => b.costPerPlayer - a.costPerPlayer)[0]
  const lowestCost = [...selectedTeamData.value].sort((a, b) => a.costPerPlayer - b.costPerPlayer)[0]
  if (highestCost.id !== lowestCost.id) {
    const diff = highestCost.costPerPlayer - lowestCost.costPerPlayer
    result.push({
      id: 'cost',
      type: 'warning',
      icon: 'person',
      text: `${highestCost.name} tiene un coste por jugador ${formatCurrency(diff)} mayor que ${lowestCost.name}.`
    })
  }
  
  return result
})

// Auto-select top 3 teams on mount
watch(() => teamOptions.value, (options) => {
  if (options.length > 0 && selectedTeams.value.length === 0) {
    selectedTeams.value = options.slice(0, 3).map(o => o.value)
  }
}, { immediate: true })

onMounted(async () => {
  // Transactions are loaded by parent page; only fetch teams here
  await teamsStore.fetchTeams()
})
</script>

<style lang="scss" scoped>
.team-radar-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
}

.radar-header {
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

.team-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

// Chart
.chart-container {
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-tertiary);
  
  p {
    margin: 0;
    font-size: 0.9375rem;
  }
}

// Metrics Legend
.metrics-legend {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
}

.metric-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);

  .q-icon {
    color: var(--color-text-tertiary);
    margin-top: 2px;
  }
}

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.metric-desc {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

// Team Cards
.team-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
}

.team-card {
  padding: var(--space-4);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--team-color);
  position: relative;
}

.team-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.team-info {
  display: flex;
  flex-direction: column;
}

.team-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.team-category {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.team-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.metric-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
}

.metric-label {
  color: var(--color-text-secondary);
}

.metric-value {
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  color: var(--color-text-primary);

  &.positive { color: #10B981; }
  &.negative { color: #EF4444; }
}

.team-badge {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;

  &.surplus {
    background: rgba(16, 185, 129, 0.1);
    color: #10B981;
  }

  &.deficit {
    background: rgba(239, 68, 68, 0.1);
    color: #EF4444;
  }
}

// Insights
.insights-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;

  &.success {
    background: rgba(16, 185, 129, 0.08);
    color: #059669;
  }

  &.info {
    background: rgba(99, 91, 255, 0.08);
    color: #635BFF;
  }

  &.warning {
    background: rgba(245, 158, 11, 0.08);
    color: #D97706;
  }

  .q-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }
}
</style>
