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

      <!-- Quick tabs + AI button -->
      <div class="tabs-row q-mb-md">
        <q-tabs
          v-model="activeTab"
          dense
          class="text-grey-7"
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
        <q-btn
          v-if="aiAvailable && activeTab === 'uncategorized' && filteredTransactions.length > 0"
          :loading="aiCategorizing"
          color="deep-purple"
          icon="auto_awesome"
          :label="aiCategorizing ? `${aiProgress}/${aiTotal}` : 'Auto-categorizar'"
          no-caps
          unelevated
          size="sm"
          class="ai-categorize-btn"
          @click="aiAutoCategorizeUncategorized"
        >
          <q-tooltip>Usar IA para sugerir categorías</q-tooltip>
        </q-btn>
      </div>

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

    <!-- AI Suggestions Review Dialog -->
    <q-dialog v-model="showAISuggestions" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="ai-suggestions-card">
        <q-card-section class="ai-suggestions-header">
          <div class="row items-center">
            <q-icon name="auto_awesome" color="deep-purple" size="28px" class="q-mr-sm" />
            <div>
              <div class="text-h6">Sugerencias de IA</div>
              <div class="text-caption text-grey">Revisa y confirma las categorías sugeridas</div>
            </div>
            <q-space />
            <q-btn flat round icon="close" @click="showAISuggestions = false" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="ai-suggestions-body">
          <q-scroll-area style="height: calc(100vh - 200px)">
            <div
              v-for="(s, idx) in aiSuggestions"
              :key="s.transactionId"
              class="ai-suggestion-row"
              :class="{ accepted: s.accepted, rejected: s.rejected }"
            >
              <div class="suggestion-info">
                <div class="suggestion-description">{{ s.description }}</div>
                <div class="suggestion-amount" :class="s.type">
                  {{ s.type === 'income' ? '+' : '-' }}{{ formatCurrency(s.amount) }}
                </div>
              </div>
              <div class="suggestion-category">
                <q-icon name="arrow_forward" size="16px" color="grey" class="q-mx-sm" />
                <template v-if="s.categoryName">
                  <q-chip
                    :color="s.confidence > 0.7 ? 'deep-purple-2' : 'amber-2'"
                    text-color="dark"
                    size="sm"
                    icon="auto_awesome"
                  >
                    {{ s.categoryName }}
                  </q-chip>
                  <q-badge
                    :color="s.confidence > 0.7 ? 'deep-purple' : 'amber'"
                    :label="`${Math.round(s.confidence * 100)}%`"
                    class="confidence-badge"
                  />
                </template>
                <span v-else class="text-grey-6">Sin sugerencia</span>
              </div>
              <div class="suggestion-actions">
                <q-btn
                  v-if="s.categoryId && !s.accepted && !s.rejected"
                  flat round dense icon="check" color="positive" size="sm"
                  @click="acceptSuggestion(idx)"
                >
                  <q-tooltip>Aceptar</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="s.categoryId && !s.accepted && !s.rejected"
                  flat round dense icon="close" color="negative" size="sm"
                  @click="rejectSuggestion(idx)"
                >
                  <q-tooltip>Rechazar</q-tooltip>
                </q-btn>
                <q-icon v-if="s.accepted" name="check_circle" color="positive" size="20px" />
                <q-icon v-if="s.rejected" name="cancel" color="grey-5" size="20px" />
              </div>
            </div>
          </q-scroll-area>
        </q-card-section>

        <q-separator />

        <q-card-actions class="ai-suggestions-footer">
          <div class="text-caption text-grey">
            {{ acceptedCount }} aceptadas · {{ rejectedCount }} rechazadas · {{ pendingSuggestionCount }} pendientes
          </div>
          <q-space />
          <q-btn
            flat
            label="Aceptar todas"
            icon="done_all"
            color="positive"
            no-caps
            :disable="pendingSuggestionCount === 0"
            @click="acceptAllSuggestions"
          />
          <q-btn
            unelevated
            label="Aplicar aceptadas"
            icon="save"
            color="deep-purple"
            no-caps
            :loading="aiApplying"
            :disable="acceptedCount === 0"
            @click="applyAcceptedSuggestions"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useDebounceFn } from '@vueuse/core';
import { useAuthStore } from 'src/stores/auth';
import { useTransactionsStore } from 'src/stores/transactions';
import { useCategoriesStore } from 'src/stores/categories';
import { useTeamsStore } from 'src/stores/teams';
import TransactionItem from 'src/components/TransactionItem.vue';
import { useSelectFilter } from 'src/composables/useSelectFilter';
import { isAIAvailable, suggestCategoriesBatch, type CategoryInfo } from 'src/services/aiCategorization';
import { formatCurrency } from 'src/utils/formatters';
import type { TransactionFilters, TransactionType, TransactionStatus } from 'src/types';
import { getSeasonOptions, UNCATEGORIZED_CATEGORY_ID } from 'src/types';

const $q = useQuasar();
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

// === AI Auto-categorization ===
const aiAvailable = isAIAvailable()
const aiCategorizing = ref(false)
const aiProgress = ref(0)
const aiTotal = ref(0)
const showAISuggestions = ref(false)
const aiApplying = ref(false)

interface AISuggestionItem {
  transactionId: string
  description: string
  amount: number
  type: 'income' | 'expense'
  categoryId: string | null
  categoryName: string | null
  confidence: number
  accepted: boolean
  rejected: boolean
}

const aiSuggestions = ref<AISuggestionItem[]>([])

const acceptedCount = computed(() => aiSuggestions.value.filter(s => s.accepted).length)
const rejectedCount = computed(() => aiSuggestions.value.filter(s => s.rejected).length)
const pendingSuggestionCount = computed(() =>
  aiSuggestions.value.filter(s => s.categoryId && !s.accepted && !s.rejected).length
)

function buildCategoryInfoList(): CategoryInfo[] {
  return categoriesStore.allActiveCategories.map(c => {
    const parent = c.parentId ? categoriesStore.getCategoryById(c.parentId) : null
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      parentName: parent?.name
    }
  })
}

async function aiAutoCategorizeUncategorized() {
  const uncategorized = filteredTransactions.value
  if (uncategorized.length === 0) return

  aiCategorizing.value = true
  aiProgress.value = 0
  aiTotal.value = uncategorized.length

  try {
    const categories = buildCategoryInfoList()
    const concepts = uncategorized.map(t => ({
      concept: t.description,
      type: t.type
    }))

    const suggestions = await suggestCategoriesBatch(concepts, categories)

    aiSuggestions.value = uncategorized.map((t, i) => ({
      transactionId: t.id,
      description: t.description,
      amount: t.amount,
      type: t.type,
      categoryId: suggestions[i]?.categoryId || null,
      categoryName: suggestions[i]?.categoryName || null,
      confidence: suggestions[i]?.confidence || 0,
      accepted: false,
      rejected: false
    }))

    aiProgress.value = uncategorized.length
    showAISuggestions.value = true
  } catch (e) {
    console.error('[AI] Uncategorized auto-categorize error:', e)
    $q.notify({
      type: 'negative',
      message: 'Error al auto-categorizar. Verifica la API key de Gemini.'
    })
  } finally {
    aiCategorizing.value = false
  }
}

function acceptSuggestion(idx: number) {
  aiSuggestions.value[idx].accepted = true
  aiSuggestions.value[idx].rejected = false
}

function rejectSuggestion(idx: number) {
  aiSuggestions.value[idx].rejected = true
  aiSuggestions.value[idx].accepted = false
}

function acceptAllSuggestions() {
  for (const s of aiSuggestions.value) {
    if (s.categoryId && !s.rejected) {
      s.accepted = true
    }
  }
}

async function applyAcceptedSuggestions() {
  const accepted = aiSuggestions.value.filter(s => s.accepted && s.categoryId)
  if (accepted.length === 0) return

  aiApplying.value = true
  try {
    for (const s of accepted) {
      const cat = categoriesStore.getCategoryById(s.categoryId!)
      if (cat) {
        await transactionsStore.updateTransaction(s.transactionId, {
          categoryId: s.categoryId!,
          categoryName: cat.name
        })
      }
    }

    $q.notify({
      type: 'positive',
      icon: 'auto_awesome',
      message: `${accepted.length} transacciones categorizadas`
    })

    showAISuggestions.value = false
    fetchWithFilters() // Refresh the list
  } catch (e) {
    console.error('[AI] Apply suggestions error:', e)
    $q.notify({ type: 'negative', message: 'Error al aplicar sugerencias' })
  } finally {
    aiApplying.value = false
  }
}

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

.tabs-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .q-tabs {
    flex: 1;
  }

  .ai-categorize-btn {
    white-space: nowrap;
    border-radius: var(--radius-full);
    font-weight: 600;
    flex-shrink: 0;
  }
}

// === AI Suggestions Dialog ===
.ai-suggestions-card {
  .ai-suggestions-header {
    background: var(--color-bg-elevated);
  }

  .ai-suggestions-body {
    padding: 0;
  }

  .ai-suggestion-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border-light);
    transition: background 0.2s ease;

    &:hover {
      background: var(--color-bg-tertiary);
    }

    &.accepted {
      background: rgba(76, 175, 80, 0.06);
    }

    &.rejected {
      opacity: 0.4;
    }

    .suggestion-info {
      flex: 1;
      min-width: 0;

      .suggestion-description {
        font-weight: 500;
        font-size: 0.875rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .suggestion-amount {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.8rem;
        font-weight: 600;

        &.income { color: var(--color-positive); }
        &.expense { color: var(--color-negative); }
      }
    }

    .suggestion-category {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 180px;
      flex-shrink: 0;

      .confidence-badge {
        font-size: 0.625rem;
        padding: 2px 6px;
        border-radius: 8px;
      }
    }

    .suggestion-actions {
      display: flex;
      gap: 4px;
      min-width: 60px;
      justify-content: flex-end;
    }
  }

  .ai-suggestions-footer {
    padding: 12px 16px;
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
