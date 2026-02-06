import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from 'src/boot/firebase'
import { useAuthStore } from './auth'
import { useStatisticsStore } from './statistics'
import type { Budget, Season } from 'src/types'
import { computeSeason, getSeasonDates } from 'src/types'
import { logger } from 'src/utils/logger'

export const useBudgetStore = defineStore('budget', () => {
  // State
  const budgets = ref<Budget[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Current season budget
  const currentSeason = computeSeason(new Date())
  const currentBudget = computed(() =>
    budgets.value.find(b => b.season === currentSeason) || null
  )

  // Computed totals for current budget
  const totalIncomeBudget = computed(() =>
    currentBudget.value?.incomeAllocations.reduce((sum, a) => sum + a.amount, 0) || 0
  )

  const totalExpenseBudget = computed(() =>
    currentBudget.value?.expenseAllocations.reduce((sum, a) => sum + a.amount, 0) || 0
  )

  const projectedBalance = computed(() =>
    totalIncomeBudget.value - totalExpenseBudget.value
  )

  const targetSurplus = computed(() =>
    currentBudget.value?.targetSurplus || 0
  )

  /**
   * Get the budgeted amounts Year-To-Date (prorated to current date in the season)
   */
  const budgetedIncomeYTD = computed(() => {
    if (!currentBudget.value) return 0
    return prorateToDate(totalIncomeBudget.value)
  })

  const budgetedExpensesYTD = computed(() => {
    if (!currentBudget.value) return 0
    return prorateToDate(totalExpenseBudget.value)
  })

  /**
   * Get budget allocation for a specific category
   */
  function getAllocationForCategory(categoryId: string): number {
    if (!currentBudget.value) return 0
    const income = currentBudget.value.incomeAllocations.find(a => a.categoryId === categoryId)
    if (income) return income.amount
    const expense = currentBudget.value.expenseAllocations.find(a => a.categoryId === categoryId)
    if (expense) return expense.amount
    return 0
  }

  /**
   * Get budget for a specific season
   */
  function getBudgetForSeason(season: Season): Budget | null {
    return budgets.value.find(b => b.season === season) || null
  }

  // === Prorate helper ===
  function prorateToDate(annualAmount: number): number {
    const now = new Date()
    const seasonDates = getSeasonDates(currentSeason)
    const seasonStart = seasonDates.start
    const seasonEnd = seasonDates.end

    const totalMs = seasonEnd.getTime() - seasonStart.getTime()
    const elapsedMs = Math.max(0, Math.min(now.getTime() - seasonStart.getTime(), totalMs))
    const progress = totalMs > 0 ? elapsedMs / totalMs : 0

    return Math.round(annualAmount * progress)
  }

  // === Actions ===
  async function fetchBudgets() {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return

      const q = query(
        collection(db, 'budgets'),
        where('clubId', '==', authStore.clubId)
      )

      const snapshot = await getDocs(q)
      budgets.value = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() || new Date()
      })) as Budget[]
    } catch (e) {
      logger.error('Error fetching budgets:', e)
      error.value = 'Error al cargar presupuestos'
    } finally {
      loading.value = false
    }
  }

  async function createBudget(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget | null> {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return null
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para crear presupuestos'
        return null
      }

      const docRef = await addDoc(collection(db, 'budgets'), {
        ...data,
        clubId: authStore.clubId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      const newBudget: Budget = {
        ...data,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      budgets.value.push(newBudget)
      return newBudget
    } catch (e) {
      logger.error('Error creating budget:', e)
      error.value = 'Error al crear presupuesto'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateBudget(id: string, data: Partial<Budget>): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para editar presupuestos'
        return false
      }

      await updateDoc(doc(db, 'budgets', id), {
        ...data,
        updatedAt: serverTimestamp()
      })

      const index = budgets.value.findIndex(b => b.id === id)
      if (index !== -1) {
        budgets.value[index] = { ...budgets.value[index], ...data, updatedAt: new Date() }
      }
      return true
    } catch (e) {
      logger.error('Error updating budget:', e)
      error.value = 'Error al actualizar presupuesto'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteBudget(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para eliminar presupuestos'
        return false
      }

      await deleteDoc(doc(db, 'budgets', id))
      budgets.value = budgets.value.filter(b => b.id !== id)
      return true
    } catch (e) {
      logger.error('Error deleting budget:', e)
      error.value = 'Error al eliminar presupuesto'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Generate monthly forecasts from the season budget
   * Distributes the annual budget evenly across 12 months (Jul-Jun),
   * creating one Forecast document per month × category.
   */
  async function distributeToForecasts(season: Season): Promise<number> {
    const budget = getBudgetForSeason(season)
    if (!budget) throw new Error('No hay presupuesto para esta temporada')

    const authStore = useAuthStore()
    if (!authStore.clubId) throw new Error('No hay club activo')

    const statisticsStore = useStatisticsStore()

    // Determine the season months (Jul Year1 → Jun Year2)
    const startYear = parseInt(season.split('/')[0])
    const months = [
      { month: 7, year: startYear },
      { month: 8, year: startYear },
      { month: 9, year: startYear },
      { month: 10, year: startYear },
      { month: 11, year: startYear },
      { month: 12, year: startYear },
      { month: 1, year: startYear + 1 },
      { month: 2, year: startYear + 1 },
      { month: 3, year: startYear + 1 },
      { month: 4, year: startYear + 1 },
      { month: 5, year: startYear + 1 },
      { month: 6, year: startYear + 1 }
    ]

    let count = 0

    // Generate for income allocations
    for (const alloc of budget.incomeAllocations) {
      const monthlyAmount = Math.round((alloc.amount / 12) * 100) / 100
      for (const m of months) {
        await statisticsStore.createForecast({
          clubId: authStore.clubId,
          season,
          year: m.year,
          month: m.month,
          categoryId: alloc.categoryId,
          type: 'income',
          amount: monthlyAmount,
          source: 'manual'
        })
        count++
      }
    }

    // Generate for expense allocations
    for (const alloc of budget.expenseAllocations) {
      const monthlyAmount = Math.round((alloc.amount / 12) * 100) / 100
      for (const m of months) {
        await statisticsStore.createForecast({
          clubId: authStore.clubId,
          season,
          year: m.year,
          month: m.month,
          categoryId: alloc.categoryId,
          type: 'expense',
          amount: monthlyAmount,
          source: 'manual'
        })
        count++
      }
    }

    return count
  }

  return {
    // State
    budgets,
    loading,
    error,

    // Getters
    currentBudget,
    totalIncomeBudget,
    totalExpenseBudget,
    projectedBalance,
    targetSurplus,
    budgetedIncomeYTD,
    budgetedExpensesYTD,

    // Helpers
    getAllocationForCategory,
    getBudgetForSeason,

    // Actions
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    distributeToForecasts
  }
})
