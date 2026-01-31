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
          color="white"
          text-color="primary"
          icon="add"
          label="Nueva"
          @click="showTypeDialog = true"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Filters -->
      <q-card class="filter-card q-mb-md">
        <q-card-section class="q-pa-sm">
          <div class="row q-col-gutter-sm items-center">
            <!-- Search -->
            <div class="col-12 col-sm-4">
              <q-input
                v-model="searchQuery"
                dense
                outlined
                placeholder="Buscar..."
                clearable
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <!-- Type filter -->
            <div class="col-6 col-sm-2">
              <q-select
                v-model="filterType"
                dense
                outlined
                :options="typeOptions"
                emit-value
                map-options
                clearable
                placeholder="Tipo"
              />
            </div>

            <!-- Category filter -->
            <div class="col-6 col-sm-2">
              <q-select
                v-model="filterCategory"
                dense
                outlined
                :options="categoryOptions"
                emit-value
                map-options
                clearable
                placeholder="Categoría"
              />
            </div>

            <!-- Team filter -->
            <div class="col-6 col-sm-2">
              <q-select
                v-model="filterTeam"
                dense
                outlined
                :options="teamOptions"
                emit-value
                map-options
                clearable
                placeholder="Equipo"
              />
            </div>

            <!-- Date range -->
            <div class="col-6 col-sm-2">
              <q-btn
                outline
                dense
                color="grey-7"
                icon="date_range"
                :label="dateRangeLabel"
                class="full-width"
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
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>

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
      </q-tabs>

      <!-- Transactions List -->
      <div v-if="filteredTransactions.length > 0">
        <TransactionItem
          v-for="transaction in filteredTransactions"
          :key="transaction.id"
          :transaction="transaction"
          class="animate-stagger"
        />

        <!-- Load more -->
        <div v-if="transactionsStore.hasMore" class="text-center q-mt-md">
          <q-btn
            outline
            color="primary"
            label="Cargar más"
            :loading="transactionsStore.loading"
            @click="transactionsStore.loadMore()"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
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
import { useAuthStore } from 'src/stores/auth';
import { useTransactionsStore } from 'src/stores/transactions';
import { useCategoriesStore } from 'src/stores/categories';
import { useTeamsStore } from 'src/stores/teams';
import TransactionItem from 'src/components/TransactionItem.vue';
import type { TransactionFilters } from 'src/types';

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
const dateRange = ref<{ from: string; to: string } | null>(null);

// Options
const typeOptions = [
  { label: 'Ingresos', value: 'income' },
  { label: 'Gastos', value: 'expense' }
];

const categoryOptions = computed(() => {
  return categoriesStore.allActiveCategories.map(c => ({
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

// Computed
const pendingCount = computed(() => transactionsStore.pendingTransactions.length);

const hasFilters = computed(() => {
  return !!(searchQuery.value || filterType.value || filterCategory.value || filterTeam.value || dateRange.value);
});

const dateRangeLabel = computed(() => {
  if (!dateRange.value) return 'Fechas';
  return `${dateRange.value.from} - ${dateRange.value.to}`;
});

const filteredTransactions = computed(() => {
  let transactions = transactionsStore.transactions;

  // Tab filter
  if (activeTab.value === 'income') {
    transactions = transactions.filter(t => t.type === 'income');
  } else if (activeTab.value === 'expense') {
    transactions = transactions.filter(t => t.type === 'expense');
  } else if (activeTab.value === 'pending') {
    transactions = transactions.filter(t => t.status === 'pending');
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    transactions = transactions.filter(t =>
      t.description.toLowerCase().includes(query) ||
      t.categoryName?.toLowerCase().includes(query) ||
      t.vendor?.toLowerCase().includes(query)
    );
  }

  return transactions;
});

// Methods
function clearFilters() {
  searchQuery.value = '';
  filterType.value = null;
  filterCategory.value = null;
  filterTeam.value = null;
  dateRange.value = null;
  activeTab.value = 'all';
}

async function applyFilters() {
  const filters: TransactionFilters = {};

  if (filterType.value) {
    filters.type = filterType.value as 'income' | 'expense';
  }

  if (filterCategory.value) {
    filters.categoryId = filterCategory.value;
  }

  if (filterTeam.value) {
    filters.teamId = filterTeam.value;
  }

  if (dateRange.value) {
    filters.dateFrom = new Date(dateRange.value.from);
    filters.dateTo = new Date(dateRange.value.to);
  }

  await transactionsStore.fetchTransactions(filters);
}

// Watch filter changes
watch([filterType, filterCategory, filterTeam, dateRange], () => {
  applyFilters();
});

// Initial load
onMounted(async () => {
  // Ensure categories and teams are loaded for filters
  await Promise.all([
    categoriesStore.fetchCategories(),
    teamsStore.fetchTeams()
  ]);
  transactionsStore.fetchTransactions({});
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

.filter-card {
  :deep(.q-field) {
    .q-field__control {
      border-radius: 8px;
    }
  }
}

:deep(.q-tabs) {
  .q-tab {
    padding: 8px 16px;
  }
}
</style>
