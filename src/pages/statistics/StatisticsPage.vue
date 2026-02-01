<template>
  <q-page class="statistics-page">
    <!-- Header -->
    <div class="page-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Estadísticas</h1>
          <p class="header-subtitle">Análisis financiero del club</p>
        </div>
        <q-btn-toggle
          v-model="viewPeriod"
          flat
          toggle-color="white"
          text-color="white"
          :options="[
            { label: 'Mes', value: 'month' },
            { label: 'Año', value: 'year' }
          ]"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Period selector -->
      <div class="period-selector q-mb-lg">
        <q-btn flat round icon="chevron_left" @click="previousPeriod" />
        <span class="period-label">{{ periodLabel }}</span>
        <q-btn flat round icon="chevron_right" :disable="isCurrentPeriod" @click="nextPeriod" />
      </div>

      <!-- Overview stats -->
      <div class="stats-grid q-mb-lg">
        <div class="stat-card stat-positive animate-fade-in">
          <div class="stat-value text-positive">{{ formatCurrency(stats?.totalIncome || 0) }}</div>
          <div class="stat-label">Total ingresos</div>
        </div>
        <div class="stat-card stat-negative animate-fade-in">
          <div class="stat-value text-negative">{{ formatCurrency(stats?.totalExpenses || 0) }}</div>
          <div class="stat-label">Total gastos</div>
        </div>
        <div class="stat-card stat-neutral animate-fade-in">
          <div class="stat-value" :class="(stats?.balance || 0) >= 0 ? 'text-positive' : 'text-negative'">
            {{ formatCurrency(stats?.balance || 0) }}
          </div>
          <div class="stat-label">Balance</div>
        </div>
        <div class="stat-card animate-fade-in">
          <div class="stat-value">{{ stats?.transactionCount || 0 }}</div>
          <div class="stat-label">Transacciones</div>
        </div>
      </div>

      <!-- Comparison with forecast -->
      <q-card v-if="hasForecasts" class="q-mb-lg animate-fade-in">
        <q-card-section>
          <h3 class="section-title q-mb-md">Comparativa con previsión</h3>
          <div class="comparison-grid">
            <div class="comparison-item">
              <div class="comparison-label">Ingresos previstos</div>
              <div class="comparison-value">{{ formatCurrency(forecastIncome) }}</div>
              <div class="comparison-diff" :class="incomeVariance >= 0 ? 'positive' : 'negative'">
                {{ incomeVariance >= 0 ? '+' : '' }}{{ incomeVariance.toFixed(1) }}%
              </div>
            </div>
            <div class="comparison-item">
              <div class="comparison-label">Gastos previstos</div>
              <div class="comparison-value">{{ formatCurrency(forecastExpenses) }}</div>
              <div class="comparison-diff" :class="expensesVariance <= 0 ? 'positive' : 'negative'">
                {{ expensesVariance >= 0 ? '+' : '' }}{{ expensesVariance.toFixed(1) }}%
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Charts -->
      <div class="row q-col-gutter-md q-mb-lg">
        <!-- Trend chart -->
        <div class="col-12 col-lg-8">
          <q-card class="chart-card animate-fade-in">
            <q-card-section>
              <h3 class="section-title q-mb-md">Evolución mensual</h3>
              <div class="chart-container">
                <Line v-if="trendChartData" :data="trendChartData" :options="lineChartOptions" />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Balance chart -->
        <div class="col-12 col-lg-4">
          <q-card class="chart-card animate-fade-in">
            <q-card-section>
              <h3 class="section-title q-mb-md">Balance acumulado</h3>
              <div class="chart-container">
                <Bar v-if="balanceChartData" :data="balanceChartData" :options="barChartOptions" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Category breakdown -->
      <div class="row q-col-gutter-md q-mb-lg">
        <!-- Income by category -->
        <div class="col-12 col-md-6">
          <q-card class="animate-fade-in">
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <h3 class="section-title">Ingresos por categoría</h3>
                <q-btn flat dense color="primary" label="Ver transacciones" :to="{ name: 'income' }" />
              </div>
              <!-- Category list with all categories -->
              <div v-if="incomeByCategory.length > 0" class="category-list-container">
                <div
                  v-for="cat in incomeByCategory"
                  :key="cat.categoryId"
                  class="category-row"
                  @click="$router.push({ name: 'category-stats', params: { id: cat.categoryId } })"
                >
                  <div class="category-row-left">
                    <q-icon :name="getCategoryIcon(cat.categoryId)" :style="{ color: getCategoryColor(cat.categoryId) }" size="20px" />
                    <span class="category-name">{{ cat.categoryName }}</span>
                  </div>
                  <div class="category-row-right">
                    <span class="category-amount text-positive">{{ formatCurrency(cat.total) }}</span>
                    <div class="category-bar">
                      <div 
                        class="category-bar-fill income"
                        :style="{ width: `${cat.percentage}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-grey-6 q-pa-md">
                Sin ingresos en este período
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Expenses by category -->
        <div class="col-12 col-md-6">
          <q-card class="animate-fade-in">
            <q-card-section>
              <div class="row items-center justify-between q-mb-md">
                <h3 class="section-title">Gastos por categoría</h3>
                <q-btn flat dense color="primary" label="Ver transacciones" :to="{ name: 'expenses' }" />
              </div>
              <!-- Category list with all categories -->
              <div v-if="expensesByCategory.length > 0" class="category-list-container">
                <div
                  v-for="cat in expensesByCategory"
                  :key="cat.categoryId"
                  class="category-row"
                  @click="$router.push({ name: 'category-stats', params: { id: cat.categoryId } })"
                >
                  <div class="category-row-left">
                    <q-icon :name="getCategoryIcon(cat.categoryId)" :style="{ color: getCategoryColor(cat.categoryId) }" size="20px" />
                    <span class="category-name">{{ cat.categoryName }}</span>
                  </div>
                  <div class="category-row-right">
                    <span class="category-amount text-negative">{{ formatCurrency(cat.total) }}</span>
                    <div class="category-bar">
                      <div 
                        class="category-bar-fill expense"
                        :style="{ width: `${cat.percentage}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-grey-6 q-pa-md">
                Sin gastos en este período
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- By team -->
      <q-card v-if="teamStats.length > 0" class="q-mb-lg animate-fade-in">
        <q-card-section>
          <h3 class="section-title q-mb-md">Por equipo</h3>
          <q-list>
            <q-item
              v-for="team in teamStats"
              :key="team.id"
              clickable
              :to="{ name: 'team-stats', params: { id: team.id } }"
            >
              <q-item-section avatar>
                <q-avatar :style="{ backgroundColor: team.color }" text-color="white" size="40px">
                  {{ team.name.charAt(0) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ team.name }}</q-item-label>
                <q-item-label caption>{{ team.transactionCount }} transacciones</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="team-amounts">
                  <span class="text-positive">+{{ formatCurrency(team.income) }}</span>
                  <span class="text-negative">-{{ formatCurrency(team.expenses) }}</span>
                </div>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- By project -->
      <q-card v-if="projectStats.length > 0" class="animate-fade-in">
        <q-card-section>
          <h3 class="section-title q-mb-md">Por proyecto</h3>
          <q-list>
            <q-item
              v-for="project in projectStats"
              :key="project.id"
              clickable
              :to="{ name: 'project-stats', params: { id: project.id } }"
            >
              <q-item-section avatar>
                <q-icon name="folder" color="secondary" size="32px" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ project.name }}</q-item-label>
                <q-item-label caption>
                  <q-badge v-if="project.budget" color="info" outline>
                    Presupuesto: {{ formatCurrency(project.budget) }}
                  </q-badge>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="team-amounts">
                  <span class="text-positive">+{{ formatCurrency(project.income) }}</span>
                  <span class="text-negative">-{{ formatCurrency(project.expenses) }}</span>
                </div>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Season Comparison -->
      <div class="season-comparison-section q-mb-lg animate-fade-in">
        <SeasonComparison
          title="Comparativa de Temporadas"
          subtitle="Evolución mensual vs temporada anterior"
        />
      </div>

      <!-- Expense Treemap -->
      <div class="treemap-section q-mb-lg animate-fade-in">
        <ExpenseTreemap
          title="Distribución de Gastos"
          subtitle="Visualización jerárquica por categoría"
        />
      </div>

      <!-- Team Radar Comparison -->
      <div class="radar-section q-mb-lg animate-fade-in">
        <TeamRadarChart
          title="Comparativa de Equipos"
          subtitle="Análisis multidimensional por equipo"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears, addMonths, addYears, isSameMonth, isSameYear } from 'date-fns';
import { es } from 'date-fns/locale';
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
  Filler
} from 'chart.js';
import { Line, Bar } from 'vue-chartjs';
import { useStatisticsStore } from 'src/stores/statistics';
import { useTransactionsStore } from 'src/stores/transactions';
import { useTeamsStore } from 'src/stores/teams';
import { useCategoriesStore } from 'src/stores/categories';
import SeasonComparison from 'src/components/SeasonComparison.vue';
import ExpenseTreemap from 'src/components/ExpenseTreemap.vue';
import TeamRadarChart from 'src/components/TeamRadarChart.vue';

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
);

const statisticsStore = useStatisticsStore();
const transactionsStore = useTransactionsStore();
const teamsStore = useTeamsStore();
const categoriesStore = useCategoriesStore();

// State
const viewPeriod = ref<'month' | 'year'>('month');
const currentDate = ref(new Date());

// Computed
const periodLabel = computed(() => {
  if (viewPeriod.value === 'month') {
    return format(currentDate.value, 'MMMM yyyy', { locale: es });
  }
  return format(currentDate.value, 'yyyy');
});

const isCurrentPeriod = computed(() => {
  if (viewPeriod.value === 'month') {
    return isSameMonth(currentDate.value, new Date());
  }
  return isSameYear(currentDate.value, new Date());
});

const stats = computed(() => {
  return viewPeriod.value === 'month' 
    ? statisticsStore.monthlyStats 
    : statisticsStore.yearlyStats;
});

const hasForecasts = computed(() => statisticsStore.forecasts.length > 0);
const forecastIncome = ref(0);
const forecastExpenses = ref(0);

const incomeVariance = computed(() => {
  if (!forecastIncome.value) return 0;
  return ((stats.value?.totalIncome || 0) - forecastIncome.value) / forecastIncome.value * 100;
});

const expensesVariance = computed(() => {
  if (!forecastExpenses.value) return 0;
  return ((stats.value?.totalExpenses || 0) - forecastExpenses.value) / forecastExpenses.value * 100;
});

// Charts data
const trendChartData = computed(() => {
  const data = statisticsStore.trendData;
  if (!data.length) return null;

  return {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Ingresos',
        data: data.map(d => d.income),
        borderColor: '#2E7D32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Gastos',
        data: data.map(d => d.expenses),
        borderColor: '#C62828',
        backgroundColor: 'rgba(198, 40, 40, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
});

const balanceChartData = computed(() => {
  const data = statisticsStore.trendData;
  if (!data.length) return null;

  return {
    labels: data.map(d => d.label),
    datasets: [{
      label: 'Balance',
      data: data.map(d => d.balance),
      backgroundColor: data.map(d => d.balance >= 0 ? '#2E7D32' : '#C62828')
    }]
  };
});

// Category lists for clickable navigation
const incomeByCategory = computed(() => statisticsStore.incomeCategoryStats);
const expensesByCategory = computed(() => statisticsStore.expenseCategoryStats);

// Category helpers
function getCategoryIcon(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId);
  return category?.icon || 'category';
}

function getCategoryColor(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId);
  return category?.color || '#9E9E9E';
}

// Team and project stats
const teamStats = computed(() => {
  const teams = teamsStore.activeTeams;
  return teams.map(team => {
    const teamTransactions = transactionsStore.transactions.filter(t => t.teamId === team.id);
    const income = teamTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = teamTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      id: team.id,
      name: team.name,
      color: team.color,
      income,
      expenses,
      transactionCount: teamTransactions.length
    };
  }).filter(t => t.transactionCount > 0);
});

const projectStats = computed(() => {
  const projects = teamsStore.activeProjects;
  return projects.map(project => {
    const projectTransactions = transactionsStore.transactions.filter(t => t.projectId === project.id);
    const income = projectTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = projectTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      id: project.id,
      name: project.name,
      budget: project.budget,
      income,
      expenses,
      transactionCount: projectTransactions.length
    };
  }).filter(p => p.transactionCount > 0);
});

// Chart options
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: (value: number) => formatCurrency(value) }
    }
  }
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: (value: number) => formatCurrency(value) }
    }
  }
};

// Methods
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function previousPeriod() {
  if (viewPeriod.value === 'month') {
    currentDate.value = subMonths(currentDate.value, 1);
  } else {
    currentDate.value = subYears(currentDate.value, 1);
  }
}

function nextPeriod() {
  if (viewPeriod.value === 'month') {
    currentDate.value = addMonths(currentDate.value, 1);
  } else {
    currentDate.value = addYears(currentDate.value, 1);
  }
}

async function loadStats() {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth() + 1;

  if (viewPeriod.value === 'month') {
    await statisticsStore.fetchMonthlyStats(year, month);
    const start = startOfMonth(currentDate.value);
    const end = endOfMonth(currentDate.value);
    await statisticsStore.fetchAllCategoryStats(start, end);
  } else {
    await statisticsStore.fetchYearlyStats(year);
    const start = startOfYear(currentDate.value);
    const end = endOfYear(currentDate.value);
    await statisticsStore.fetchAllCategoryStats(start, end);
  }

  await statisticsStore.fetchTrendData(12);
}

watch([currentDate, viewPeriod], () => {
  loadStats();
});

onMounted(async () => {
  // Ensure teams are loaded for team stats
  await teamsStore.fetchAll();
  loadStats();
});
</script>

<style lang="scss" scoped>
.statistics-page {
  background: var(--color-background);
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

.period-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;

  .period-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    text-transform: capitalize;
    min-width: 180px;
    text-align: center;
  }
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.chart-card {
  height: 100%;
}

.chart-container {
  height: 280px;
}

.chart-container-small {
  height: 200px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  .comparison-item {
    text-align: center;
    padding: 16px;
    background: var(--color-surface-variant);
    border-radius: var(--radius-md);

    .comparison-label {
      font-size: 0.8rem;
      color: var(--color-on-surface-variant);
      margin-bottom: 8px;
    }

    .comparison-value {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .comparison-diff {
      font-size: 0.9rem;
      font-weight: 600;

      &.positive { color: var(--color-positive); }
      &.negative { color: var(--color-negative); }
    }
  }
}

.team-amounts {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
}

.category-list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  
  &:hover {
    background: var(--color-bg-secondary);
    transform: translateX(4px);
  }
}

.category-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  
  .category-name {
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.category-row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 100px;
  
  .category-amount {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
  }
}

.category-bar {
  width: 80px;
  height: 4px;
  background: var(--color-border-light);
  border-radius: 2px;
  overflow: hidden;
  
  .category-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width var(--duration-normal) var(--ease-out);
    
    &.income {
      background: var(--q-positive);
    }
    
    &.expense {
      background: var(--q-negative);
    }
  }
}
</style>
