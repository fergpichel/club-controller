/**
 * FINANCIAL HEALTH SERVICE
 * Calcula la salud financiera del club usando datos reales del presupuesto
 */

import type {
  Transaction,
  Budget,
  FinancialHealthData,
  BudgetAlert,
  HealthStatus
} from 'src/types'
import { getSeasonDates, computeSeason } from 'src/types'

// Calcular el progreso de la temporada (0 a 1)
function getSeasonProgress(season: string): number {
  const now = new Date()
  const dates = getSeasonDates(season)
  const totalMs = dates.end.getTime() - dates.start.getTime()
  const elapsedMs = Math.max(0, Math.min(now.getTime() - dates.start.getTime(), totalMs))
  return totalMs > 0 ? elapsedMs / totalMs : 0
}

// Obtener el mes de la temporada (1=primer mes, 12=último)
function getSeasonMonth(season: string): number {
  const progress = getSeasonProgress(season)
  return Math.max(1, Math.ceil(progress * 12))
}

/**
 * Calcular salud financiera a partir de transacciones reales y presupuesto.
 * Si no hay presupuesto, devuelve datos parciales basados solo en transacciones.
 */
export function calculateFinancialHealth(
  transactions: Transaction[],
  budget: Budget | null
): FinancialHealthData {
  const now = new Date()
  const season = computeSeason(now)
  const dates = getSeasonDates(season)
  const seasonProgress = getSeasonProgress(season)
  const currentSeasonMonth = getSeasonMonth(season)
  const totalSeasonMonths = 12

  // Filtrar transacciones de la temporada actual
  const seasonTransactions = transactions.filter(t => {
    const txnDate = new Date(t.date)
    return txnDate >= dates.start && txnDate <= now && t.status !== 'rejected'
  })

  // Calcular totales actuales
  const totalIncomeYTD = seasonTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpensesYTD = seasonTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const currentBalance = totalIncomeYTD - totalExpensesYTD

  // Presupuesto — si existe, prorratear al punto actual; si no, usar 0
  const totalBudgetedIncome = budget
    ? budget.incomeAllocations.reduce((sum, a) => sum + a.amount, 0)
    : 0
  const totalBudgetedExpenses = budget
    ? budget.expenseAllocations.reduce((sum, a) => sum + a.amount, 0)
    : 0
  const targetSurplus = budget?.targetSurplus || 0

  const budgetedIncomeYTD = Math.round(totalBudgetedIncome * seasonProgress)
  const budgetedExpensesYTD = Math.round(totalBudgetedExpenses * seasonProgress)
  const budgetedBalanceYTD = budgetedIncomeYTD - budgetedExpensesYTD

  // Desviación
  const balanceVsBudget = currentBalance - budgetedBalanceYTD

  // Progreso hacia el objetivo de superávit
  const progressPercent = targetSurplus !== 0
    ? (currentBalance / targetSurplus) * 100
    : currentBalance >= 0 ? 100 : 0

  // Proyección de fin de temporada
  const monthsRemaining = totalSeasonMonths - currentSeasonMonth
  const avgMonthlyBalance = currentSeasonMonth > 0 ? currentBalance / currentSeasonMonth : 0
  const projectedYearEndBalance = currentBalance + (avgMonthlyBalance * monthsRemaining)

  // Gap para alcanzar el objetivo
  const gapToTarget = targetSurplus - projectedYearEndBalance

  // Determinar estado de salud
  let status: HealthStatus
  let statusMessage: string

  if (!budget) {
    // Sin presupuesto — solo informar del balance
    status = currentBalance >= 0 ? 'good' : 'warning'
    statusMessage = currentBalance >= 0
      ? `Balance positivo de ${Math.round(currentBalance)}€. Configura el presupuesto para un análisis detallado.`
      : `Balance negativo de ${Math.round(currentBalance)}€. Configura el presupuesto para un análisis detallado.`
  } else {
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
  }

  // Tendencia
  let monthlyTrend: 'improving' | 'stable' | 'declining' = 'stable'
  if (balanceVsBudget > 500) monthlyTrend = 'improving'
  else if (balanceVsBudget < -500) monthlyTrend = 'declining'

  // Verificar si ingresos/gastos están on track
  const incomeOnTrack = budgetedIncomeYTD === 0 || totalIncomeYTD >= budgetedIncomeYTD * 0.95
  const expensesOnTrack = budgetedExpensesYTD === 0 || totalExpensesYTD <= budgetedExpensesYTD * 1.05

  return {
    currentBalance,
    totalIncomeYTD,
    totalExpensesYTD,
    targetSurplus,
    budgetedIncomeYTD,
    budgetedExpensesYTD,
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

/**
 * Generar alertas de presupuesto a partir de datos de salud y transacciones.
 * Compara gastos por categoría contra las asignaciones del presupuesto real.
 */
export function generateBudgetAlerts(
  transactions: Transaction[],
  healthData: FinancialHealthData,
  budget: Budget | null
): BudgetAlert[] {
  const alerts: BudgetAlert[] = []
  const now = new Date()

  // Sin presupuesto → alerta única informativa
  if (!budget) {
    alerts.push({
      id: 'alert_no_budget',
      type: 'deviation',
      severity: 'warning',
      message: 'No hay presupuesto configurado para esta temporada. Ve a Ajustes → Presupuesto.',
      createdAt: now
    })
    return alerts
  }

  // Alerta de desviación general
  if (healthData.status === 'critical') {
    alerts.push({
      id: 'alert_critical',
      type: 'deviation',
      severity: 'critical',
      message: `Balance actual ${healthData.balanceVsBudget}€ por debajo de lo presupuestado`,
      percentDeviation: healthData.budgetedIncomeYTD > 0
        ? Math.round((healthData.balanceVsBudget / healthData.budgetedIncomeYTD) * 100)
        : 0,
      createdAt: now
    })
  } else if (healthData.status === 'warning') {
    alerts.push({
      id: 'alert_warning',
      type: 'deviation',
      severity: 'warning',
      message: 'El balance está ligeramente por debajo del presupuesto',
      percentDeviation: healthData.budgetedIncomeYTD > 0
        ? Math.round((healthData.balanceVsBudget / healthData.budgetedIncomeYTD) * 100)
        : 0,
      createdAt: now
    })
  }

  // Alerta de ingresos bajos
  if (!healthData.incomeOnTrack && healthData.budgetedIncomeYTD > 0) {
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
  if (!healthData.expensesOnTrack && healthData.budgetedExpensesYTD > 0) {
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

  // Analizar categorías con mayor desviación (usando presupuesto real)
  const categoryAlerts = analyzeCategoryDeviations(transactions, budget)
  alerts.push(...categoryAlerts)

  return alerts.slice(0, 5) // Máximo 5 alertas
}

/**
 * Analizar desviaciones por categoría respecto al presupuesto real
 */
function analyzeCategoryDeviations(
  transactions: Transaction[],
  budget: Budget
): BudgetAlert[] {
  const now = new Date()
  const season = computeSeason(now)
  const dates = getSeasonDates(season)
  const progress = getSeasonProgress(season)

  const expenses = transactions.filter(t =>
    t.type === 'expense' &&
    new Date(t.date) >= dates.start &&
    new Date(t.date) <= now &&
    t.status !== 'rejected'
  )

  // Agrupar gastos reales por categoría
  const byCategory: Record<string, number> = {}
  expenses.forEach(t => {
    byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + t.amount
  })

  const alerts: BudgetAlert[] = []

  // Comparar contra asignaciones del presupuesto real
  for (const alloc of budget.expenseAllocations) {
    const actual = byCategory[alloc.categoryId] || 0
    const budgetedSoFar = alloc.amount * progress

    if (budgetedSoFar > 0) {
      const percentOver = ((actual - budgetedSoFar) / budgetedSoFar) * 100

      if (percentOver > 15) {
        alerts.push({
          id: `alert_cat_${alloc.categoryId}`,
          type: 'overspend',
          severity: percentOver > 30 ? 'critical' : 'warning',
          categoryId: alloc.categoryId,
          message: `Categoría con ${Math.round(percentOver)}% por encima del presupuesto`,
          percentDeviation: Math.round(percentOver),
          createdAt: now
        })
      }
    }
  }

  return alerts.sort((a, b) => (b.percentDeviation || 0) - (a.percentDeviation || 0))
}
