<template>
  <q-page class="transactions-page">
    <!-- Header -->
    <div class="page-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Transacciones</h1>
          <p class="header-subtitle">{{ transactionsStore.transactions.length }} movimientos</p>
        </div>
        <q-btn
          v-if="!$q.screen.lt.md"
          unelevated
          color="primary"
          text-color="white"
          icon="add"
          label="Nueva"
          @click="showTypeDialog = true"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Filters -->
      <div class="filter-bar q-mb-md">
        <div class="filter-row">
          <!-- Search -->
          <q-input
            v-model="searchQuery"
            dense
            outlined
            placeholder="Buscar..."
            clearable
            class="filter-search"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <!-- Type filter -->
          <q-select
            v-model="filterType"
            dense
            outlined
            :options="typeOptions"
            emit-value
            map-options
            clearable
            label="Tipo"
            class="filter-select"
          />

          <!-- Category filter -->
          <q-select
            v-model="filterCategory"
            dense
            outlined
            :options="categoryFilter.options.value"
            emit-value
            map-options
            clearable
            use-input
            input-debounce="0"
            label="Categoría"
            class="filter-select"
            @filter="categoryFilter.filter"
          />

          <!-- Team filter -->
          <q-select
            v-model="filterTeam"
            dense
            outlined
            :options="teamFilter.options.value"
            emit-value
            map-options
            clearable
            use-input
            input-debounce="0"
            label="Equipo"
            class="filter-select"
            @filter="teamFilter.filter"
          />

          <!-- Season filter -->
          <q-select
            v-model="filterSeason"
            dense
            outlined
            :options="seasonOptions"
            emit-value
            map-options
            clearable
            label="Temporada"
            class="filter-select"
          />

          <!-- Date range -->
          <q-btn
            outline
            dense
            icon="date_range"
            class="filter-date-btn"
          >
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date
                v-model="dateRange"
                range
                mask="YYYY-MM-DD"
              >
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Cerrar" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
            <q-tooltip>{{ dateRangeLabel }}</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Quick tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey-7 q-mb-md"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="all" label="Todas" />
        <q-tab name="income" label="Ingresos" />
        <q-tab name="expense" label="Gastos" />
        <q-tab v-if="authStore.canApprove" name="pending" label="Pendientes">
          <q-badge v-if="pendingCount > 0" color="warning" floating>{{ pendingCount }}</q-badge>
        </q-tab>
        <q-tab name="uncategorized" label="Sin categorizar">
          <q-badge v-if="uncategorizedCount > 0" color="amber" floating>{{ uncategorizedCount }}</q-badge>
        </q-tab>
      </q-tabs>

      <!-- Loading state -->
      <div v-if="isLoading && filteredTransactions.length === 0" class="loading-state">
        <q-spinner-dots size="40px" color="primary" />
        <p>Cargando transacciones...</p>
      </div>

      <!-- Transactions List -->
      <div v-else-if="filteredTransactions.length > 0">
        <TransactionItem
          v-for="transaction in filteredTransactions"
          :key="transaction.id"
          :transaction="transaction"
          class="animate-stagger"
        />

        <!-- Load more -->
        <div v-if="hasMore" class="text-center q-mt-md">
          <q-btn
            outline
            color="primary"
            label="Cargar más"
            :loading="isLoading"
            @click="loadMore"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!isLoading" class="empty-state">
        <q-icon name="receipt_long" class="empty-icon" />
        <p class="empty-title">No hay transacciones</p>
        <p class="empty-description">
          {{ hasFilters ? 'No se encontraron resultados con los filtros actuales' : 'Añade tu primera transacción' }}
        </p>
        <q-btn
          v-if="!hasFilters"
          color="primary"
          label="Nueva transacción"
          @click="showTypeDialog = true"
        />
        <q-btn
          v-else
          outline
          color="primary"
          label="Limpiar filtros"
          @click="clearFilters"
        />
      </div>
    </div>

    <!-- Type selection dialog -->
    <q-dialog v-model="showTypeDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Nueva transacción</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-gutter-md">
            <q-btn
              class="col"
              color="positive"
              icon="trending_up"
              label="Ingreso"
              :to="{ name: 'new-transaction', params: { type: 'income' } }"
              @click="showTypeDialog = false"
            />
            <q-btn
              class="col"
              color="negative"
              icon="trending_down"
              label="Gasto"
              :to="{ name: 'new-transaction', params: { type: 'expense' } }"
              @click="showTypeDialog = false"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useAuthStore } from 'src/stores/auth';
import { useTransactionsStore } from 'src/stores/transactions';
import { useCategoriesStore } from 'src/stores/categories';
import { useTeamsStore } from 'src/stores/teams';
import TransactionItem from 'src/components/TransactionItem.vue';
import { useSelectFilter } from 'src/composables/useSelectFilter';
import type { TransactionFilters, TransactionType, TransactionStatus } from 'src/types';
import { getSeasonOptions, UNCATEGORIZED_CATEGORY_ID } from 'src/types';

const authStore = useAuthStore();
const transactionsStore = useTransactionsStore();
const categoriesStore = useCategoriesStore();
const teamsStore = useTeamsStore();

// State
const showTypeDialog = ref(false);
const activeTab = ref('all');
const searchQuery = ref('');
const filterType = ref<string | null>(null);
const filterCategory = ref<string | null>(null);
const filterTeam = ref<string | null>(null);
const filterSeason = ref<string | null>(null);
const dateRange = ref<{ from: string; to: string } | null>(null);

// Options
const typeOptions = [
  { label: 'Ingresos', value: 'income' },
  { label: 'Gastos', value: 'expense' }
];

const seasonOptions = getSeasonOptions();

const categoryOptions = computed(() => {
  return categoriesStore.allActiveCategories.map(c => ({
    label: c.name,
    value: c.id
  }));
});
const categoryFilter = useSelectFilter(categoryOptions);

const teamOptions = computed(() => {
  return teamsStore.activeTeams.map(t => ({
    label: t.name,
    value: t.id
  }));
});
const teamFilter = useSelectFilter(teamOptions);

// Computed
const isLoading = computed(() => transactionsStore.loading);
const hasMore = computed(() => transactionsStore.hasMore);

const hasFilters = computed(() => {
  return !!(searchQuery.value || filterType.value || filterCategory.value || filterTeam.value || filterSeason.value || dateRange.value || activeTab.value !== 'all');
});

const dateRangeLabel = computed(() => {
  if (!dateRange.value) return 'Fechas';
  return `${dateRange.value.from} - ${dateRange.value.to}`;
});

// Build filters for Firebase query
function buildFilters(): TransactionFilters {
  const filters: TransactionFilters = {};

  // Type filter (from dropdown OR tab)
  if (filterType.value) {
    filters.type = filterType.value as TransactionType;
  } else if (activeTab.value === 'income') {
    filters.type = 'income';
  } else if (activeTab.value === 'expense') {
    filters.type = 'expense';
  }

  // Status filter (from tab)
  if (activeTab.value === 'pending') {
    filters.status = 'pending' as TransactionStatus;
  }

  // Category filter
  if (filterCategory.value) {
    filters.categoryId = filterCategory.value;
  }

  // Team filter
  if (filterTeam.value) {
    filters.teamId = filterTeam.value;
  }

  // Season filter
  if (filterSeason.value) {
    filters.season = filterSeason.value;
  }

  // Date range filter
  if (dateRange.value) {
    filters.dateFrom = new Date(dateRange.value.from);
    filters.dateTo = new Date(dateRange.value.to);
  }

  // Text search (server-side via searchKeywords)
  if (searchQuery.value && searchQuery.value.trim().length >= 2) {
    filters.searchQuery = searchQuery.value.trim();
  }

  // Uncategorized filter (handled specially)
  if (activeTab.value === 'uncategorized') {
    filters.uncategorized = true;
  }

  return filters;
}

// Transactions: additional client-side filtering for uncategorized only
const filteredTransactions = computed(() => {
  let transactions = transactionsStore.transactions;

  // Client-side: Uncategorized filter (complex OR query not supported in Firestore)
  if (activeTab.value === 'uncategorized') {
    transactions = transactions.filter(t =>
      !t.categoryId ||
      t.categoryId === UNCATEGORIZED_CATEGORY_ID ||
      t.categoryId === `${UNCATEGORIZED_CATEGORY_ID}_income`
    );
  }

  return transactions;
});

// Counts from currently loaded data
const pendingCount = computed(() => {
  return transactionsStore.transactions.filter(t => t.status === 'pending').length;
});

const uncategorizedCount = computed(() => {
  return transactionsStore.transactions.filter(t =>
    !t.categoryId ||
    t.categoryId === UNCATEGORIZED_CATEGORY_ID ||
    t.categoryId === `${UNCATEGORIZED_CATEGORY_ID}_income`
  ).length;
});

// Fetch transactions with current filters
async function fetchWithFilters() {
  const filters = buildFilters();
  await transactionsStore.fetchTransactions(filters);
}

// Debounced fetch for search input (300ms delay to avoid firing on every keystroke)
const debouncedSearch = useDebounceFn(() => {
  fetchWithFilters();
}, 300);

// Methods
function clearFilters() {
  searchQuery.value = '';
  filterType.value = null;
  filterCategory.value = null;
  filterTeam.value = null;
  filterSeason.value = null;
  dateRange.value = null;
  activeTab.value = 'all';
  fetchWithFilters();
}

async function loadMore() {
  if (hasMore.value && !isLoading.value) {
    await transactionsStore.loadMore();
  }
}

// Watch filter changes - fetch from server immediately
watch([filterType, filterCategory, filterTeam, filterSeason, dateRange, activeTab], () => {
  fetchWithFilters();
});

// Watch search query with debounce - fetch from server after 300ms
watch(searchQuery, () => {
  debouncedSearch();
});

// Initial load
onMounted(async () => {
  // Ensure categories and teams are loaded for filters
  await Promise.all([
    categoriesStore.fetchCategories(),
    teamsStore.fetchTeams()
  ]);
  fetchWithFilters();
});
</script>

<style lang="scss" scoped>
.transactions-page {
  background: var(--color-background);
}

.page-content {
  max-width: 900px;
  margin: 0 auto;
}

.filter-bar {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
}

.filter-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: center;
}

.filter-search {
  flex: 1;
  min-width: 180px;
}

.filter-select {
  min-width: 120px;
  max-width: 150px;
  
  :deep(.q-field__label) {
    color: var(--color-text-secondary) !important;
    font-size: 0.8125rem;
  }
  
  :deep(.q-field__native) {
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }
  
  :deep(.q-field__control) {
    height: 40px;
  }
}

.filter-date-btn {
  height: 40px;
  min-width: 40px;
  border-color: var(--color-border) !important;
  color: var(--color-text-secondary) !important;
  
  &:hover {
    border-color: var(--color-text-tertiary) !important;
    background: var(--color-bg-tertiary) !important;
  }
}

:deep(.q-tabs) {
  .q-tab {
    padding: 8px 16px;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10);
  color: var(--color-text-tertiary);
  
  p {
    margin-top: var(--space-4);
    font-size: 0.875rem;
  }
}

.empty-state {
  text-align: center;
  padding: var(--space-10);
  
  .empty-icon {
    font-size: 64px;
    color: var(--color-text-muted);
    margin-bottom: var(--space-4);
  }
  
  .empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--space-2);
  }
  
  .empty-description {
    color: var(--color-text-tertiary);
    margin-bottom: var(--space-6);
  }
}

@media (max-width: 600px) {
  .filter-row {
    flex-direction: column;
  }
  
  .filter-search,
  .filter-select {
    width: 100%;
    max-width: none;
  }
  
  .filter-date-btn {
    width: 100%;
  }
}
</style>
