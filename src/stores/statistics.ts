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
import { useCategoriesStore } from './categories'
import type {
  PeriodStats,
  CategoryStats,
  TrendData,
  MonthClosing,
  Forecast,
  TransactionType,
  Season
} from 'src/types'
import { getSeasonDates } from 'src/types'
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
import { logger } from 'src/utils/logger'

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
    if (!authStore.clubId) {
      return getEmptyStats()
    }

    try {
      const q = query(
        collection(db, 'transactions'),
        where('clubId', '==', authStore.clubId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        where('status', 'in', ['approved', 'pending', 'paid'])
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
      logger.error('Error fetching period stats:', e)
      return getEmptyStats()
    }
  }

  async function fetchMonthlyStats(year: number, month: number) {
    loading.value = true
    error.value = null

    try {
      const start = startOfMonth(new Date(year, month - 1))
      const end = endOfMonth(new Date(year, month - 1))
      monthlyStats.value = await fetchPeriodStats(start, end)
      return monthlyStats.value
    } catch (e) {
      logger.error('Error fetching monthly stats:', e)
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
      logger.error('Error fetching yearly stats:', e)
      error.value = 'Error al cargar estadísticas anuales'
      return getEmptyStats()
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch category stats for a date range.
   * Uses the existing (clubId, status, date) composite index and filters by type client-side.
   * Category names are resolved from the categories store first, then from the transaction
   * document as fallback (in case categories were re-seeded with new IDs).
   * Subcategories are rolled up into their parent category for the summary.
   */
  async function fetchCategoryStats(startDate: Date, endDate: Date, type?: TransactionType) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return []

      const categoriesStore = useCategoriesStore()
      // Ensure categories are loaded so we can resolve names
      if (categoriesStore.categories.length === 0) {
        await categoriesStore.fetchCategories()
      }

      // Single query using the existing composite index (clubId + status + date)
      // Include all non-rejected statuses to match what the rest of the app shows
      const q = query(
        collection(db, 'transactions'),
        where('clubId', '==', authStore.clubId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        where('status', 'in', ['approved', 'pending', 'paid'])
      )

      const snapshot = await getDocs(q)

      // Group by type → parent category (roll subcategories up)
      // Track both the resolved name and the fallback name from the transaction
      interface CatBucket { total: number; count: number; fallbackName: string }
      const byTypeCategory: Record<string, Record<string, CatBucket>> = {
        income: {},
        expense: {}
      }

      snapshot.forEach(docSnap => {
        const data = docSnap.data()
        const txType = data.type as string
        if (txType !== 'income' && txType !== 'expense') return

        // If a specific type was requested, skip the other
        if (type && txType !== type) return

        let catId = data.categoryId || 'uncategorized'
        const txCategoryName = data.categoryName || ''

        // Try to resolve from categories store and roll subcategories up
        const category = categoriesStore.getCategoryById(catId)
        if (category?.parentId) {
          catId = category.parentId
        }

        if (!byTypeCategory[txType][catId]) {
          byTypeCategory[txType][catId] = { total: 0, count: 0, fallbackName: txCategoryName }
        }

        byTypeCategory[txType][catId].total += data.amount || 0
        byTypeCategory[txType][catId].count++
      })

      // Build sorted results — resolve names from the categories store,
      // fall back to the name stored on the transaction document
      function buildResult(bucket: Record<string, CatBucket>): CategoryStats[] {
        const total = Object.values(bucket).reduce((sum, cat) => sum + cat.total, 0)
        return Object.entries(bucket)
          .map(([categoryId, data]) => {
            const cat = categoriesStore.getCategoryById(categoryId)
            return {
              categoryId,
              categoryName: cat?.name || data.fallbackName || 'Sin categorizar',
              total: data.total,
              count: data.count,
              percentage: total > 0 ? (data.total / total) * 100 : 0
            }
          })
          .sort((a, b) => b.total - a.total)
      }

      if (!type || type === 'income') {
        incomeCategoryStats.value = buildResult(byTypeCategory.income)
      }
      if (!type || type === 'expense') {
        expenseCategoryStats.value = buildResult(byTypeCategory.expense)
      }

      // categoryStats = whatever was last requested (backward compat)
      if (type === 'income') {
        categoryStats.value = incomeCategoryStats.value
      } else if (type === 'expense') {
        categoryStats.value = expenseCategoryStats.value
      } else {
        categoryStats.value = [...incomeCategoryStats.value, ...expenseCategoryStats.value]
      }

      return categoryStats.value
    } catch (e) {
      logger.error('Error fetching category stats:', e)
      error.value = 'Error al cargar estadísticas por categoría'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAllCategoryStats(startDate: Date, endDate: Date) {
    // Single query fetches both income and expense categories at once
    await fetchCategoryStats(startDate, endDate)
  }

  async function fetchTrendData(months: number = 12) {
    loading.value = true
    error.value = null

    try {
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
        where('status', 'in', ['approved', 'pending', 'paid'])
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
      logger.error('Error fetching trend data:', e)
      error.value = 'Error al cargar tendencias'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch trend data for a specific season (July to June)
   * @param season - Season string like "2024/25"
   */
  async function fetchSeasonTrendData(season: string) {
    loading.value = true
    error.value = null

    try {
      // Parse season to get start and end years
      const [startYearStr] = season.split('/')
      const startYear = parseInt(startYearStr)
      
      // Season runs from July 1 of startYear to June 30 of startYear+1
      const seasonStart = new Date(startYear, 6, 1) // July 1
      const seasonEnd = new Date(startYear + 1, 5, 30, 23, 59, 59) // June 30

      const authStore = useAuthStore()
      if (!authStore.clubId) {
        trendData.value = []
        return []
      }

      // Generate month labels in season order (Jul, Aug, ..., Jun)
      const seasonMonths: Date[] = []
      for (let m = 6; m < 12; m++) { // Jul-Dec of startYear
        seasonMonths.push(new Date(startYear, m, 1))
      }
      for (let m = 0; m < 6; m++) { // Jan-Jun of startYear+1
        seasonMonths.push(new Date(startYear + 1, m, 1))
      }

      const monthData: Record<string, TrendData> = {}
      seasonMonths.forEach(date => {
        const key = format(date, 'yyyy-MM')
        monthData[key] = {
          label: format(date, 'MMM', { locale: es }),
          income: 0,
          expenses: 0,
          balance: 0
        }
      })

      const q = query(
        collection(db, 'transactions'),
        where('clubId', '==', authStore.clubId),
        where('date', '>=', Timestamp.fromDate(seasonStart)),
        where('date', '<=', Timestamp.fromDate(seasonEnd)),
        where('status', 'in', ['approved', 'pending', 'paid'])
      )

      const snapshot = await getDocs(q)

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

      // Calculate running balance
      let runningBalance = 0
      Object.values(monthData).forEach(month => {
        runningBalance += month.income - month.expenses
        month.balance = runningBalance
      })

      trendData.value = Object.values(monthData)
      return trendData.value
    } catch (e) {
      logger.error('Error fetching season trend data:', e)
      error.value = 'Error al cargar datos de temporada'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch stats for a specific season
   */
  async function fetchSeasonStats(season: string): Promise<PeriodStats> {
    const [startYearStr] = season.split('/')
    const startYear = parseInt(startYearStr)
    const seasonStart = new Date(startYear, 6, 1) // July 1
    const seasonEnd = new Date(startYear + 1, 5, 30, 23, 59, 59) // June 30
    
    const stats = await fetchPeriodStats(seasonStart, seasonEnd)
    // Also update yearlyStats so the UI can use it
    yearlyStats.value = stats
    return stats
  }

  /**
   * Fetch category stats for a specific season
   */
  async function fetchSeasonCategoryStats(season: string, type?: TransactionType) {
    const [startYearStr] = season.split('/')
    const startYear = parseInt(startYearStr)
    const seasonStart = new Date(startYear, 6, 1)
    const seasonEnd = new Date(startYear + 1, 5, 30, 23, 59, 59)
    
    if (type) {
      return fetchCategoryStats(seasonStart, seasonEnd, type)
    }
    return fetchAllCategoryStats(seasonStart, seasonEnd)
  }

  async function fetchMonthClosings() {
    loading.value = true
    error.value = null

    try {
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
      logger.error('Error fetching month closings:', e)
      error.value = 'Error al cargar cierres de mes'
      return []
    } finally {
      loading.value = false
    }
  }

  async function closeMonth(year: number, month: number, notes?: string) {
    const authStore = useAuthStore()
    if (!authStore.user) return null
    if (!authStore.canDoClosings) {
      error.value = 'Sin permisos para cerrar meses'
      return null
    }

    loading.value = true
    error.value = null

    try {
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
      logger.error('Error closing month:', e)
      error.value = 'Error al cerrar mes'
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchForecasts(season: Season) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return []

      const q = query(
        collection(db, 'forecasts'),
        where('clubId', '==', authStore.clubId),
        where('season', '==', season)
      )

      const snapshot = await getDocs(q)
      forecasts.value = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        updatedAt: d.data().updatedAt?.toDate() || new Date()
      })).filter(f => !(f as Record<string, unknown>)._deleted) as Forecast[]

      return forecasts.value
    } catch (e) {
      logger.error('Error fetching forecasts:', e)
      error.value = 'Error al cargar previsiones'
      return []
    } finally {
      loading.value = false
    }
  }

  async function createForecast(data: Omit<Forecast, 'id' | 'createdAt' | 'updatedAt'>) {
    const authStore = useAuthStore()
    if (!authStore.clubId) return null

    loading.value = true
    error.value = null

    try {
      const forecastData = {
        ...data,
        clubId: authStore.clubId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
      logger.error('Error creating forecast:', e)
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
      logger.error('Error updating forecast:', e)
      error.value = 'Error al actualizar previsión'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Generate forecasts for a season based on historical transaction data.
   * Averages monthly amounts per category from previous seasons.
   */
  async function generateHistoricalForecasts(season: Season): Promise<Forecast[]> {
    const authStore = useAuthStore()
    if (!authStore.clubId) return []

    loading.value = true
    error.value = null

    try {
      // Get past seasons data (up to 3 previous seasons)
      const targetDates = getSeasonDates(season)
      const pastSeasons: Season[] = []
      const startYear = parseInt(season.split('/')[0])
      for (let i = 1; i <= 3; i++) {
        const y = startYear - i
        if (y >= 2020) {
          pastSeasons.push(`${y}/${String(y + 1).slice(-2)}`)
        }
      }

      if (pastSeasons.length === 0) {
        error.value = 'No hay temporadas anteriores para generar previsiones'
        return []
      }

      // Fetch all transactions from past seasons
      const allTransactions: { type: string; amount: number; categoryId: string; date: Date; season: string }[] = []

      for (const pastSeason of pastSeasons) {
        const dates = getSeasonDates(pastSeason)
        const q = query(
          collection(db, 'transactions'),
          where('clubId', '==', authStore.clubId),
          where('date', '>=', Timestamp.fromDate(dates.start)),
          where('date', '<=', Timestamp.fromDate(dates.end)),
          where('status', 'in', ['approved', 'pending', 'paid'])
        )
        const snapshot = await getDocs(q)
        snapshot.docs.forEach(d => {
          const data = d.data()
          allTransactions.push({
            type: data.type,
            amount: data.amount || 0,
            categoryId: data.categoryId || '',
            date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
            season: pastSeason
          })
        })
      }

      if (allTransactions.length === 0) {
        error.value = 'No hay datos históricos para generar previsiones'
        return []
      }

      // Group by categoryId + month (1-12) + type
      // Then average across seasons
      const groupKey = (categoryId: string, month: number, type: string) => `${categoryId}|${month}|${type}`
      const groupTotals: Record<string, { total: number; seasons: Set<string> }> = {}

      allTransactions.forEach(t => {
        const month = t.date.getMonth() + 1 // 1-12
        const key = groupKey(t.categoryId, month, t.type)
        if (!groupTotals[key]) {
          groupTotals[key] = { total: 0, seasons: new Set() }
        }
        groupTotals[key].total += t.amount
        groupTotals[key].seasons.add(t.season)
      })

      // Build forecasts: average per season for each category/month
      const newForecasts: Forecast[] = []
      const useCategoriesStore = (await import('./categories')).useCategoriesStore
      const categoriesStore = useCategoriesStore()

      // Season months: July(7) through June(6)
      const seasonMonths = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]

      for (const [key, data] of Object.entries(groupTotals)) {
        const [categoryId, monthStr, type] = key.split('|')
        const month = parseInt(monthStr)

        // Only include months that belong to the season
        if (!seasonMonths.includes(month)) continue

        const numSeasons = data.seasons.size
        const avgAmount = Math.round((data.total / numSeasons) * 100) / 100

        // Determine the year for this month in the target season
        const year = month >= 7 ? targetDates.start.getFullYear() : targetDates.end.getFullYear()

        const category = categoriesStore.getCategoryById(categoryId)

        const forecast: Omit<Forecast, 'id' | 'createdAt' | 'updatedAt'> = {
          clubId: authStore.clubId || '',
          season,
          year,
          month,
          categoryId,
          categoryName: category?.name || 'Sin categoría',
          type: type as TransactionType,
          amount: avgAmount,
          source: 'historical',
          notes: `Media de ${numSeasons} temporada(s): ${Array.from(data.seasons).join(', ')}`
        }

        newForecasts.push(forecast as Forecast)
      }

      // Delete existing historical forecasts for this season
      const existingQ = query(
        collection(db, 'forecasts'),
        where('clubId', '==', authStore.clubId),
        where('season', '==', season),
        where('source', '==', 'historical')
      )
      const existingSnapshot = await getDocs(existingQ)
      const deletePromises = existingSnapshot.docs.map(d =>
        updateDoc(doc(db, 'forecasts', d.id), { _deleted: true })
      )
      await Promise.all(deletePromises)

      // Create new forecasts
      const createdForecasts: Forecast[] = []
      for (const f of newForecasts) {
        const docRef = await addDoc(collection(db, 'forecasts'), {
          ...f,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        createdForecasts.push({
          ...f,
          id: docRef.id,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      forecasts.value = createdForecasts
      return createdForecasts
    } catch (e) {
      logger.error('Error generating forecasts:', e)
      error.value = 'Error al generar previsiones'
      return []
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
    fetchSeasonTrendData,
    fetchSeasonStats,
    fetchSeasonCategoryStats,
    fetchMonthClosings,
    closeMonth,
    fetchForecasts,
    createForecast,
    updateForecast,
    generateHistoricalForecasts,
    getMonthClosingStatus,
    isMonthClosed
  }
})
