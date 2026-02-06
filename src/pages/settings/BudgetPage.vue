<template>
  <q-page class="budget-page">
    <div class="page-header">
      <div class="row items-center justify-between">
        <div class="row items-center">
          <q-btn flat round icon="arrow_back" color="white" @click="$router.back()" />
          <div class="q-ml-sm">
            <h1>Presupuesto de Temporada</h1>
            <p class="header-subtitle">{{ selectedSeason }}</p>
          </div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn-dropdown outline color="white" :label="selectedSeason" icon="date_range">
            <q-list>
              <q-item v-for="s in availableSeasons" :key="s" v-close-popup clickable @click="selectedSeason = s">
                <q-item-section>{{ s }}</q-item-section>
                <q-item-section v-if="getBudgetExists(s)" side>
                  <q-badge color="positive" label="✓" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <q-inner-loading :showing="loading" />

      <!-- Summary Cards -->
      <div class="summary-grid q-mb-lg">
        <div class="summary-card income-card">
          <div class="summary-icon"><q-icon name="trending_up" size="24px" /></div>
          <div class="summary-info">
            <span class="summary-label">Total Ingresos</span>
            <span class="summary-value">{{ formatCurrency(totalIncome) }}</span>
          </div>
        </div>
        <div class="summary-card expense-card">
          <div class="summary-icon"><q-icon name="trending_down" size="24px" /></div>
          <div class="summary-info">
            <span class="summary-label">Total Gastos</span>
            <span class="summary-value">{{ formatCurrency(totalExpense) }}</span>
          </div>
        </div>
        <div class="summary-card" :class="balance >= 0 ? 'positive-card' : 'negative-card'">
          <div class="summary-icon"><q-icon name="account_balance" size="24px" /></div>
          <div class="summary-info">
            <span class="summary-label">Balance Proyectado</span>
            <span class="summary-value">{{ balance >= 0 ? '+' : '' }}{{ formatCurrency(balance) }}</span>
          </div>
        </div>
      </div>

      <!-- Target Surplus -->
      <div class="target-section q-mb-lg">
        <div class="section-card">
          <div class="section-header">
            <h2 class="section-title">
              <q-icon name="flag" class="q-mr-xs" /> Objetivo de superávit
            </h2>
          </div>
          <div class="section-body">
            <q-input
              v-model.number="form.targetSurplus"
              type="number"
              outlined
              dense
              prefix="€"
              hint="Objetivo de superávit para la temporada (puede ser 0)"
              class="target-input"
            />
          </div>
        </div>
      </div>

      <!-- Income Allocations -->
      <div class="allocations-section q-mb-lg">
        <div class="section-card">
          <div class="section-header">
            <h2 class="section-title income-title">
              <q-icon name="trending_up" class="q-mr-xs" /> Ingresos presupuestados
            </h2>
            <span class="section-total">{{ formatCurrency(totalIncome) }}</span>
          </div>
          <div class="section-body">
            <div v-if="form.incomeAllocations.length === 0" class="empty-allocations">
              <p>No hay partidas de ingreso. Añade categorías.</p>
            </div>
            <div v-for="(alloc, i) in form.incomeAllocations" :key="'inc-' + i" class="allocation-row">
              <div class="allocation-category">
                <div
                  class="category-dot"
                  :style="{ backgroundColor: getCategoryColor(alloc.categoryId) }"
                />
                <span>{{ getCategoryName(alloc.categoryId) }}</span>
              </div>
              <div class="allocation-input">
                <q-input
                  v-model.number="alloc.amount"
                  type="number"
                  outlined
                  dense
                  prefix="€"
                  :min="0"
                />
              </div>
              <q-btn flat round dense icon="close" size="sm" color="grey" @click="removeIncomeAllocation(i)" />
            </div>
            <div class="add-allocation">
              <q-select
                v-model="newIncomeCategory"
                :options="incomeCatFilter.options.value"
                label="Añadir categoría de ingreso"
                outlined
                dense
                emit-value
                map-options
                clearable
                use-input
                input-debounce="0"
                class="add-select"
                @filter="incomeCatFilter.filter"
              >
                <template #prepend>
                  <q-icon name="add" />
                </template>
              </q-select>
              <q-btn
                flat
                color="primary"
                label="Añadir"
                :disable="!newIncomeCategory"
                @click="addIncomeAllocation"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Expense Allocations -->
      <div class="allocations-section q-mb-lg">
        <div class="section-card">
          <div class="section-header">
            <h2 class="section-title expense-title">
              <q-icon name="trending_down" class="q-mr-xs" /> Gastos presupuestados
            </h2>
            <span class="section-total">{{ formatCurrency(totalExpense) }}</span>
          </div>
          <div class="section-body">
            <div v-if="form.expenseAllocations.length === 0" class="empty-allocations">
              <p>No hay partidas de gasto. Añade categorías.</p>
            </div>
            <div v-for="(alloc, i) in form.expenseAllocations" :key="'exp-' + i" class="allocation-row">
              <div class="allocation-category">
                <div
                  class="category-dot"
                  :style="{ backgroundColor: getCategoryColor(alloc.categoryId) }"
                />
                <span>{{ getCategoryName(alloc.categoryId) }}</span>
              </div>
              <div class="allocation-input">
                <q-input
                  v-model.number="alloc.amount"
                  type="number"
                  outlined
                  dense
                  prefix="€"
                  :min="0"
                />
              </div>
              <q-btn flat round dense icon="close" size="sm" color="grey" @click="removeExpenseAllocation(i)" />
            </div>
            <div class="add-allocation">
              <q-select
                v-model="newExpenseCategory"
                :options="expenseCatFilter.options.value"
                label="Añadir categoría de gasto"
                outlined
                dense
                emit-value
                map-options
                clearable
                use-input
                input-debounce="0"
                class="add-select"
                @filter="expenseCatFilter.filter"
              >
                <template #prepend>
                  <q-icon name="add" />
                </template>
              </q-select>
              <q-btn
                flat
                color="primary"
                label="Añadir"
                :disable="!newExpenseCategory"
                @click="addExpenseAllocation"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-section">
        <div class="section-card">
          <div class="section-body actions-body">
            <q-btn
              v-if="aiAvailable"
              unelevated
              color="deep-purple"
              icon="auto_awesome"
              label="Sugerir con IA"
              :loading="aiSuggesting"
              no-caps
              @click="aiSuggestBudget"
            >
              <q-tooltip>Propone importes basándose en la temporada anterior</q-tooltip>
            </q-btn>
            <q-btn
              unelevated
              color="primary"
              icon="save"
              :label="existingBudget ? 'Guardar cambios' : 'Crear presupuesto'"
              :loading="saving"
              @click="saveBudget"
            />
            <q-btn
              v-if="existingBudget"
              outline
              color="accent"
              icon="calendar_month"
              label="Distribuir por meses"
              :loading="distributing"
              @click="handleDistribute"
            >
              <q-tooltip>Genera previsiones mensuales a partir de este presupuesto</q-tooltip>
            </q-btn>
            <q-btn
              v-if="existingBudget"
              flat
              color="negative"
              icon="delete"
              label="Eliminar"
              @click="handleDelete"
            />
          </div>
        </div>
      </div>

      <!-- AI Suggestions Review Dialog -->
      <q-dialog v-model="showAISuggestions" maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card class="ai-budget-card">
          <q-card-section class="ai-budget-header">
            <div class="row items-center">
              <q-icon name="auto_awesome" color="deep-purple" size="28px" class="q-mr-sm" />
              <div>
                <div class="text-h6">Presupuesto sugerido por IA</div>
                <div class="text-caption text-grey">Basado en datos reales de {{ previousSeasonLabel }}</div>
              </div>
              <q-space />
              <q-btn flat round icon="close" @click="showAISuggestions = false" />
            </div>
          </q-card-section>

          <q-separator />

          <!-- General Notes -->
          <q-card-section v-if="aiResult?.generalNotes" class="ai-general-notes">
            <q-icon name="lightbulb" color="amber" size="20px" class="q-mr-sm" />
            <span>{{ aiResult.generalNotes }}</span>
          </q-card-section>

          <q-separator v-if="aiResult?.generalNotes" />

          <q-card-section class="ai-budget-body">
            <q-scroll-area style="height: calc(100vh - 260px)">
              <!-- Income suggestions -->
              <div v-if="aiIncomeSuggestions.length > 0" class="suggestion-group">
                <div class="suggestion-group-title income-title">
                  <q-icon name="trending_up" class="q-mr-xs" /> Ingresos
                  <span class="suggestion-group-total">{{ formatCurrency(aiIncomeTotal) }}</span>
                </div>
                <div
                  v-for="s in aiIncomeSuggestions"
                  :key="s.categoryId"
                  class="ai-budget-row"
                >
                  <div class="ai-budget-info">
                    <div class="ai-budget-cat">
                      <div class="category-dot" :style="{ backgroundColor: getCategoryColor(s.categoryId) }" />
                      <span>{{ s.categoryName }}</span>
                    </div>
                    <div class="ai-budget-reasoning">{{ s.reasoning }}</div>
                  </div>
                  <div class="ai-budget-amounts">
                    <div class="ai-budget-previous">
                      <span class="amount-label">Anterior</span>
                      <span class="amount-value">{{ formatCurrency(s.previousAmount) }}</span>
                    </div>
                    <q-icon name="arrow_forward" size="14px" color="grey" />
                    <div class="ai-budget-suggested">
                      <span class="amount-label">Sugerido</span>
                      <q-input
                        v-model.number="s.suggestedAmount"
                        type="number"
                        dense
                        outlined
                        prefix="€"
                        class="suggestion-input"
                      />
                    </div>
                    <q-badge
                      :color="s.changePercent > 0 ? 'positive' : s.changePercent < 0 ? 'negative' : 'grey'"
                      :label="(s.changePercent > 0 ? '+' : '') + s.changePercent.toFixed(0) + '%'"
                      class="change-badge"
                    />
                  </div>
                </div>
              </div>

              <!-- Expense suggestions -->
              <div v-if="aiExpenseSuggestions.length > 0" class="suggestion-group q-mt-lg">
                <div class="suggestion-group-title expense-title">
                  <q-icon name="trending_down" class="q-mr-xs" /> Gastos
                  <span class="suggestion-group-total">{{ formatCurrency(aiExpenseTotal) }}</span>
                </div>
                <div
                  v-for="s in aiExpenseSuggestions"
                  :key="s.categoryId"
                  class="ai-budget-row"
                >
                  <div class="ai-budget-info">
                    <div class="ai-budget-cat">
                      <div class="category-dot" :style="{ backgroundColor: getCategoryColor(s.categoryId) }" />
                      <span>{{ s.categoryName }}</span>
                    </div>
                    <div class="ai-budget-reasoning">{{ s.reasoning }}</div>
                  </div>
                  <div class="ai-budget-amounts">
                    <div class="ai-budget-previous">
                      <span class="amount-label">Anterior</span>
                      <span class="amount-value">{{ formatCurrency(s.previousAmount) }}</span>
                    </div>
                    <q-icon name="arrow_forward" size="14px" color="grey" />
                    <div class="ai-budget-suggested">
                      <span class="amount-label">Sugerido</span>
                      <q-input
                        v-model.number="s.suggestedAmount"
                        type="number"
                        dense
                        outlined
                        prefix="€"
                        class="suggestion-input"
                      />
                    </div>
                    <q-badge
                      :color="s.changePercent > 0 ? 'positive' : s.changePercent < 0 ? 'negative' : 'grey'"
                      :label="(s.changePercent > 0 ? '+' : '') + s.changePercent.toFixed(0) + '%'"
                      class="change-badge"
                    />
                  </div>
                </div>
              </div>

              <!-- Target surplus -->
              <div v-if="aiResult" class="suggestion-group q-mt-lg">
                <div class="suggestion-group-title">
                  <q-icon name="flag" class="q-mr-xs" /> Superávit objetivo
                </div>
                <div class="ai-surplus-row">
                  <span>La IA sugiere un superávit de</span>
                  <q-input
                    v-model.number="aiResult.targetSurplus"
                    type="number"
                    dense
                    outlined
                    prefix="€"
                    class="surplus-input"
                  />
                </div>
                <div class="ai-balance-preview">
                  Balance proyectado: <strong :class="aiBalance >= 0 ? 'text-positive' : 'text-negative'">
                    {{ aiBalance >= 0 ? '+' : '' }}{{ formatCurrency(aiBalance) }}
                  </strong>
                </div>
              </div>
            </q-scroll-area>
          </q-card-section>

          <q-separator />

          <q-card-actions class="ai-budget-footer">
            <q-btn flat label="Cancelar" @click="showAISuggestions = false" />
            <q-space />
            <q-btn
              unelevated
              color="deep-purple"
              icon="check"
              label="Aplicar al presupuesto"
              no-caps
              @click="applyAISuggestions"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore'
import { db } from 'src/boot/firebase'
import { useBudgetStore } from 'src/stores/budget'
import { useCategoriesStore } from 'src/stores/categories'
import { useAuthStore } from 'src/stores/auth'
import type { BudgetAllocation, Season } from 'src/types'
import { computeSeason, getSeasonDates } from 'src/types'
import { formatCurrency } from 'src/utils/formatters'
import { useSelectFilter } from 'src/composables/useSelectFilter'
import {
  isAIAvailable,
  suggestBudgetAllocations,
  type CategoryInfo,
  type HistoricalCategorySpend,
  type BudgetSuggestionResult
} from 'src/services/aiCategorization'
import { logger } from 'src/utils/logger'

const $q = useQuasar()
const budgetStore = useBudgetStore()
const categoriesStore = useCategoriesStore()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const distributing = ref(false)

// Season selector
const currentSeason = computeSeason(new Date())
const selectedSeason = ref<Season>(currentSeason)

const availableSeasons = computed(() => {
  const now = new Date()
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  const seasons: Season[] = []
  for (let y = year - 2; y <= year + 1; y++) {
    const shortNext = String(y + 1).slice(2)
    seasons.push(`${y}/${shortNext}` as Season)
  }
  return seasons.reverse()
})

// Form state
const form = ref({
  targetSurplus: 0,
  incomeAllocations: [] as BudgetAllocation[],
  expenseAllocations: [] as BudgetAllocation[]
})

const newIncomeCategory = ref<string | null>(null)
const newExpenseCategory = ref<string | null>(null)

// Existing budget for the selected season
const existingBudget = computed(() =>
  budgetStore.getBudgetForSeason(selectedSeason.value)
)

// Totals
const totalIncome = computed(() =>
  form.value.incomeAllocations.reduce((sum, a) => sum + (a.amount || 0), 0)
)
const totalExpense = computed(() =>
  form.value.expenseAllocations.reduce((sum, a) => sum + (a.amount || 0), 0)
)
const balance = computed(() => totalIncome.value - totalExpense.value)

// Available categories (not yet added)
const availableIncomeCategories = computed(() => {
  const usedIds = new Set(form.value.incomeAllocations.map(a => a.categoryId))
  return categoriesStore.incomeParentCategories
    .filter(c => !usedIds.has(c.id))
    .map(c => ({ label: c.name, value: c.id }))
})
const incomeCatFilter = useSelectFilter(availableIncomeCategories)

const availableExpenseCategories = computed(() => {
  const usedIds = new Set(form.value.expenseAllocations.map(a => a.categoryId))
  return categoriesStore.expenseParentCategories
    .filter(c => !usedIds.has(c.id))
    .map(c => ({ label: c.name, value: c.id }))
})
const expenseCatFilter = useSelectFilter(availableExpenseCategories)

// Helpers
function getCategoryName(id: string): string {
  return categoriesStore.getCategoryById(id)?.name || 'Categoría eliminada'
}

function getCategoryColor(id: string): string {
  return categoriesStore.getCategoryById(id)?.color || '#9E9E9E'
}

function getBudgetExists(season: Season): boolean {
  return !!budgetStore.getBudgetForSeason(season)
}

// Load form from existing budget
function loadFormFromBudget() {
  const budget = existingBudget.value
  if (budget) {
    form.value = {
      targetSurplus: budget.targetSurplus,
      incomeAllocations: budget.incomeAllocations.map(a => ({ ...a })),
      expenseAllocations: budget.expenseAllocations.map(a => ({ ...a }))
    }
  } else {
    // Pre-populate with all active parent categories
    form.value = {
      targetSurplus: 0,
      incomeAllocations: categoriesStore.incomeParentCategories.map(c => ({
        categoryId: c.id,
        amount: 0
      })),
      expenseAllocations: categoriesStore.expenseParentCategories.map(c => ({
        categoryId: c.id,
        amount: 0
      }))
    }
  }
}

// Allocation management
function addIncomeAllocation() {
  if (!newIncomeCategory.value) return
  form.value.incomeAllocations.push({
    categoryId: newIncomeCategory.value,
    amount: 0
  })
  newIncomeCategory.value = null
}

function addExpenseAllocation() {
  if (!newExpenseCategory.value) return
  form.value.expenseAllocations.push({
    categoryId: newExpenseCategory.value,
    amount: 0
  })
  newExpenseCategory.value = null
}

function removeIncomeAllocation(index: number) {
  form.value.incomeAllocations.splice(index, 1)
}

function removeExpenseAllocation(index: number) {
  form.value.expenseAllocations.splice(index, 1)
}

// Save
async function saveBudget() {
  saving.value = true
  try {
    const data = {
      season: selectedSeason.value,
      name: `Presupuesto ${selectedSeason.value}`,
      clubId: authStore.clubId || '',
      targetSurplus: form.value.targetSurplus || 0,
      incomeAllocations: form.value.incomeAllocations.filter(a => a.amount > 0),
      expenseAllocations: form.value.expenseAllocations.filter(a => a.amount > 0)
    }

    if (existingBudget.value) {
      await budgetStore.updateBudget(existingBudget.value.id, data)
      $q.notify({ type: 'positive', message: 'Presupuesto actualizado' })
    } else {
      await budgetStore.createBudget(data)
      $q.notify({ type: 'positive', message: 'Presupuesto creado' })
    }
  } catch (e) {
    logger.error('Error saving budget:', e)
    $q.notify({ type: 'negative', message: 'Error al guardar presupuesto' })
  } finally {
    saving.value = false
  }
}

// Distribute to forecasts
async function handleDistribute() {
  $q.dialog({
    title: 'Distribuir por meses',
    message: `Esto generará previsiones mensuales para la temporada ${selectedSeason.value} a partir de este presupuesto. Las previsiones existentes NO se eliminarán, se añadirán nuevas.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    distributing.value = true
    try {
      const count = await budgetStore.distributeToForecasts(selectedSeason.value)
      $q.notify({
        type: 'positive',
        message: `${count} previsiones mensuales generadas`
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al distribuir'
      $q.notify({ type: 'negative', message: msg })
    } finally {
      distributing.value = false
    }
  })
}

// Delete
function handleDelete() {
  if (!existingBudget.value) return
  $q.dialog({
    title: 'Eliminar presupuesto',
    message: `¿Eliminar el presupuesto de la temporada ${selectedSeason.value}? Esta acción no se puede deshacer.`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    await budgetStore.deleteBudget(existingBudget.value!.id)
    loadFormFromBudget()
    $q.notify({ type: 'positive', message: 'Presupuesto eliminado' })
  })
}

// === AI Budget Suggestion ===
const aiAvailable = isAIAvailable()
const aiSuggesting = ref(false)
const showAISuggestions = ref(false)
const aiResult = ref<BudgetSuggestionResult | null>(null)
const aiIncomeSuggestions = computed(() =>
  aiResult.value?.suggestions.filter(s => s.type === 'income') || []
)
const aiExpenseSuggestions = computed(() =>
  aiResult.value?.suggestions.filter(s => s.type === 'expense') || []
)
const aiIncomeTotal = computed(() =>
  aiIncomeSuggestions.value.reduce((sum, s) => sum + (s.suggestedAmount || 0), 0)
)
const aiExpenseTotal = computed(() =>
  aiExpenseSuggestions.value.reduce((sum, s) => sum + (s.suggestedAmount || 0), 0)
)
const aiBalance = computed(() => aiIncomeTotal.value - aiExpenseTotal.value)

// Previous season label for display
const previousSeasonLabel = computed(() => {
  const startYear = parseInt(selectedSeason.value.split('/')[0]) - 1
  const shortNext = String(startYear + 1).slice(2)
  return `${startYear}/${shortNext}`
})

/**
 * Fetch all transactions from a given season and aggregate by parent category
 */
async function fetchSeasonAggregates(season: string): Promise<HistoricalCategorySpend[]> {
  const authStore = useAuthStore()
  if (!authStore.clubId) return []

  // Determine the season date range
  const seasonDates = getSeasonDates(season as Season)

  const q = query(
    collection(db, 'transactions'),
    where('clubId', '==', authStore.clubId),
    where('date', '>=', Timestamp.fromDate(seasonDates.start)),
    where('date', '<=', Timestamp.fromDate(seasonDates.end)),
    where('status', 'in', ['approved', 'pending', 'paid'])
  )

  const snapshot = await getDocs(q)

  // Aggregate by parent category
  const aggregates = new Map<string, HistoricalCategorySpend>()

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data()
    const categoryId = data.categoryId as string
    if (!categoryId) continue

    // Resolve to parent category for budget-level aggregation
    const cat = categoriesStore.getCategoryById(categoryId)
    if (!cat) continue

    const parentId = cat.parentId || cat.id
    const parent = cat.parentId ? categoriesStore.getCategoryById(cat.parentId) : cat
    if (!parent) continue

    const key = parentId
    const existing = aggregates.get(key)
    const amount = data.amount as number || 0

    if (existing) {
      existing.totalAmount += amount
      existing.transactionCount++
    } else {
      aggregates.set(key, {
        categoryId: parentId,
        categoryName: parent.name,
        type: parent.type,
        totalAmount: amount,
        transactionCount: 1
      })
    }
  }

  return Array.from(aggregates.values())
}

async function aiSuggestBudget() {
  aiSuggesting.value = true

  try {
    // 1. Fetch historical data from previous season
    const historicalData = await fetchSeasonAggregates(previousSeasonLabel.value)

    if (historicalData.length === 0) {
      $q.notify({
        type: 'warning',
        icon: 'info',
        message: `No se encontraron transacciones en la temporada ${previousSeasonLabel.value} para basar la sugerencia.`
      })
      return
    }

    // 2. Build category info
    const categories: CategoryInfo[] = categoriesStore.allActiveCategories.map(c => {
      const parent = c.parentId ? categoriesStore.getCategoryById(c.parentId) : null
      return { id: c.id, name: c.name, type: c.type, parentName: parent?.name }
    })

    // 3. Get previous budget if exists
    const prevBudget = budgetStore.getBudgetForSeason(previousSeasonLabel.value as Season)
    const prevAllocations = prevBudget
      ? [
          ...prevBudget.incomeAllocations.map(a => ({ ...a, type: 'income' as const })),
          ...prevBudget.expenseAllocations.map(a => ({ ...a, type: 'expense' as const }))
        ]
      : undefined

    // 4. Call Gemini
    const result = await suggestBudgetAllocations(
      historicalData,
      categories,
      previousSeasonLabel.value,
      selectedSeason.value,
      prevAllocations
    )

    // 5. Validate category IDs exist — filter out any hallucinated ones
    result.suggestions = result.suggestions.filter(s => {
      const cat = categoriesStore.getCategoryById(s.categoryId)
      return cat && !cat.parentId // Only parent categories
    })

    aiResult.value = result
    showAISuggestions.value = true
  } catch (e) {
    logger.error('[AI] Budget suggestion error:', e)
    $q.notify({
      type: 'negative',
      message: 'Error al generar sugerencias. Verifica la API key de Gemini.'
    })
  } finally {
    aiSuggesting.value = false
  }
}

function applyAISuggestions() {
  if (!aiResult.value) return

  // Apply income allocations
  form.value.incomeAllocations = aiIncomeSuggestions.value
    .filter(s => s.suggestedAmount > 0)
    .map(s => ({
      categoryId: s.categoryId,
      amount: Math.round(s.suggestedAmount)
    }))

  // Apply expense allocations
  form.value.expenseAllocations = aiExpenseSuggestions.value
    .filter(s => s.suggestedAmount > 0)
    .map(s => ({
      categoryId: s.categoryId,
      amount: Math.round(s.suggestedAmount)
    }))

  // Apply target surplus
  form.value.targetSurplus = Math.round(aiResult.value.targetSurplus || 0)

  showAISuggestions.value = false

  $q.notify({
    type: 'positive',
    icon: 'auto_awesome',
    message: 'Sugerencias aplicadas. Revisa y ajusta antes de guardar.'
  })
}

// Watch season change
watch(selectedSeason, () => {
  loadFormFromBudget()
})

onMounted(async () => {
  loading.value = true
  await Promise.all([
    budgetStore.fetchBudgets(),
    categoriesStore.fetchCategories()
  ])
  loadFormFromBudget()
  loading.value = false
})
</script>

<style lang="scss" scoped>
.budget-page {
  background: var(--color-bg-primary);
}

.page-content {
  max-width: 720px;
  margin: 0 auto;
}

// Summary
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);

  @media (max-width: 600px) {
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

.income-card .summary-icon {
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
}

.expense-card .summary-icon {
  background: rgba(239, 68, 68, 0.12);
  color: #EF4444;
}

.positive-card .summary-icon {
  background: rgba(99, 91, 255, 0.12);
  color: #635BFF;
}

.negative-card .summary-icon {
  background: rgba(239, 68, 68, 0.12);
  color: #EF4444;
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

// Sections
.section-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.section-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
}

.income-title {
  color: #10B981;
}

.expense-title {
  color: #EF4444;
}

.section-total {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.section-body {
  padding: var(--space-4);
}

.target-input {
  max-width: 250px;
}

// Allocations
.allocation-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border-light);

  &:last-of-type {
    border-bottom: none;
  }
}

.allocation-category {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  min-width: 0;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.allocation-input {
  width: 160px;
  flex-shrink: 0;
}

.add-allocation {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border);
}

.add-select {
  flex: 1;
}

.empty-allocations {
  text-align: center;
  padding: var(--space-4);
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

// Actions
.actions-body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

// === AI Budget Suggestions Dialog ===
.ai-budget-card {
  .ai-budget-header {
    background: var(--color-bg-elevated);
  }

  .ai-general-notes {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    background: rgba(255, 193, 7, 0.06);
    line-height: 1.5;
  }

  .ai-budget-body {
    padding: 0;
  }

  .suggestion-group {
    padding: 0 16px 16px;

    .suggestion-group-title {
      display: flex;
      align-items: center;
      padding: 12px 0;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-text-primary);
      border-bottom: 1px solid var(--color-border-light);
      margin-bottom: 8px;

      &.income-title { color: #10B981; }
      &.expense-title { color: #EF4444; }

      .suggestion-group-total {
        margin-left: auto;
        font-family: 'DM Sans', sans-serif;
        font-size: 1rem;
      }
    }
  }

  .ai-budget-row {
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border-light);

    &:last-child { border-bottom: none; }
  }

  .ai-budget-info {
    margin-bottom: 8px;

    .ai-budget-cat {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--color-text-primary);
    }

    .ai-budget-reasoning {
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
      line-height: 1.4;
      padding-left: 18px;
    }
  }

  .ai-budget-amounts {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-left: 18px;

    .ai-budget-previous,
    .ai-budget-suggested {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .amount-label {
        font-size: 0.625rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-muted);
        font-weight: 600;
      }

      .amount-value {
        font-family: 'DM Sans', sans-serif;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }
    }

    .suggestion-input {
      width: 130px;

      :deep(.q-field__control) {
        height: 32px;
        min-height: 32px;
      }

      :deep(.q-field__native) {
        font-family: 'DM Sans', sans-serif;
        font-weight: 600;
      }
    }

    .change-badge {
      font-size: 0.6875rem;
      padding: 2px 8px;
      border-radius: 10px;
    }
  }

  .ai-surplus-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);

    .surplus-input {
      width: 140px;

      :deep(.q-field__control) {
        height: 32px;
        min-height: 32px;
      }
    }
  }

  .ai-balance-preview {
    font-size: 0.8125rem;
    color: var(--color-text-tertiary);
    padding: 8px 0;
  }

  .ai-budget-footer {
    padding: 12px 16px;
  }
}
</style>
