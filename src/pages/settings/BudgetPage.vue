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
                :options="availableIncomeCategories"
                label="Añadir categoría de ingreso"
                outlined
                dense
                emit-value
                map-options
                clearable
                class="add-select"
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
                :options="availableExpenseCategories"
                label="Añadir categoría de gasto"
                outlined
                dense
                emit-value
                map-options
                clearable
                class="add-select"
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
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useBudgetStore } from 'src/stores/budget'
import { useCategoriesStore } from 'src/stores/categories'
import { useAuthStore } from 'src/stores/auth'
import type { BudgetAllocation, Season } from 'src/types'
import { computeSeason } from 'src/types'
import { formatCurrency } from 'src/utils/formatters'
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

const availableExpenseCategories = computed(() => {
  const usedIds = new Set(form.value.expenseAllocations.map(a => a.categoryId))
  return categoriesStore.expenseParentCategories
    .filter(c => !usedIds.has(c.id))
    .map(c => ({ label: c.name, value: c.id }))
})

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
</style>
