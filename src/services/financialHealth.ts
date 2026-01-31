/**
 * FINANCIAL HEALTH SERVICE
 * Calcula la salud financiera del club y genera alertas
 */

import type {
  Transaction,
  FinancialHealthData,
  BudgetAlert,
  HealthStatus
} from 'src/types'
import { mockData, ANNUAL_BUDGET } from 'src/mocks/data'

interface MonthlyBudget {
  month: number
  income: Record<string, number>
  expenses: Record<string, number>
}

// Obtener el mes de la temporada (1=sept, 12=agosto)
function getSeasonMonth(date: Date): number {
  const month = date.getMonth() + 1 // 1-12
  if (month >= 9) return month - 8 // Sept=1, Oct=2, etc
  return month + 4 // Jan=5, Feb=6, etc
}

// Calcular ingresos/gastos presupuestados hasta la fecha
function getBudgetedAmountsYTD(
  monthlyDistribution: MonthlyBudget[],
  currentDate: Date
): { income: number; expenses: number } {
  const currentSeasonMonth = getSeasonMonth(currentDate)
  const dayOfMonth = currentDate.getDate()
  const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const monthProgress = dayOfMonth / totalDaysInMonth

  let totalIncome = 0
  let totalExpenses = 0

  monthlyDistribution.forEach(m => {
    const seasonMonth = m.month >= 9 ? m.month - 8 : m.month + 4
    const monthIncome = Object.values(m.income).reduce((a, b) => a + b, 0)
    const monthExpenses = Object.values(m.expenses).reduce((a, b) => a + b, 0)

    if (seasonMonth < currentSeasonMonth) {
      // Meses completos pasados
      totalIncome += monthIncome
      totalExpenses += monthExpenses
    } else if (seasonMonth === currentSeasonMonth) {
      // Mes actual (prorratear)
      totalIncome += monthIncome * monthProgress
      totalExpenses += monthExpenses * monthProgress
    }
  })

  return { income: totalIncome, expenses: totalExpenses }
}

// Calcular salud financiera
export function calculateFinancialHealth(
  transactions: Transaction[],
  targetSurplus: number = ANNUAL_BUDGET.targetSurplus
): FinancialHealthData {
  const now = new Date()
  const seasonStartYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const seasonStart = new Date(seasonStartYear, 8, 1) // 1 de septiembre

  // Filtrar transacciones de la temporada actual
  const seasonTransactions = transactions.filter(t => {
    const txnDate = new Date(t.date)
    return txnDate >= seasonStart && txnDate <= now && t.status !== 'rejected'
  })

  // Calcular totales actuales
  const totalIncomeYTD = seasonTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpensesYTD = seasonTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const currentBalance = totalIncomeYTD - totalExpensesYTD

  // Obtener presupuesto hasta la fecha
  const budgetedYTD = getBudgetedAmountsYTD(
    mockData.monthlyDistribution as MonthlyBudget[],
    now
  )

  const budgetedIncomeYTD = budgetedYTD.income
  const budgetedExpensesYTD = budgetedYTD.expenses
  const budgetedBalanceYTD = budgetedIncomeYTD - budgetedExpensesYTD

  // Calcular desviación
  const balanceVsBudget = currentBalance - budgetedBalanceYTD

  // Calcular progreso hacia el objetivo
  // Si el objetivo es 500€ y llevamos 300€, progreso = 60%
  const progressPercent = targetSurplus !== 0
    ? (currentBalance / targetSurplus) * 100
    : currentBalance >= 0 ? 100 : 0

  // Proyección de fin de temporada
  const currentSeasonMonth = getSeasonMonth(now)
  const totalSeasonMonths = 12
  const monthsRemaining = totalSeasonMonths - currentSeasonMonth

  // Calcular tendencia mensual
  const avgMonthlyBalance = currentSeasonMonth > 0 ? currentBalance / currentSeasonMonth : 0
  const projectedYearEndBalance = currentBalance + (avgMonthlyBalance * monthsRemaining)

  // Gap para alcanzar el objetivo
  const gapToTarget = targetSurplus - projectedYearEndBalance

  // Determinar estado de salud
  let status: HealthStatus
  let statusMessage: string

  const deviationPercent = budgetedBalanceYTD !== 0
    ? (balanceVsBudget / Math.abs(budgetedBalanceYTD)) * 100
    : 0

  if (deviationPercent >= 5) {
    status = 'excellent'
    statusMessage = 'Vamos por encima del presupuesto. ¡Excelente gestión!'
  } else if (deviationPercent >= -5) {
    status = 'good'
    statusMessage = 'Estamos dentro del margen presupuestado.'
  } else if (deviationPercent >= -15) {
    status = 'warning'
    statusMessage = 'Ligera desviación negativa. Conviene revisar gastos o buscar ingresos adicionales.'
  } else {
    status = 'critical'
    statusMessage = 'Desviación significativa. Se requieren acciones correctivas urgentes.'
  }

  // Determinar tendencia
  let monthlyTrend: 'improving' | 'stable' | 'declining' = 'stable'
  if (balanceVsBudget > 500) monthlyTrend = 'improving'
  else if (balanceVsBudget < -500) monthlyTrend = 'declining'

  // Verificar si ingresos/gastos están on track
  const incomeOnTrack = totalIncomeYTD >= budgetedIncomeYTD * 0.95
  const expensesOnTrack = totalExpensesYTD <= budgetedExpensesYTD * 1.05

  return {
    currentBalance,
    totalIncomeYTD,
    totalExpensesYTD,
    targetSurplus,
    budgetedIncomeYTD: Math.round(budgetedIncomeYTD),
    budgetedExpensesYTD: Math.round(budgetedExpensesYTD),
    progressPercent,
    balanceVsBudget: Math.round(balanceVsBudget),
    projectedYearEndBalance: Math.round(projectedYearEndBalance),
    gapToTarget: Math.max(0, Math.round(gapToTarget)),
    status,
    statusMessage,
    monthlyTrend,
    incomeOnTrack,
    expensesOnTrack
  }
}

// Generar alertas de presupuesto
export function generateBudgetAlerts(
  transactions: Transaction[],
  healthData: FinancialHealthData
): BudgetAlert[] {
  const alerts: BudgetAlert[] = []
  const now = new Date()

  // Alerta de desviación general
  if (healthData.status === 'critical') {
    alerts.push({
      id: 'alert_critical',
      type: 'deviation',
      severity: 'critical',
      message: `Balance actual ${healthData.balanceVsBudget}€ por debajo de lo presupuestado`,
      percentDeviation: Math.round((healthData.balanceVsBudget / healthData.budgetedIncomeYTD) * 100),
      createdAt: now
    })
  } else if (healthData.status === 'warning') {
    alerts.push({
      id: 'alert_warning',
      type: 'deviation',
      severity: 'warning',
      message: 'El balance está ligeramente por debajo del presupuesto',
      percentDeviation: Math.round((healthData.balanceVsBudget / healthData.budgetedIncomeYTD) * 100),
      createdAt: now
    })
  }

  // Alerta de ingresos bajos
  if (!healthData.incomeOnTrack) {
    const deficit = healthData.budgetedIncomeYTD - healthData.totalIncomeYTD
    alerts.push({
      id: 'alert_income',
      type: 'underfund',
      severity: 'warning',
      message: `Ingresos ${Math.round(deficit)}€ por debajo de lo esperado`,
      amount: deficit,
      createdAt: now
    })
  }

  // Alerta de gastos altos
  if (!healthData.expensesOnTrack) {
    const excess = healthData.totalExpensesYTD - healthData.budgetedExpensesYTD
    alerts.push({
      id: 'alert_expenses',
      type: 'overspend',
      severity: 'warning',
      message: `Gastos ${Math.round(excess)}€ por encima de lo presupuestado`,
      amount: excess,
      createdAt: now
    })
  }

  // Alerta de proyección negativa
  if (healthData.gapToTarget > 0 && healthData.projectedYearEndBalance < 0) {
    alerts.push({
      id: 'alert_projection',
      type: 'cashflow',
      severity: 'critical',
      message: `Proyección de cierre negativa: ${healthData.projectedYearEndBalance}€`,
      amount: healthData.projectedYearEndBalance,
      createdAt: now
    })
  }

  // Analizar categorías con mayor desviación
  const categoryTotals = analyzeByCategory(transactions)
  categoryTotals.forEach(cat => {
    if (cat.percentOver > 15) {
      alerts.push({
        id: `alert_cat_${cat.categoryId}`,
        type: 'overspend',
        severity: cat.percentOver > 30 ? 'critical' : 'warning',
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        message: `${cat.categoryName}: ${cat.percentOver}% por encima del presupuesto`,
        percentDeviation: cat.percentOver,
        createdAt: now
      })
    }
  })

  return alerts.slice(0, 5) // Máximo 5 alertas
}

// Analizar gastos por categoría vs presupuesto
interface CategoryAnalysis {
  categoryId: string
  categoryName: string
  actual: number
  budgeted: number
  percentOver: number
}

function analyzeByCategory(transactions: Transaction[]): CategoryAnalysis[] {
  const now = new Date()
  const seasonStartYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const seasonStart = new Date(seasonStartYear, 8, 1)

  const expenses = transactions.filter(t =>
    t.type === 'expense' &&
    new Date(t.date) >= seasonStart &&
    new Date(t.date) <= now &&
    t.status !== 'rejected'
  )

  // Agrupar por categoría
  const byCategory: Record<string, { total: number; name: string }> = {}
  expenses.forEach(t => {
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { total: 0, name: t.categoryName || 'Sin categoría' }
    }
    byCategory[t.categoryId].total += t.amount
  })

  // Comparar con presupuesto (simplificado)
  const annualBudgetMap: Record<string, number> = {
    cat_001: ANNUAL_BUDGET.expenses.salarios,
    cat_002: ANNUAL_BUDGET.expenses.seguridadSocial,
    cat_003: ANNUAL_BUDGET.expenses.equipaciones,
    cat_005: ANNUAL_BUDGET.expenses.transporte,
    cat_007: ANNUAL_BUDGET.expenses.arbitrajes,
    cat_008: ANNUAL_BUDGET.expenses.federacion,
    cat_012: ANNUAL_BUDGET.expenses.seguros
  }

  const currentSeasonMonth = getSeasonMonth(now)
  const monthsElapsed = currentSeasonMonth

  const results: CategoryAnalysis[] = []
  Object.entries(byCategory).forEach(([catId, data]) => {
    const annualBudget = annualBudgetMap[catId]
    if (annualBudget) {
      const budgetedSoFar = (annualBudget / 12) * monthsElapsed
      const percentOver = budgetedSoFar > 0
        ? ((data.total - budgetedSoFar) / budgetedSoFar) * 100
        : 0

      if (percentOver > 10) {
        results.push({
          categoryId: catId,
          categoryName: data.name,
          actual: data.total,
          budgeted: budgetedSoFar,
          percentOver: Math.round(percentOver)
        })
      }
    }
  })

  return results.sort((a, b) => b.percentOver - a.percentOver)
}
