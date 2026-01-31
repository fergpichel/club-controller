/**
 * PROFITABILITY ANALYSIS SERVICE
 * 
 * Analyzes team and club profitability, generates smart alerts,
 * and calculates sustainable fee recommendations.
 */

import type {
  Transaction,
  Team,
  Category,
  TeamFinancials,
  TeamProfitabilityAlert,
  ClubProfitabilitySummary,
  AlertThresholds
} from 'src/types'

// Default thresholds for alerts
const DEFAULT_THRESHOLDS: AlertThresholds = {
  minFeeCoveragePercent: 60,
  criticalFeeCoveragePercent: 40,
  expenseSpikePercent: 50,
  highExpensePerPlayer: 100,
  maxDeficitMonths: 3,
  categoryThresholds: {
    // These can be customized per club
    'sanitario': 500,
    'material': 800,
    'esparadrapo': 200
  }
}

// Category mappings for analysis
const INCOME_CATEGORY_MAPPING: Record<string, keyof TeamFinancials> = {
  'cuotas': 'incomeFromFees',
  'inscripciones': 'incomeFromFees',
  'patrocinio': 'incomeFromSponsors',
  'subvención': 'incomeFromGrants',
  'subvenciones': 'incomeFromGrants',
  'eventos': 'incomeFromEvents',
  'evento': 'incomeFromEvents',
  'campus': 'incomeFromEvents',
  'escuela': 'incomeFromEvents'
}

const EXPENSE_CATEGORY_MAPPING: Record<string, keyof TeamFinancials> = {
  'salario': 'expensesCoaches',
  'entrenador': 'expensesCoaches',
  'técnico': 'expensesCoaches',
  'nómina': 'expensesCoaches',
  'equipación': 'expensesEquipment',
  'equipaciones': 'expensesEquipment',
  'ropa': 'expensesEquipment',
  'material': 'expensesMaterial',
  'balón': 'expensesMaterial',
  'deportivo': 'expensesMaterial',
  'transporte': 'expensesTransport',
  'viaje': 'expensesTransport',
  'desplazamiento': 'expensesTransport',
  'autobús': 'expensesTransport',
  'licencia': 'expensesFees',
  'federación': 'expensesFees',
  'seguro': 'expensesFees',
  'mutualidad': 'expensesFees'
}

/**
 * Get the amount allocated to a specific team from a transaction
 */
function getTeamAllocation(transaction: Transaction, teamId: string): number {
  // If transaction has allocations array, use it
  if (transaction.allocations && transaction.allocations.length > 0) {
    const allocation = transaction.allocations.find(a => a.teamId === teamId)
    if (allocation) {
      return (transaction.amount * allocation.percentage) / 100
    }
    return 0
  }
  
  // Fallback to simple teamId assignment (100%)
  if (transaction.teamId === teamId) {
    return transaction.amount
  }
  
  return 0
}

/**
 * Map category name to a specific income/expense bucket
 */
function mapCategoryToField(
  categoryName: string,
  type: 'income' | 'expense'
): string {
  const normalizedName = categoryName.toLowerCase()
  const mapping = type === 'income' ? INCOME_CATEGORY_MAPPING : EXPENSE_CATEGORY_MAPPING
  
  for (const [keyword, field] of Object.entries(mapping)) {
    if (normalizedName.includes(keyword)) {
      return field
    }
  }
  
  return type === 'income' ? 'incomeOther' : 'expensesOther'
}

/**
 * Calculate financials for a single team
 */
export function calculateTeamFinancials(
  team: Team,
  transactions: Transaction[],
  categories: Category[],
  monthlyFee: number = 0,
  seasonMonths: number = 10 // Typical season length
): TeamFinancials {
  const financials: TeamFinancials = {
    teamId: team.id,
    teamName: team.name,
    teamColor: team.color,
    ageGroup: team.ageGroup,
    playersCount: team.playersCount || 15, // Default estimate
    
    totalIncome: 0,
    incomeFromFees: 0,
    incomeFromSponsors: 0,
    incomeFromGrants: 0,
    incomeFromEvents: 0,
    incomeOther: 0,
    
    totalExpenses: 0,
    expensesCoaches: 0,
    expensesEquipment: 0,
    expensesMaterial: 0,
    expensesTransport: 0,
    expensesFees: 0,
    expensesOther: 0,
    
    balance: 0,
    balancePerPlayer: 0,
    
    currentMonthlyFee: monthlyFee,
    minSustainableFee: 0,
    feeGap: 0,
    feeCoveragePercent: 0,
    
    isProfitable: false,
    status: 'balanced',
    statusMessage: ''
  }
  
  // Process transactions
  transactions.forEach(txn => {
    const amount = getTeamAllocation(txn, team.id)
    if (amount === 0) return
    
    const category = categories.find(c => c.id === txn.categoryId)
    const categoryName = category?.name || txn.categoryName || ''
    const field = mapCategoryToField(categoryName, txn.type)
    
    if (txn.type === 'income') {
      financials.totalIncome += amount
      ;(financials as Record<string, number>)[field] = 
        ((financials as Record<string, number>)[field] || 0) + amount
    } else {
      financials.totalExpenses += amount
      ;(financials as Record<string, number>)[field] = 
        ((financials as Record<string, number>)[field] || 0) + amount
    }
  })
  
  // Calculate derived values
  financials.balance = financials.totalIncome - financials.totalExpenses
  financials.balancePerPlayer = financials.playersCount > 0 
    ? financials.balance / financials.playersCount 
    : 0
  
  // Calculate sustainable fee
  // Formula: (Expenses - Non-fee Income) / Players / Months
  const nonFeeIncome = financials.incomeFromSponsors + 
    financials.incomeFromGrants + 
    financials.incomeFromEvents + 
    financials.incomeOther
  
  const expensesToCover = financials.totalExpenses - nonFeeIncome
  
  financials.minSustainableFee = financials.playersCount > 0 && seasonMonths > 0
    ? Math.max(0, expensesToCover / financials.playersCount / seasonMonths)
    : 0
  
  financials.feeGap = financials.currentMonthlyFee - financials.minSustainableFee
  
  // Fee coverage: what % of expenses are covered by fees alone
  const totalFeeIncome = financials.incomeFromFees
  financials.feeCoveragePercent = financials.totalExpenses > 0
    ? (totalFeeIncome / financials.totalExpenses) * 100
    : 100
  
  // Determine status
  financials.isProfitable = financials.balance >= 0
  
  if (financials.balance > financials.totalExpenses * 0.1) {
    financials.status = 'surplus'
    financials.statusMessage = 'Equipo con superávit saludable'
  } else if (financials.balance >= 0) {
    financials.status = 'balanced'
    financials.statusMessage = 'Equipo equilibrado'
  } else if (financials.balance > -financials.totalExpenses * 0.2) {
    financials.status = 'deficit'
    financials.statusMessage = 'Equipo con déficit moderado'
  } else {
    financials.status = 'critical'
    financials.statusMessage = 'Equipo con déficit crítico - requiere atención'
  }
  
  return financials
}

/**
 * Generate smart alerts for a team
 */
export function generateTeamAlerts(
  financials: TeamFinancials,
  transactions: Transaction[],
  categories: Category[],
  historicalAvgByCategory: Record<string, number> = {},
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): TeamProfitabilityAlert[] {
  const alerts: TeamProfitabilityAlert[] = []
  const now = new Date()
  
  // Alert 1: Fee too low
  if (financials.feeCoveragePercent < thresholds.criticalFeeCoveragePercent) {
    alerts.push({
      id: `${financials.teamId}_fee_critical_${Date.now()}`,
      teamId: financials.teamId,
      teamName: financials.teamName,
      type: 'fee_too_low',
      severity: 'critical',
      title: 'Cuota muy insuficiente',
      message: `Las cuotas solo cubren el ${financials.feeCoveragePercent.toFixed(0)}% de los gastos`,
      recommendation: `Subir cuota de ${financials.currentMonthlyFee.toFixed(0)}€ a ${financials.minSustainableFee.toFixed(0)}€/mes o buscar patrocinadores`,
      currentValue: financials.currentMonthlyFee,
      expectedValue: financials.minSustainableFee,
      threshold: thresholds.criticalFeeCoveragePercent,
      createdAt: now
    })
  } else if (financials.feeCoveragePercent < thresholds.minFeeCoveragePercent) {
    alerts.push({
      id: `${financials.teamId}_fee_warning_${Date.now()}`,
      teamId: financials.teamId,
      teamName: financials.teamName,
      type: 'fee_too_low',
      severity: 'warning',
      title: 'Cuota insuficiente',
      message: `Las cuotas solo cubren el ${financials.feeCoveragePercent.toFixed(0)}% de los gastos`,
      recommendation: `Considerar subir cuota a ${financials.minSustainableFee.toFixed(0)}€/mes`,
      currentValue: financials.currentMonthlyFee,
      expectedValue: financials.minSustainableFee,
      threshold: thresholds.minFeeCoveragePercent,
      createdAt: now
    })
  }
  
  // Alert 2: No sponsors for team with high expenses
  if (financials.incomeFromSponsors === 0 && financials.totalExpenses > 5000) {
    alerts.push({
      id: `${financials.teamId}_no_sponsors_${Date.now()}`,
      teamId: financials.teamId,
      teamName: financials.teamName,
      type: 'no_sponsors',
      severity: 'info',
      title: 'Sin patrocinadores',
      message: `Este equipo no tiene patrocinadores asignados y tiene ${financials.totalExpenses.toFixed(0)}€ en gastos`,
      recommendation: 'Buscar patrocinador para este equipo podría reducir la cuota necesaria',
      currentValue: 0,
      createdAt: now
    })
  }
  
  // Alert 3: High coach costs
  const coachCostRatio = financials.totalIncome > 0 
    ? (financials.expensesCoaches / financials.totalIncome) * 100 
    : 0
  
  if (coachCostRatio > 50) {
    alerts.push({
      id: `${financials.teamId}_coach_cost_${Date.now()}`,
      teamId: financials.teamId,
      teamName: financials.teamName,
      type: 'coach_cost_high',
      severity: coachCostRatio > 70 ? 'warning' : 'info',
      title: 'Coste de entrenadores alto',
      message: `Los salarios de entrenadores suponen el ${coachCostRatio.toFixed(0)}% de los ingresos del equipo`,
      recommendation: 'Considerar repartir costes de entrenadores entre más equipos o revisar asignaciones',
      currentValue: financials.expensesCoaches,
      expectedValue: financials.totalIncome * 0.4, // 40% would be healthy
      createdAt: now
    })
  }
  
  // Alert 4: Low players count
  const expensePerPlayer = financials.playersCount > 0 
    ? financials.totalExpenses / financials.playersCount 
    : 0
  
  if (expensePerPlayer > thresholds.highExpensePerPlayer * 10) { // Per season
    alerts.push({
      id: `${financials.teamId}_low_players_${Date.now()}`,
      teamId: financials.teamId,
      teamName: financials.teamName,
      type: 'low_players',
      severity: 'warning',
      title: 'Gasto por jugador muy alto',
      message: `Este equipo tiene un gasto de ${expensePerPlayer.toFixed(0)}€ por jugador en la temporada`,
      recommendation: `Con más jugadores se reduciría la cuota necesaria. Actualmente: ${financials.playersCount} jugadores`,
      currentValue: expensePerPlayer,
      threshold: thresholds.highExpensePerPlayer * 10,
      createdAt: now
    })
  }
  
  // Alert 5: Category expense spikes
  const teamTransactions = transactions.filter(t => 
    t.teamId === financials.teamId || 
    t.allocations?.some(a => a.teamId === financials.teamId)
  )
  
  const expensesByCategory: Record<string, number> = {}
  teamTransactions.forEach(t => {
    if (t.type === 'expense') {
      const catId = t.categoryId
      const amount = getTeamAllocation(t, financials.teamId)
      expensesByCategory[catId] = (expensesByCategory[catId] || 0) + amount
    }
  })
  
  // Check against thresholds and historical
  for (const [catId, amount] of Object.entries(expensesByCategory)) {
    const category = categories.find(c => c.id === catId)
    const catName = category?.name || 'Desconocida'
    const catNameLower = catName.toLowerCase()
    
    // Check absolute thresholds
    for (const [keyword, threshold] of Object.entries(thresholds.categoryThresholds)) {
      if (catNameLower.includes(keyword) && amount > threshold) {
        alerts.push({
          id: `${financials.teamId}_expense_spike_${catId}_${Date.now()}`,
          teamId: financials.teamId,
          teamName: financials.teamName,
          type: 'expense_spike',
          severity: amount > threshold * 2 ? 'critical' : 'warning',
          title: `Gasto alto en ${catName}`,
          message: `${amount.toFixed(0)}€ en ${catName} supera el umbral de ${threshold}€`,
          recommendation: `Revisar los gastos en ${catName} y buscar alternativas más económicas`,
          currentValue: amount,
          threshold: threshold,
          categoryId: catId,
          categoryName: catName,
          createdAt: now
        })
      }
    }
    
    // Check against historical average (if available)
    const historicalAvg = historicalAvgByCategory[catId]
    if (historicalAvg && amount > historicalAvg * (1 + thresholds.expenseSpikePercent / 100)) {
      const percentIncrease = ((amount - historicalAvg) / historicalAvg) * 100
      
      if (!alerts.find(a => a.categoryId === catId)) { // Don't duplicate
        alerts.push({
          id: `${financials.teamId}_expense_historical_${catId}_${Date.now()}`,
          teamId: financials.teamId,
          teamName: financials.teamName,
          type: 'high_expense_category',
          severity: percentIncrease > 100 ? 'warning' : 'info',
          title: `Incremento en ${catName}`,
          message: `${amount.toFixed(0)}€ es un ${percentIncrease.toFixed(0)}% más que la media histórica`,
          recommendation: `Verificar si este incremento en ${catName} es justificado`,
          currentValue: amount,
          expectedValue: historicalAvg,
          categoryId: catId,
          categoryName: catName,
          createdAt: now
        })
      }
    }
  }
  
  // Alert 6: Deficit projection
  if (financials.status === 'deficit' || financials.status === 'critical') {
    alerts.push({
      id: `${financials.teamId}_deficit_${Date.now()}`,
      teamId: financials.teamId,
      teamName: financials.teamName,
      type: 'deficit_projected',
      severity: financials.status === 'critical' ? 'critical' : 'warning',
      title: financials.status === 'critical' ? 'Déficit crítico' : 'Déficit proyectado',
      message: `El equipo tiene un déficit de ${Math.abs(financials.balance).toFixed(0)}€`,
      recommendation: financials.feeGap < 0 
        ? `Aumentar cuota en ${Math.abs(financials.feeGap).toFixed(0)}€/mes por jugador`
        : 'Reducir gastos o buscar fuentes de ingresos adicionales',
      currentValue: financials.balance,
      expectedValue: 0,
      createdAt: now
    })
  }
  
  return alerts
}

/**
 * Calculate club-wide profitability summary
 */
export function calculateClubProfitability(
  teams: Team[],
  transactions: Transaction[],
  categories: Category[],
  teamFees: Record<string, number> = {}
): ClubProfitabilitySummary {
  const teamFinancials: TeamFinancials[] = []
  const allAlerts: TeamProfitabilityAlert[] = []
  
  // Calculate financials for each team
  teams.forEach(team => {
    const financials = calculateTeamFinancials(
      team,
      transactions,
      categories,
      teamFees[team.id] || 0
    )
    teamFinancials.push(financials)
    
    const alerts = generateTeamAlerts(financials, transactions, categories)
    allAlerts.push(...alerts)
  })
  
  // Calculate unallocated transactions
  let unallocatedIncome = 0
  let unallocatedExpenses = 0
  
  transactions.forEach(txn => {
    const hasTeamAllocation = txn.teamId || 
      (txn.allocations && txn.allocations.some(a => a.teamId))
    
    if (!hasTeamAllocation) {
      if (txn.type === 'income') {
        unallocatedIncome += txn.amount
      } else {
        unallocatedExpenses += txn.amount
      }
    }
  })
  
  // Aggregate stats
  const profitableTeams = teamFinancials.filter(t => t.isProfitable).length
  const deficitTeams = teamFinancials.filter(t => t.status === 'deficit').length
  const criticalTeams = teamFinancials.filter(t => t.status === 'critical').length
  
  const totalClubIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalClubExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const avgFeeGap = teamFinancials.length > 0
    ? teamFinancials.reduce((sum, t) => sum + t.feeGap, 0) / teamFinancials.length
    : 0
  
  const teamsNeedingAttention = teamFinancials
    .filter(t => t.status === 'deficit' || t.status === 'critical')
    .map(t => t.teamId)
  
  // Sort alerts by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  const sortedAlerts = allAlerts
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 10) // Top 10
  
  return {
    totalTeams: teams.length,
    profitableTeams,
    deficitTeams,
    criticalTeams,
    totalClubIncome,
    totalClubExpenses,
    clubBalance: totalClubIncome - totalClubExpenses,
    unallocatedExpenses,
    unallocatedIncome,
    avgFeeGap,
    teamsNeedingAttention,
    topAlerts: sortedAlerts
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: TeamFinancials['status']): string {
  const colors = {
    surplus: '#00D4AA',
    balanced: '#635BFF',
    deficit: '#FFB545',
    critical: '#FF5470'
  }
  return colors[status]
}

/**
 * Get severity color for alerts
 */
export function getSeverityColor(severity: TeamProfitabilityAlert['severity']): string {
  const colors = {
    info: '#00B4D8',
    warning: '#FFB545',
    critical: '#FF5470'
  }
  return colors[severity]
}
