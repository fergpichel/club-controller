<template>
  <div class="whatif-simulator">
    <!-- Intro -->
    <div class="intro-card">
      <div class="intro-icon">
        <q-icon name="psychology" size="32px" />
      </div>
      <div class="intro-content">
        <h3>Simulador de Escenarios</h3>
        <p>Ajusta las variables para ver cómo afectarían a las finanzas del club. Los cambios se calculan sobre los datos actuales de la temporada.</p>
      </div>
    </div>

    <!-- Main Layout: Controls + Results -->
    <div class="simulator-layout">
      <!-- Left: Controls -->
      <div class="controls-panel">
        <!-- Presets -->
        <div class="presets-section">
          <label class="section-label">Escenarios predefinidos</label>
          <div class="presets-grid">
            <button 
              v-for="preset in presets" 
              :key="preset.id"
              class="preset-btn"
              :class="{ active: activePreset === preset.id }"
              @click="applyPreset(preset)"
            >
              <q-icon :name="preset.icon" size="20px" />
              <span>{{ preset.label }}</span>
            </button>
          </div>
        </div>

        <!-- Income Variables -->
        <div class="variables-section">
          <div class="section-header income">
            <q-icon name="trending_up" />
            <span>Ingresos</span>
            <q-badge :color="totalIncomeChange >= 0 ? 'positive' : 'negative'" text-color="white">
              {{ totalIncomeChange >= 0 ? '+' : '' }}{{ formatPercent(totalIncomeChange) }}
            </q-badge>
          </div>

          <div class="variable-group">
            <div class="variable-item">
              <div class="variable-header">
                <span class="variable-name">Cuotas de socios</span>
                <span class="variable-value" :class="{ positive: vars.cuotasChange > 0, negative: vars.cuotasChange < 0 }">
                  {{ vars.cuotasChange >= 0 ? '+' : '' }}{{ vars.cuotasChange }}%
                </span>
              </div>
              <q-slider
                v-model="vars.cuotasChange"
                :min="-50"
                :max="50"
                :step="5"
                label
                color="positive"
                track-color="grey-4"
              />
              <div class="variable-hint">
                {{ formatCurrency(baseData.cuotas) }} → {{ formatCurrency(baseData.cuotas * (1 + vars.cuotasChange/100)) }}
              </div>
            </div>

            <div class="variable-item">
              <div class="variable-header">
                <span class="variable-name">Número de socios</span>
                <span class="variable-value" :class="{ positive: vars.sociosChange > 0, negative: vars.sociosChange < 0 }">
                  {{ vars.sociosChange >= 0 ? '+' : '' }}{{ vars.sociosChange }}%
                </span>
              </div>
              <q-slider
                v-model="vars.sociosChange"
                :min="-30"
                :max="50"
                :step="5"
                label
                color="positive"
                track-color="grey-4"
              />
              <div class="variable-hint">
                ~{{ Math.round(180 * (1 + vars.sociosChange/100)) }} socios (base: 180)
              </div>
            </div>

            <div class="variable-item">
              <div class="variable-header">
                <span class="variable-name">Patrocinios</span>
                <span class="variable-value" :class="{ positive: vars.patrociniosChange > 0, negative: vars.patrociniosChange < 0 }">
                  {{ vars.patrociniosChange >= 0 ? '+' : '' }}{{ vars.patrociniosChange }}%
                </span>
              </div>
              <q-slider
                v-model="vars.patrociniosChange"
                :min="-100"
                :max="50"
                :step="10"
                label
                color="positive"
                track-color="grey-4"
              />
              <div class="variable-hint">
                {{ formatCurrency(baseData.patrocinios) }} → {{ formatCurrency(baseData.patrocinios * (1 + vars.patrociniosChange/100)) }}
              </div>
            </div>

            <div class="variable-item">
              <div class="variable-header">
                <span class="variable-name">Subvenciones</span>
                <span class="variable-value" :class="{ positive: vars.subvencionesChange > 0, negative: vars.subvencionesChange < 0 }">
                  {{ vars.subvencionesChange >= 0 ? '+' : '' }}{{ vars.subvencionesChange }}%
                </span>
              </div>
              <q-slider
                v-model="vars.subvencionesChange"
                :min="-100"
                :max="50"
                :step="10"
                label
                color="positive"
                track-color="grey-4"
              />
              <div class="variable-hint">
                {{ formatCurrency(baseData.subvenciones) }} → {{ formatCurrency(baseData.subvenciones * (1 + vars.subvencionesChange/100)) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Expense Variables -->
        <div class="variables-section">
          <div class="section-header expense">
            <q-icon name="trending_down" />
            <span>Gastos</span>
            <q-badge :color="totalExpenseChange <= 0 ? 'positive' : 'negative'" text-color="white">
              {{ totalExpenseChange >= 0 ? '+' : '' }}{{ formatPercent(totalExpenseChange) }}
            </q-badge>
          </div>

          <div class="variable-group">
            <div class="variable-item">
              <div class="variable-header">
                <span class="variable-name">Personal (salarios)</span>
                <span class="variable-value" :class="{ positive: vars.personalChange < 0, negative: vars.personalChange > 0 }">
                  {{ vars.personalChange >= 0 ? '+' : '' }}{{ vars.personalChange }}%
                </span>
              </div>
              <q-slider
                v-model="vars.personalChange"
                :min="-30"
                :max="30"
                :step="5"
                label
                color="negative"
                track-color="grey-4"
              />
              <div class="variable-hint">
                {{ formatCurrency(baseData.personal) }} → {{ formatCurrency(baseData.personal * (1 + vars.personalChange/100)) }}
              </div>
            </div>

            <div class="variable-item">
              <div class="variable-header">
                <span class="variable-name">Transporte</span>
                <span class="variable-value" :class="{ positive: vars.transporteChange < 0, negative: vars.transporteChange > 0 }">
                  {{ vars.transporteChange >= 0 ? '+' : '' }}{{ vars.transporteChange }}%
                </span>
              </div>
              <q-slider
                v-model="vars.transporteChange"
                :min="-50"
                :max="50"
                :step="5"
                label
                color="negative"
                track-color="grey-4"
              />
              <div class="variable-hint">
                {{ formatCurrency(baseData.transporte) }} → {{ formatCurrency(baseData.transporte * (1 + vars.transporteChange/100)) }}
              </div>
            </div>

            <div class="variable-item">
              <div class="variable-header">
                <span class="variable-name">Instalaciones</span>
                <span class="variable-value" :class="{ positive: vars.instalacionesChange < 0, negative: vars.instalacionesChange > 0 }">
                  {{ vars.instalacionesChange >= 0 ? '+' : '' }}{{ vars.instalacionesChange }}%
                </span>
              </div>
              <q-slider
                v-model="vars.instalacionesChange"
                :min="-30"
                :max="50"
                :step="5"
                label
                color="negative"
                track-color="grey-4"
              />
              <div class="variable-hint">
                {{ formatCurrency(baseData.instalaciones) }} → {{ formatCurrency(baseData.instalaciones * (1 + vars.instalacionesChange/100)) }}
              </div>
            </div>

            <div class="variable-item">
              <div class="variable-header">
                <span class="variable-name">Otros gastos</span>
                <span class="variable-value" :class="{ positive: vars.otrosGastosChange < 0, negative: vars.otrosGastosChange > 0 }">
                  {{ vars.otrosGastosChange >= 0 ? '+' : '' }}{{ vars.otrosGastosChange }}%
                </span>
              </div>
              <q-slider
                v-model="vars.otrosGastosChange"
                :min="-30"
                :max="30"
                :step="5"
                label
                color="negative"
                track-color="grey-4"
              />
              <div class="variable-hint">
                {{ formatCurrency(baseData.otrosGastos) }} → {{ formatCurrency(baseData.otrosGastos * (1 + vars.otrosGastosChange/100)) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Reset Button -->
        <q-btn 
          flat 
          color="grey" 
          icon="restart_alt" 
          label="Resetear todo" 
          class="reset-btn"
          @click="resetAll"
        />
      </div>

      <!-- Right: Results -->
      <div class="results-panel">
        <!-- Main Comparison -->
        <div class="comparison-card">
          <h4>Comparativa de escenario</h4>
          
          <div class="comparison-grid">
            <!-- Current -->
            <div class="comparison-column current">
              <span class="column-label">Actual</span>
              <div class="metric">
                <span class="metric-label">Ingresos</span>
                <span class="metric-value">{{ formatCurrency(currentTotals.income) }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Gastos</span>
                <span class="metric-value">{{ formatCurrency(currentTotals.expenses) }}</span>
              </div>
              <div class="metric balance">
                <span class="metric-label">Balance</span>
                <span class="metric-value" :class="currentTotals.balance >= 0 ? 'positive' : 'negative'">
                  {{ formatCurrency(currentTotals.balance) }}
                </span>
              </div>
            </div>

            <!-- Arrow -->
            <div class="comparison-arrow">
              <q-icon name="arrow_forward" size="24px" />
            </div>

            <!-- Simulated -->
            <div class="comparison-column simulated">
              <span class="column-label">Simulado</span>
              <div class="metric">
                <span class="metric-label">Ingresos</span>
                <span class="metric-value">{{ formatCurrency(simulatedTotals.income) }}</span>
                <span class="metric-diff" :class="incomeDiff >= 0 ? 'positive' : 'negative'">
                  {{ incomeDiff >= 0 ? '+' : '' }}{{ formatCurrency(incomeDiff) }}
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">Gastos</span>
                <span class="metric-value">{{ formatCurrency(simulatedTotals.expenses) }}</span>
                <span class="metric-diff" :class="expenseDiff <= 0 ? 'positive' : 'negative'">
                  {{ expenseDiff >= 0 ? '+' : '' }}{{ formatCurrency(expenseDiff) }}
                </span>
              </div>
              <div class="metric balance">
                <span class="metric-label">Balance</span>
                <span class="metric-value" :class="simulatedTotals.balance >= 0 ? 'positive' : 'negative'">
                  {{ formatCurrency(simulatedTotals.balance) }}
                </span>
                <span class="metric-diff" :class="balanceDiff >= 0 ? 'positive' : 'negative'">
                  {{ balanceDiff >= 0 ? '+' : '' }}{{ formatCurrency(balanceDiff) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Visual Chart -->
        <div class="chart-card">
          <Bar :data="chartData" :options="chartOptions" />
        </div>

        <!-- Impact Analysis -->
        <div class="impact-card" :class="impactLevel">
          <div class="impact-header">
            <q-icon :name="impactIcon" size="28px" />
            <div class="impact-title">
              <span class="impact-label">Impacto del escenario</span>
              <span class="impact-status">{{ impactStatus }}</span>
            </div>
          </div>
          <div class="impact-details">
            <p v-for="(insight, i) in impactInsights" :key="i">
              <q-icon :name="insight.icon" size="16px" :color="insight.color" />
              {{ insight.text }}
            </p>
          </div>
        </div>

        <!-- Action Recommendations -->
        <div v-if="recommendations.length > 0" class="recommendations-card">
          <h4>
            <q-icon name="lightbulb" color="warning" />
            Recomendaciones
          </h4>
          <ul>
            <li v-for="(rec, i) in recommendations" :key="i">{{ rec }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
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
import { useTransactionsStore } from 'src/stores/transactions'
import { ANNUAL_BUDGET } from 'src/mocks/data'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const transactionsStore = useTransactionsStore()

// Simulation variables
const vars = reactive({
  cuotasChange: 0,
  sociosChange: 0,
  patrociniosChange: 0,
  subvencionesChange: 0,
  personalChange: 0,
  transporteChange: 0,
  instalacionesChange: 0,
  otrosGastosChange: 0
})

const activePreset = ref<string | null>(null)

// Preset scenarios
const presets = [
  { 
    id: 'optimistic', 
    label: 'Optimista', 
    icon: 'sentiment_very_satisfied',
    changes: { cuotasChange: 10, sociosChange: 15, patrociniosChange: 20, subvencionesChange: 10, personalChange: 5, transporteChange: 0, instalacionesChange: 0, otrosGastosChange: 0 }
  },
  { 
    id: 'pessimistic', 
    label: 'Pesimista', 
    icon: 'sentiment_very_dissatisfied',
    changes: { cuotasChange: 0, sociosChange: -10, patrociniosChange: -30, subvencionesChange: -20, personalChange: 5, transporteChange: 15, instalacionesChange: 10, otrosGastosChange: 10 }
  },
  { 
    id: 'growth', 
    label: 'Crecimiento', 
    icon: 'rocket_launch',
    changes: { cuotasChange: 5, sociosChange: 30, patrociniosChange: 10, subvencionesChange: 0, personalChange: 15, transporteChange: 20, instalacionesChange: 10, otrosGastosChange: 5 }
  },
  { 
    id: 'austerity', 
    label: 'Austeridad', 
    icon: 'savings',
    changes: { cuotasChange: 0, sociosChange: 0, patrociniosChange: 0, subvencionesChange: 0, personalChange: -10, transporteChange: -20, instalacionesChange: -15, otrosGastosChange: -20 }
  },
  { 
    id: 'sponsor-loss', 
    label: 'Pérdida patrocinador', 
    icon: 'person_off',
    changes: { cuotasChange: 0, sociosChange: 0, patrociniosChange: -50, subvencionesChange: 0, personalChange: 0, transporteChange: 0, instalacionesChange: 0, otrosGastosChange: 0 }
  },
  { 
    id: 'fee-increase', 
    label: 'Subir cuotas 15%', 
    icon: 'price_change',
    changes: { cuotasChange: 15, sociosChange: -5, patrociniosChange: 0, subvencionesChange: 0, personalChange: 0, transporteChange: 0, instalacionesChange: 0, otrosGastosChange: 0 }
  }
]

// Base data from budget
const baseData = computed(() => ({
  cuotas: ANNUAL_BUDGET.income.cuotas + ANNUAL_BUDGET.income.inscripciones,
  patrocinios: ANNUAL_BUDGET.income.patrociniosEquipos,
  subvenciones: ANNUAL_BUDGET.income.subvencionesPublicas,
  otrosIngresos: ANNUAL_BUDGET.income.eventos + ANNUAL_BUDGET.income.cantina + 
                 ANNUAL_BUDGET.income.merchandising + ANNUAL_BUDGET.income.escuelasVerano + 
                 ANNUAL_BUDGET.income.otros,
  personal: ANNUAL_BUDGET.expenses.salarios + ANNUAL_BUDGET.expenses.seguridadSocial,
  transporte: ANNUAL_BUDGET.expenses.transporte,
  instalaciones: ANNUAL_BUDGET.expenses.alquilerInstalaciones + ANNUAL_BUDGET.expenses.suministros,
  otrosGastos: ANNUAL_BUDGET.expenses.equipaciones + ANNUAL_BUDGET.expenses.materialDeportivo + 
               ANNUAL_BUDGET.expenses.arbitrajes + ANNUAL_BUDGET.expenses.federacion +
               ANNUAL_BUDGET.expenses.seguros + ANNUAL_BUDGET.expenses.marketing +
               ANNUAL_BUDGET.expenses.formacion + ANNUAL_BUDGET.expenses.mantenimiento +
               ANNUAL_BUDGET.expenses.administrativos + ANNUAL_BUDGET.expenses.eventosGastos +
               ANNUAL_BUDGET.expenses.tecnologia + ANNUAL_BUDGET.expenses.cantina +
               ANNUAL_BUDGET.expenses.sanitario + ANNUAL_BUDGET.expenses.escuelasVeranoGastos +
               ANNUAL_BUDGET.expenses.otros
}))

// Current totals
const currentTotals = computed(() => {
  const income = baseData.value.cuotas + baseData.value.patrocinios + baseData.value.subvenciones + baseData.value.otrosIngresos
  const expenses = baseData.value.personal + baseData.value.transporte + baseData.value.instalaciones + baseData.value.otrosGastos
  return {
    income,
    expenses,
    balance: income - expenses
  }
})

// Calculate total changes
const totalIncomeChange = computed(() => {
  const base = currentTotals.value.income
  const simulated = simulatedTotals.value.income
  return base > 0 ? ((simulated - base) / base) * 100 : 0
})

const totalExpenseChange = computed(() => {
  const base = currentTotals.value.expenses
  const simulated = simulatedTotals.value.expenses
  return base > 0 ? ((simulated - base) / base) * 100 : 0
})

// Simulated totals
const simulatedTotals = computed(() => {
  // Apply sociosChange to cuotas (more members = more fees)
  const sociosFactor = 1 + vars.sociosChange / 100
  const cuotasWithSocios = baseData.value.cuotas * sociosFactor * (1 + vars.cuotasChange / 100)
  
  const income = 
    cuotasWithSocios +
    baseData.value.patrocinios * (1 + vars.patrociniosChange / 100) +
    baseData.value.subvenciones * (1 + vars.subvencionesChange / 100) +
    baseData.value.otrosIngresos * sociosFactor // Other income also scales with members

  const expenses = 
    baseData.value.personal * (1 + vars.personalChange / 100) +
    baseData.value.transporte * (1 + vars.transporteChange / 100) * sociosFactor + // More members = more transport
    baseData.value.instalaciones * (1 + vars.instalacionesChange / 100) +
    baseData.value.otrosGastos * (1 + vars.otrosGastosChange / 100) * Math.sqrt(sociosFactor) // Partial scaling

  return {
    income: Math.round(income),
    expenses: Math.round(expenses),
    balance: Math.round(income - expenses)
  }
})

// Differences
const incomeDiff = computed(() => simulatedTotals.value.income - currentTotals.value.income)
const expenseDiff = computed(() => simulatedTotals.value.expenses - currentTotals.value.expenses)
const balanceDiff = computed(() => simulatedTotals.value.balance - currentTotals.value.balance)

// Impact analysis
const impactLevel = computed(() => {
  const balanceChange = balanceDiff.value
  const newBalance = simulatedTotals.value.balance
  
  if (newBalance < 0) return 'critical'
  if (balanceChange < -10000) return 'warning'
  if (balanceChange > 10000) return 'excellent'
  if (balanceChange > 0) return 'good'
  return 'neutral'
})

const impactIcon = computed(() => {
  switch (impactLevel.value) {
    case 'excellent': return 'celebration'
    case 'good': return 'thumb_up'
    case 'neutral': return 'remove'
    case 'warning': return 'warning'
    case 'critical': return 'error'
    default: return 'info'
  }
})

const impactStatus = computed(() => {
  switch (impactLevel.value) {
    case 'excellent': return 'Muy positivo'
    case 'good': return 'Positivo'
    case 'neutral': return 'Neutro'
    case 'warning': return 'Requiere atención'
    case 'critical': return 'Crítico'
    default: return ''
  }
})

const impactInsights = computed(() => {
  const insights = []
  
  // Balance insight
  if (balanceDiff.value > 0) {
    insights.push({
      icon: 'arrow_upward',
      color: 'positive',
      text: `El balance mejoraría en ${formatCurrency(balanceDiff.value)} respecto al escenario actual.`
    })
  } else if (balanceDiff.value < 0) {
    insights.push({
      icon: 'arrow_downward',
      color: 'negative',
      text: `El balance empeoraría en ${formatCurrency(Math.abs(balanceDiff.value))} respecto al escenario actual.`
    })
  }
  
  // Negative balance warning
  if (simulatedTotals.value.balance < 0) {
    insights.push({
      icon: 'dangerous',
      color: 'negative',
      text: `¡Alerta! El escenario resultaría en un déficit de ${formatCurrency(Math.abs(simulatedTotals.value.balance))}.`
    })
  }
  
  // Income dependency
  if (vars.patrociniosChange < -30) {
    insights.push({
      icon: 'info',
      color: 'warning',
      text: 'La pérdida significativa de patrocinios debería compensarse con otras fuentes de ingreso.'
    })
  }
  
  // Growth analysis
  if (vars.sociosChange > 20) {
    insights.push({
      icon: 'groups',
      color: 'info',
      text: `Un crecimiento del ${vars.sociosChange}% en socios también aumentaría gastos de transporte y material.`
    })
  }
  
  return insights
})

// Recommendations
const recommendations = computed(() => {
  const recs = []
  
  if (simulatedTotals.value.balance < 0) {
    recs.push('Considera reducir gastos no esenciales o buscar nuevas fuentes de ingreso.')
  }
  
  if (vars.patrociniosChange < -30 && vars.cuotasChange === 0) {
    recs.push('Ante la pérdida de patrocinadores, evalúa un incremento moderado de cuotas (5-10%).')
  }
  
  if (vars.sociosChange > 20 && vars.personalChange === 0) {
    recs.push('El crecimiento de socios puede requerir más personal técnico. Planifica la contratación.')
  }
  
  if (vars.transporteChange > 20) {
    recs.push('Explora alternativas de transporte: carpooling, convenios con empresas locales.')
  }
  
  if (balanceDiff.value > 15000) {
    recs.push('El escenario genera excedente. Considera destinarlo a reservas o mejoras de instalaciones.')
  }
  
  return recs
})

// Chart data
const chartData = computed(() => ({
  labels: ['Ingresos', 'Gastos', 'Balance'],
  datasets: [
    {
      label: 'Actual',
      data: [currentTotals.value.income, currentTotals.value.expenses, currentTotals.value.balance],
      backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(239, 68, 68, 0.6)', currentTotals.value.balance >= 0 ? 'rgba(99, 91, 255, 0.6)' : 'rgba(239, 68, 68, 0.6)'],
      borderColor: ['#10B981', '#EF4444', currentTotals.value.balance >= 0 ? '#635BFF' : '#EF4444'],
      borderWidth: 2,
      borderRadius: 6
    },
    {
      label: 'Simulado',
      data: [simulatedTotals.value.income, simulatedTotals.value.expenses, simulatedTotals.value.balance],
      backgroundColor: ['rgba(16, 185, 129, 0.9)', 'rgba(239, 68, 68, 0.9)', simulatedTotals.value.balance >= 0 ? 'rgba(99, 91, 255, 0.9)' : 'rgba(239, 68, 68, 0.9)'],
      borderColor: ['#059669', '#DC2626', simulatedTotals.value.balance >= 0 ? '#4F46E5' : '#DC2626'],
      borderWidth: 2,
      borderRadius: 6
    }
  ]
}))

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
      cornerRadius: 8,
      callbacks: {
        label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
          return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        font: { family: 'Inter', size: 11 },
        callback: (value: number | string) => {
          const numValue = typeof value === 'string' ? parseFloat(value) : value
          return `${(numValue / 1000).toFixed(0)}k€`
        }
      }
    },
    x: {
      grid: { display: false },
      ticks: {
        font: { family: 'Inter', size: 12, weight: '500' }
      }
    }
  }
}

// Functions
function applyPreset(preset: typeof presets[0]) {
  activePreset.value = preset.id
  Object.assign(vars, preset.changes)
}

function resetAll() {
  activePreset.value = null
  Object.keys(vars).forEach(key => {
    vars[key as keyof typeof vars] = 0
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

onMounted(async () => {
  await transactionsStore.fetchTransactions({})
})
</script>

<style lang="scss" scoped>
.whatif-simulator {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

// Intro Card
.intro-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-5);
  background: linear-gradient(135deg, rgba(99, 91, 255, 0.08) 0%, rgba(99, 91, 255, 0.02) 100%);
  border: 1px solid rgba(99, 91, 255, 0.2);
  border-radius: var(--radius-xl);

  .intro-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 91, 255, 0.15);
    border-radius: var(--radius-lg);
    color: #635BFF;
  }

  .intro-content {
    h3 {
      margin: 0 0 var(--space-2);
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    p {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }
  }
}

// Layout
.simulator-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--space-6);

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
}

// Controls Panel
.controls-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.presets-section {
  .section-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
    margin-bottom: var(--space-3);
  }
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);

  &:hover {
    border-color: #635BFF;
    color: #635BFF;
  }

  &.active {
    background: rgba(99, 91, 255, 0.1);
    border-color: #635BFF;
    color: #635BFF;
  }
}

// Variables Section
.variables-section {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-size: 0.875rem;
  font-weight: 600;

  &.income {
    background: rgba(16, 185, 129, 0.08);
    color: #10B981;
  }

  &.expense {
    background: rgba(239, 68, 68, 0.08);
    color: #EF4444;
  }

  .q-badge {
    margin-left: auto;
  }
}

.variable-group {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.variable-item {
  .variable-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }

  .variable-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .variable-value {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-text-secondary);

    &.positive { color: #10B981; }
    &.negative { color: #EF4444; }
  }

  .variable-hint {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    margin-top: var(--space-1);
  }
}

.reset-btn {
  align-self: flex-start;
}

// Results Panel
.results-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

// Comparison Card
.comparison-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  padding: var(--space-5);

  h4 {
    margin: 0 0 var(--space-4);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.comparison-grid {
  display: flex;
  align-items: stretch;
  gap: var(--space-4);
}

.comparison-column {
  flex: 1;
  padding: var(--space-4);
  border-radius: var(--radius-lg);

  &.current {
    background: var(--color-bg-tertiary);
  }

  &.simulated {
    background: rgba(99, 91, 255, 0.06);
    border: 1px solid rgba(99, 91, 255, 0.2);
  }

  .column-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-tertiary);
    margin-bottom: var(--space-3);
  }

  .metric {
    display: flex;
    flex-direction: column;
    margin-bottom: var(--space-3);

    &.balance {
      padding-top: var(--space-3);
      border-top: 1px solid var(--color-border-light);
    }
  }

  .metric-label {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }

  .metric-value {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text-primary);

    &.positive { color: #10B981; }
    &.negative { color: #EF4444; }
  }

  .metric-diff {
    font-size: 0.8125rem;
    font-weight: 600;

    &.positive { color: #10B981; }
    &.negative { color: #EF4444; }
  }
}

.comparison-arrow {
  display: flex;
  align-items: center;
  color: var(--color-text-tertiary);
}

// Chart Card
.chart-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  padding: var(--space-5);
  height: 280px;
}

// Impact Card
.impact-card {
  padding: var(--space-4);
  border-radius: var(--radius-xl);
  
  &.excellent {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%);
    border: 1px solid rgba(16, 185, 129, 0.3);
    .impact-header .q-icon { color: #10B981; }
    .impact-status { color: #10B981; }
  }

  &.good {
    background: linear-gradient(135deg, rgba(99, 91, 255, 0.08) 0%, rgba(99, 91, 255, 0.02) 100%);
    border: 1px solid rgba(99, 91, 255, 0.2);
    .impact-header .q-icon { color: #635BFF; }
    .impact-status { color: #635BFF; }
  }

  &.neutral {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-light);
    .impact-header .q-icon { color: var(--color-text-tertiary); }
    .impact-status { color: var(--color-text-secondary); }
  }

  &.warning {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%);
    border: 1px solid rgba(245, 158, 11, 0.3);
    .impact-header .q-icon { color: #F59E0B; }
    .impact-status { color: #F59E0B; }
  }

  &.critical {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.04) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
    .impact-header .q-icon { color: #EF4444; }
    .impact-status { color: #EF4444; }
  }

  .impact-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .impact-title {
    display: flex;
    flex-direction: column;
  }

  .impact-label {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .impact-status {
    font-size: 1rem;
    font-weight: 600;
  }

  .impact-details {
    padding-left: calc(28px + var(--space-3));

    p {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      margin: 0 0 var(--space-2);
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.5;

      &:last-child {
        margin-bottom: 0;
      }

      .q-icon {
        margin-top: 2px;
        flex-shrink: 0;
      }
    }
  }
}

// Recommendations Card
.recommendations-card {
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-xl);
  padding: var(--space-4);

  h4 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-3);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  ul {
    margin: 0;
    padding-left: var(--space-5);

    li {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin-bottom: var(--space-2);

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
