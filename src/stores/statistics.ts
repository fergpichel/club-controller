import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from 'src/boot/firebase'
import { useAuthStore } from './auth'
import { isMockEnabled } from 'src/mocks'
import { statisticsApi, monthClosingsApi } from 'src/services/api'
import type {
  PeriodStats,
  CategoryStats,
  TrendData,
  MonthClosing,
  Forecast,
  TransactionType
} from 'src/types'
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  eachMonthOfInterval,
  format
} from 'date-fns'
import { es } from 'date-fns/locale'

export const useStatisticsStore = defineStore('statistics', () => {
  // State
  const monthlyStats = ref<PeriodStats | null>(null)
  const yearlyStats = ref<PeriodStats | null>(null)
  const categoryStats = ref<CategoryStats[]>([])
  const incomeCategoryStats = ref<CategoryStats[]>([])
  const expenseCategoryStats = ref<CategoryStats[]>([])
  const trendData = ref<TrendData[]>([])
  const monthClosings = ref<MonthClosing[]>([])
  const forecasts = ref<Forecast[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Helper
  function getEmptyStats(): PeriodStats {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: 0,
      incomeCount: 0,
      expenseCount: 0,
      avgTransactionAmount: 0,
      largestIncome: 0,
      largestExpense: 0
    }
  }

  // Actions
  async function fetchPeriodStats(startDate: Date, endDate: Date): Promise<PeriodStats> {
    const authStore = useAuthStore()
    if (!authStore.clubId && !isMockEnabled()) {
      return getEmptyStats()
    }

    try {
      if (isMockEnabled()) {
        // Mock mode uses monthly stats
        const year = startDate.getFullYear()
        const month = startDate.getMonth() + 1
        return await statisticsApi.getMonthlyStats(year, month)
      }

      const q = query(
        collection(db, 'transactions'),
        where('clubId', '==', authStore.clubId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        where('status', '==', 'approved')
      )

      const snapshot = await getDocs(q)
      const transactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        amount: doc.data().amount || 0,
        type: doc.data().type
      }))

      const income = transactions.filter(t => t.type === 'income')
      const expenses = transactions.filter(t => t.type === 'expense')

      const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transactionCount: transactions.length,
        incomeCount: income.length,
        expenseCount: expenses.length,
        avgTransactionAmount: transactions.length > 0
          ? (totalIncome + totalExpenses) / transactions.length
          : 0,
        largestIncome: Math.max(...income.map(t => t.amount), 0),
        largestExpense: Math.max(...expenses.map(t => t.amount), 0)
      }
    } catch (e) {
      console.error('Error fetching period stats:', e)
      return getEmptyStats()
    }
  }

  async function fetchMonthlyStats(year: number, month: number) {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        monthlyStats.value = await statisticsApi.getMonthlyStats(year, month)
        return monthlyStats.value
      }

      const start = startOfMonth(new Date(year, month - 1))
      const end = endOfMonth(new Date(year, month - 1))
      monthlyStats.value = await fetchPeriodStats(start, end)
      return monthlyStats.value
    } catch (e) {
      console.error('Error fetching monthly stats:', e)
      error.value = 'Error al cargar estadísticas mensuales'
      return getEmptyStats()
    } finally {
      loading.value = false
    }
  }

  async function fetchYearlyStats(year: number) {
    loading.value = true
    error.value = null

    try {
      const start = startOfYear(new Date(year, 0))
      const end = endOfYear(new Date(year, 11))
      yearlyStats.value = await fetchPeriodStats(start, end)
      return yearlyStats.value
    } catch (e) {
      console.error('Error fetching yearly stats:', e)
      error.value = 'Error al cargar estadísticas anuales'
      return getEmptyStats()
    } finally {
      loading.value = false
    }
  }

  async function fetchCategoryStats(startDate: Date, endDate: Date, type: TransactionType) {
    loading.value = true
    error.value = null

    try {
      let result: CategoryStats[] = []
      
      if (isMockEnabled()) {
        result = await statisticsApi.getCategoryStats(startDate, endDate, type)
      } else {
        const authStore = useAuthStore()
        if (!authStore.clubId) return []

        const q = query(
          collection(db, 'transactions'),
          where('clubId', '==', authStore.clubId),
          where('type', '==', type),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          where('status', '==', 'approved')
        )

        const snapshot = await getDocs(q)
        const byCategory: Record<string, { total: number; count: number; name: string }> = {}

        snapshot.forEach(doc => {
          const data = doc.data()
          const catId = data.categoryId || 'uncategorized'
          const catName = data.categoryName || 'Sin categoría'

          if (!byCategory[catId]) {
            byCategory[catId] = { total: 0, count: 0, name: catName }
          }

          byCategory[catId].total += data.amount || 0
          byCategory[catId].count++
        })

        const total = Object.values(byCategory).reduce((sum, cat) => sum + cat.total, 0)

        result = Object.entries(byCategory)
          .map(([categoryId, data]) => ({
            categoryId,
            categoryName: data.name,
            total: data.total,
            count: data.count,
            percentage: total > 0 ? (data.total / total) * 100 : 0
          }))
          .sort((a, b) => b.total - a.total)
      }

      // Store in the appropriate ref based on type
      if (type === 'income') {
        incomeCategoryStats.value = result
      } else {
        expenseCategoryStats.value = result
      }
      categoryStats.value = result
      
      return result
    } catch (e) {
      console.error('Error fetching category stats:', e)
      error.value = 'Error al cargar estadísticas por categoría'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAllCategoryStats(startDate: Date, endDate: Date) {
    await Promise.all([
      fetchCategoryStats(startDate, endDate, 'income'),
      fetchCategoryStats(startDate, endDate, 'expense')
    ])
  }

  async function fetchTrendData(months: number = 12) {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        trendData.value = await statisticsApi.getTrendData(months)
        return trendData.value
      }

      const authStore = useAuthStore()
      if (!authStore.clubId) return []

      const now = new Date()
      const startDate = subMonths(startOfMonth(now), months - 1)
      const endDate = endOfMonth(now)

      const q = query(
        collection(db, 'transactions'),
        where('clubId', '==', authStore.clubId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        where('status', '==', 'approved')
      )

      const snapshot = await getDocs(q)

      const monthsInterval = eachMonthOfInterval({ start: startDate, end: endDate })
      const monthData: Record<string, TrendData> = {}

      monthsInterval.forEach(date => {
        const key = format(date, 'yyyy-MM')
        monthData[key] = {
          label: format(date, 'MMM yy', { locale: es }),
          income: 0,
          expenses: 0,
          balance: 0
        }
      })

      snapshot.forEach(doc => {
        const data = doc.data()
        const date = data.date?.toDate() || new Date()
        const key = format(date, 'yyyy-MM')

        if (monthData[key]) {
          if (data.type === 'income') {
            monthData[key].income += data.amount || 0
          } else {
            monthData[key].expenses += data.amount || 0
          }
        }
      })

      Object.values(monthData).forEach(month => {
        month.balance = month.income - month.expenses
      })

      trendData.value = Object.values(monthData)
      return trendData.value
    } catch (e) {
      console.error('Error fetching trend data:', e)
      error.value = 'Error al cargar tendencias'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchMonthClosings() {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        monthClosings.value = await monthClosingsApi.getAll()
        return monthClosings.value
      }

      const authStore = useAuthStore()
      if (!authStore.clubId) return []

      const q = query(
        collection(db, 'monthClosings'),
        where('clubId', '==', authStore.clubId)
      )

      const snapshot = await getDocs(q)
      monthClosings.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        closedAt: doc.data().closedAt?.toDate(),
        reviewedAt: doc.data().reviewedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as MonthClosing[]

      return monthClosings.value
    } catch (e) {
      console.error('Error fetching month closings:', e)
      error.value = 'Error al cargar cierres de mes'
      return []
    } finally {
      loading.value = false
    }
  }

  async function closeMonth(year: number, month: number, notes?: string) {
    const authStore = useAuthStore()
    if (!authStore.user) return null

    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        const closing = await monthClosingsApi.close(year, month, authStore.user.uid)
        monthClosings.value = [...monthClosings.value, closing]
        return closing
      }

      if (!authStore.clubId) return null

      const stats = await fetchMonthlyStats(year, month)

      const closingData = {
        clubId: authStore.clubId,
        year,
        month,
        status: 'closed' as const,
        totalIncome: stats.totalIncome,
        totalExpenses: stats.totalExpenses,
        balance: stats.balance,
        transactionCount: stats.transactionCount,
        incomeByCategory: {},
        expensesByCategory: {},
        byTeam: {},
        byProject: {},
        closedBy: authStore.user.uid,
        closedAt: new Date(),
        notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'monthClosings'), closingData)

      const newClosing: MonthClosing = {
        id: docRef.id,
        ...closingData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      monthClosings.value = [...monthClosings.value, newClosing]
      return newClosing
    } catch (e) {
      console.error('Error closing month:', e)
      error.value = 'Error al cerrar mes'
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchForecasts(year: number) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId && !isMockEnabled()) return []

      if (isMockEnabled()) {
        // Generate mock forecasts based on historical data
        forecasts.value = []
        return forecasts.value
      }

      const q = query(
        collection(db, 'forecasts'),
        where('clubId', '==', authStore.clubId),
        where('year', '==', year)
      )

      const snapshot = await getDocs(q)
      forecasts.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Forecast[]

      return forecasts.value
    } catch (e) {
      console.error('Error fetching forecasts:', e)
      error.value = 'Error al cargar previsiones'
      return []
    } finally {
      loading.value = false
    }
  }

  async function createForecast(data: Omit<Forecast, 'id' | 'createdAt' | 'updatedAt'>) {
    const authStore = useAuthStore()
    if (!authStore.clubId && !isMockEnabled()) return null

    loading.value = true
    error.value = null

    try {
      const forecastData = {
        ...data,
        clubId: authStore.clubId || 'mock',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      if (isMockEnabled()) {
        const newForecast: Forecast = {
          ...data,
          id: `forecast_${Date.now()}`,
          clubId: 'mock',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        forecasts.value = [...forecasts.value, newForecast]
        return newForecast
      }

      const docRef = await addDoc(collection(db, 'forecasts'), forecastData)

      const newForecast: Forecast = {
        id: docRef.id,
        ...data,
        clubId: authStore.clubId || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      forecasts.value = [...forecasts.value, newForecast]
      return newForecast
    } catch (e) {
      console.error('Error creating forecast:', e)
      error.value = 'Error al crear previsión'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateForecast(id: string, data: Partial<Forecast>) {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        const index = forecasts.value.findIndex(f => f.id === id)
        if (index !== -1) {
          forecasts.value[index] = { ...forecasts.value[index], ...data, updatedAt: new Date() }
        }
        return true
      }

      await updateDoc(doc(db, 'forecasts', id), {
        ...data,
        updatedAt: serverTimestamp()
      })

      const index = forecasts.value.findIndex(f => f.id === id)
      if (index !== -1) {
        forecasts.value[index] = { ...forecasts.value[index], ...data, updatedAt: new Date() }
      }

      return true
    } catch (e) {
      console.error('Error updating forecast:', e)
      error.value = 'Error al actualizar previsión'
      return false
    } finally {
      loading.value = false
    }
  }

  function getMonthClosingStatus(year: number, month: number): MonthClosing | undefined {
    return monthClosings.value.find(c => c.year === year && c.month === month)
  }

  function isMonthClosed(year: number, month: number): boolean {
    const closing = getMonthClosingStatus(year, month)
    return closing?.status === 'closed'
  }

  return {
    // State
    monthlyStats,
    yearlyStats,
    categoryStats,
    incomeCategoryStats,
    expenseCategoryStats,
    trendData,
    monthClosings,
    forecasts,
    loading,
    error,

    // Actions
    fetchPeriodStats,
    fetchMonthlyStats,
    fetchYearlyStats,
    fetchCategoryStats,
    fetchAllCategoryStats,
    fetchTrendData,
    fetchMonthClosings,
    closeMonth,
    fetchForecasts,
    createForecast,
    updateForecast,
    getMonthClosingStatus,
    isMonthClosed
  }
})
