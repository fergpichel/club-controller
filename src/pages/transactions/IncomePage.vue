<template>
  <q-page class="income-page">
    <!-- Header -->
    <div class="page-header income-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Ingresos</h1>
          <p class="header-subtitle">{{ formatCurrency(totalIncome) }} este mes</p>
        </div>
        <q-btn
          color="white"
          text-color="positive"
          icon="add"
          label="Nuevo ingreso"
          :to="{ name: 'new-transaction', params: { type: 'income' } }"
          class="gt-xs"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Month selector -->
      <div class="month-selector q-mb-md">
        <q-btn flat round icon="chevron_left" @click="previousMonth" />
        <span class="month-label">{{ currentMonthLabel }}</span>
        <q-btn flat round icon="chevron_right" :disable="isCurrentMonth" @click="nextMonth" />
      </div>

      <!-- Summary cards -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-6 col-md-3">
          <div class="stat-card stat-positive">
            <div class="stat-value text-positive">{{ formatCurrency(totalIncome) }}</div>
            <div class="stat-label">Total ingresos</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-value">{{ incomeCount }}</div>
            <div class="stat-label">Transacciones</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-value">{{ formatCurrency(avgIncome) }}</div>
            <div class="stat-label">Media</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-value">{{ formatCurrency(largestIncome) }}</div>
            <div class="stat-label">Mayor ingreso</div>
          </div>
        </div>
      </div>

      <!-- Category breakdown -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <h3 class="section-title q-mb-md">Ingresos por categoría</h3>
          <div v-if="categoryBreakdown.length > 0">
            <div
              v-for="cat in categoryBreakdown"
              :key="cat.categoryId"
              class="category-row"
            >
              <div class="category-info">
                <q-icon :name="cat.icon" :style="{ color: cat.color }" size="20px" />
                <span class="category-name">{{ cat.categoryName }}</span>
              </div>
              <div class="category-bar-container">
                <div
                  class="category-bar"
                  :style="{ width: cat.percentage + '%', backgroundColor: cat.color }"
                ></div>
              </div>
              <div class="category-amount text-positive">{{ formatCurrency(cat.total) }}</div>
            </div>
          </div>
          <div v-else class="text-center text-grey-6 q-py-md">
            No hay datos para este período
          </div>
        </q-card-section>
      </q-card>

      <!-- Transactions list -->
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <h3 class="section-title">Detalle de ingresos</h3>
            <q-btn
              flat
              dense
              color="primary"
              icon="filter_list"
              @click="showFilters = !showFilters"
            />
          </div>

          <!-- Filters -->
          <div v-show="showFilters" class="filters-row q-mb-md">
            <q-select
              v-model="filterCategory"
              :options="categoryOptions"
              label="Categoría"
              outlined
              dense
              emit-value
              map-options
              clearable
              class="filter-select"
            />
            <q-select
              v-model="filterTeam"
              :options="teamOptions"
              label="Equipo"
              outlined
              dense
              emit-value
              map-options
              clearable
              class="filter-select"
            />
          </div>

          <div v-if="filteredIncome.length > 0">
            <TransactionItem
              v-for="income in filteredIncome"
              :key="income.id"
              :transaction="income"
              class="animate-stagger"
            />
          </div>

          <div v-else class="empty-state">
            <q-icon name="savings" class="empty-icon" />
            <p class="empty-title">Sin ingresos</p>
            <p class="empty-description">No hay ingresos registrados en este período</p>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Mobile FAB -->
    <q-page-sticky v-if="$q.screen.lt.sm" position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="add"
        color="positive"
        :to="{ name: 'new-transaction', params: { type: 'income' } }"
      />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTransactionsStore } from 'src/stores/transactions';
import { useCategoriesStore } from 'src/stores/categories';
import { useTeamsStore } from 'src/stores/teams';
import TransactionItem from 'src/components/TransactionItem.vue';

const transactionsStore = useTransactionsStore();
const categoriesStore = useCategoriesStore();
const teamsStore = useTeamsStore();

// State
const currentDate = ref(new Date());
const showFilters = ref(false);
const filterCategory = ref<string | null>(null);
const filterTeam = ref<string | null>(null);

// Computed
const currentMonthLabel = computed(() => {
  return format(currentDate.value, 'MMMM yyyy', { locale: es });
});

const isCurrentMonth = computed(() => {
  return isSameMonth(currentDate.value, new Date());
});

const incomes = computed(() => {
  return transactionsStore.transactions.filter(t => t.type === 'income');
});

const filteredIncome = computed(() => {
  let result = incomes.value;

  if (filterCategory.value) {
    result = result.filter(i => i.categoryId === filterCategory.value);
  }

  if (filterTeam.value) {
    result = result.filter(i => i.teamId === filterTeam.value);
  }

  return result;
});

const totalIncome = computed(() => {
  return incomes.value.reduce((sum, i) => sum + i.amount, 0);
});

const incomeCount = computed(() => incomes.value.length);

const avgIncome = computed(() => {
  return incomeCount.value > 0 ? totalIncome.value / incomeCount.value : 0;
});

const largestIncome = computed(() => {
  return incomes.value.length > 0 
    ? Math.max(...incomes.value.map(i => i.amount))
    : 0;
});

const categoryBreakdown = computed(() => {
  const breakdown: Record<string, { total: number; count: number }> = {};

  incomes.value.forEach(i => {
    if (!breakdown[i.categoryId]) {
      breakdown[i.categoryId] = { total: 0, count: 0 };
    }
    breakdown[i.categoryId].total += i.amount;
    breakdown[i.categoryId].count += 1;
  });

  return Object.entries(breakdown)
    .map(([categoryId, data]) => {
      const category = categoriesStore.getCategoryById(categoryId);
      return {
        categoryId,
        categoryName: category?.name || 'Sin categoría',
        icon: category?.icon || 'category',
        color: category?.color || '#9E9E9E',
        total: data.total,
        count: data.count,
        percentage: totalIncome.value > 0 ? (data.total / totalIncome.value) * 100 : 0
      };
    })
    .sort((a, b) => b.total - a.total);
});

const categoryOptions = computed(() => {
  return categoriesStore.incomeCategories.map(c => ({
    label: c.name,
    value: c.id
  }));
});

const teamOptions = computed(() => {
  return teamsStore.activeTeams.map(t => ({
    label: t.name,
    value: t.id
  }));
});

// Methods
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function previousMonth() {
  currentDate.value = subMonths(currentDate.value, 1);
}

function nextMonth() {
  currentDate.value = addMonths(currentDate.value, 1);
}

async function loadIncome() {
  const start = startOfMonth(currentDate.value);
  const end = endOfMonth(currentDate.value);

  await transactionsStore.fetchTransactions({
    type: 'income',
    dateFrom: start,
    dateTo: end
  });
}

// Watch for month changes
watch(currentDate, () => {
  loadIncome();
});

// Initial load
onMounted(async () => {
  // Ensure categories and teams are loaded
  await Promise.all([
    categoriesStore.fetchCategories(),
    teamsStore.fetchTeams()
  ]);
  loadIncome();
});
</script>

<style lang="scss" scoped>
.income-page {
  background: var(--color-background);
}

.income-header {
  background: linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%);
}

.page-content {
  max-width: 900px;
  margin: 0 auto;
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;

  .month-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    text-transform: capitalize;
    min-width: 160px;
    text-align: center;
  }
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  &:last-child {
    border-bottom: none;
  }

  .category-info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 140px;

    .category-name {
      font-size: 0.9rem;
    }
  }

  .category-bar-container {
    flex: 1;
    height: 8px;
    background: var(--color-surface-variant);
    border-radius: 4px;
    overflow: hidden;

    .category-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }

  .category-amount {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    min-width: 80px;
    text-align: right;
  }
}

.filters-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  .filter-select {
    min-width: 150px;
    flex: 1;
  }
}
</style>
