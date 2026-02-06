// === USER & AUTH TYPES ===
/**
 * Roles del sistema:
 * - admin:      Administrador — acceso total, settings, cierres, datos sensibles
 * - manager:    Directivo — acceso total excepto cierres, gestiona settings y categorías sensibles
 * - controller: Interventor — acceso total excepto settings, puede hacer cierres
 * - editor:     Coordinador — CRUD transacciones, ve todo pero datos sensibles anonimizados
 * - employee:   Colaborador — solo crea transacciones y ve las suyas propias
 * - viewer:     Observador — solo lectura, datos sensibles anonimizados
 */
export type UserRole = 'admin' | 'manager' | 'controller' | 'editor' | 'employee' | 'viewer'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Directivo',
  controller: 'Interventor',
  editor: 'Coordinador',
  employee: 'Colaborador',
  viewer: 'Observador'
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: UserRole
  clubId: string
  invitedBy?: string   // uid of the user who invited this user
  createdAt: Date
  updatedAt: Date
}

/** Invitation to join a club */
export interface ClubInvitation {
  id: string
  clubId: string
  clubName: string
  email: string        // Invited email
  role: UserRole       // Role to assign
  invitedBy: string    // uid
  invitedByName: string
  status: 'pending' | 'accepted' | 'expired'
  createdAt: Date
  expiresAt: Date
}

export interface Club {
  id: string
  name: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  taxId?: string
  sport: string
  createdAt: Date
  settings: ClubSettings
}

export interface ClubSettings {
  currency: string
  fiscalYearStart: number // month 1-12
  categories: Category[]
  defaultTeams: string[]
}

// === CATEGORIES ===
export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
  color: string
  parentId?: string
  isSensitive?: boolean  // Solo visible para admin/manager/controller
  isActive: boolean
}

// === SETTINGS CATALOGS (transversal, sin temporada) ===

/** Categoría de edad gestionada en Settings */
export interface AgeCategory {
  id: string
  clubId: string
  name: string        // "Juvenil", "Cadete", "Infantil", "Senior", etc.
  order: number       // Para ordenar en selectores
  isActive: boolean
  createdAt: Date
}

/** Género gestionado en Settings */
export interface GenderOption {
  id: string
  clubId: string
  name: string        // "Masculino", "Femenino", "Mixto"
  order: number
  isActive: boolean
  createdAt: Date
}

// === TEAMS ===
export type TeamGender = 'male' | 'female' | 'mixed'
export type AgeGroup = 'biberon' | 'prebenjamin' | 'benjamin' | 'alevin' | 'infantil' | 'cadete' | 'juvenil' | 'senior'

export interface Team {
  id: string
  clubId: string
  season: Season       // Temporada a la que pertenece
  name: string         // Nombre comercial/patrocinador (ej: "Calvo Xiria")
  description?: string
  ageCategoryId?: string  // Referencia a AgeCategory de Settings
  genderOptionId?: string // Referencia a GenderOption de Settings
  ageGroup: AgeGroup      // Legacy / fallback
  gender: TeamGender      // Legacy / fallback
  color: string
  coachId?: string        // employeeId
  playersCount?: number
  isActive: boolean
  createdAt: Date
}

// === PROJECTS ===
export interface Project {
  id: string
  clubId: string
  season: Season       // Temporada a la que pertenece
  name: string
  description?: string
  startDate: Date
  endDate?: Date
  budget?: number
  status: 'active' | 'completed' | 'cancelled'
  teamIds?: string[]
  managerId?: string   // employeeId
  createdAt: Date
}

// === EVENTS ===
export interface Event {
  id: string
  clubId: string
  season: Season       // Temporada a la que pertenece
  name: string
  description?: string
  date: Date
  endDate?: Date
  location?: string
  budget?: number
  projectId?: string
  teamIds?: string[]
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  createdAt: Date
}

// === SUPPLIERS (Proveedores) ===
export interface Supplier {
  id: string
  clubId: string
  name: string
  taxId?: string // CIF/NIF
  email?: string
  phone?: string
  address?: string
  contactPerson?: string
  category?: string // Tipo de proveedor
  bankAccount?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// === SPONSORS (Patrocinadores) ===
export type SponsorType = 'main' | 'official' | 'team' | 'event' | 'equipment'

export interface Sponsor {
  id: string
  clubId: string
  name: string
  logo?: string
  type: SponsorType
  contactPerson?: string
  email?: string
  phone?: string
  website?: string
  // Vinculaciones
  teamIds?: string[] // Equipos patrocinados
  projectIds?: string[]
  // Contrato
  contractStart?: Date
  contractEnd?: Date
  annualAmount?: number
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// === EMPLOYEES (Empleados) ===
export type EmployeeType = 'coach' | 'staff' | 'admin' | 'physio' | 'delegate'
export type ContractType = 'full_time' | 'part_time' | 'freelance' | 'volunteer'

export interface Employee {
  id: string
  clubId: string
  userId?: string // Si tiene cuenta de usuario
  name: string
  email?: string
  phone?: string
  type: EmployeeType
  contractType: ContractType
  // Salario
  monthlySalary?: number
  hourlyRate?: number
  // Asignaciones
  teamIds?: string[] // Equipos donde trabaja
  projectIds?: string[] // Proyectos asignados
  // Datos adicionales
  startDate: Date
  endDate?: Date
  ssNumber?: string // Número SS
  bankAccount?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// === ALLOCATIONS (Asignaciones porcentuales) ===
export interface Allocation {
  teamId?: string
  teamName?: string
  projectId?: string
  projectName?: string
  eventId?: string
  eventName?: string
  percentage: number // 0-100
  amount?: number // Calculated: transaction.amount * percentage / 100
}

// === SEASONS ===
// Season format: "2024/25" (starts July, ends June)
export type Season = string // e.g. "2024/25"

/**
 * Compute season from a date.
 * Jul-Dec → startYear/endYear, Jan-Jun → (year-1)/year
 * Can be overridden manually on the transaction.
 */
export function computeSeason(date: Date): Season {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-12
  if (month >= 7) {
    return `${year}/${String(year + 1).slice(-2)}`
  }
  return `${year - 1}/${String(year).slice(-2)}`
}

/**
 * Get season start/end dates
 */
export function getSeasonDates(season: Season): { start: Date; end: Date } {
  const startYear = parseInt(season.split('/')[0])
  return {
    start: new Date(startYear, 6, 1), // July 1
    end: new Date(startYear + 1, 5, 30, 23, 59, 59) // June 30
  }
}

/**
 * Generate season options for selectors
 */
export function getSeasonOptions(count = 5): { label: string; value: Season }[] {
  const now = new Date()
  const currentSeason = computeSeason(now)
  const currentStartYear = parseInt(currentSeason.split('/')[0])
  const options: { label: string; value: Season }[] = []
  for (let i = count - 1; i >= -1; i--) {
    const y = currentStartYear - i
    const season = `${y}/${String(y + 1).slice(-2)}`
    options.push({ label: `Temporada ${season}`, value: season })
  }
  return options
}

// === SEARCH KEYWORDS ===

/**
 * Normalize text for search: lowercase, remove accents, trim
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .trim()
}

/**
 * Generate search keywords from a transaction's fields.
 * Stores both full words AND prefix substrings (min 3 chars)
 * so users can find "Farmacia" by typing "farm".
 *
 * Firestore array-contains matches ONE element exactly,
 * so we store prefixes to enable partial matching.
 *
 * Example: "Farmacia López" →
 *   ["far", "farm", "farma", "farmac", "farmaci", "farmacia",
 *    "lop", "lope", "lopez"]
 */
export function generateSearchKeywords(fields: {
  description: string
  categoryName?: string
  teamName?: string
  supplierName?: string
  sponsorName?: string
  reference?: string
  invoiceNumber?: string
  notes?: string
}): string[] {
  const keywords = new Set<string>()

  // Collect all searchable text
  const texts = [
    fields.description,
    fields.categoryName,
    fields.teamName,
    fields.supplierName,
    fields.sponsorName,
    fields.reference,
    fields.invoiceNumber,
    fields.notes
  ].filter(Boolean) as string[]

  for (const text of texts) {
    const normalized = normalizeText(text)
    // Split into words
    const words = normalized.split(/[\s\-_/.,;:]+/).filter(w => w.length >= 2)

    for (const word of words) {
      // Add the full word
      keywords.add(word)
      // Add prefixes (min 3 chars) for partial matching
      for (let len = 3; len < word.length; len++) {
        keywords.add(word.substring(0, len))
      }
    }
  }

  // Limit to 200 entries to stay within Firestore array limits
  return Array.from(keywords).slice(0, 200)
}

// === TRANSACTIONS ===
export type TransactionType = 'income' | 'expense'
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'paid'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'check' | 'direct_debit' | 'other'

// Well-known category ID for uncategorized transactions
export const UNCATEGORIZED_CATEGORY_ID = '__uncategorized__'

export interface Transaction {
  id: string
  clubId: string
  type: TransactionType
  amount: number
  description: string
  categoryId: string
  categoryName?: string
  
  // Season (e.g. "2024/25") — auto-computed from date, but overrideable
  season?: Season
  
  // Simple assignment (backward compatible)
  teamId?: string
  teamName?: string
  projectId?: string
  projectName?: string
  eventId?: string
  eventName?: string
  
  // Multiple allocations (new feature)
  // If allocations exist, they override teamId/projectId/eventId
  // Sum of percentages should equal 100%
  allocations?: Allocation[]
  
  // Relations
  supplierId?: string
  supplierName?: string
  sponsorId?: string
  sponsorName?: string
  employeeId?: string
  employeeName?: string
  
  // Financial details
  date: Date
  dueDate?: Date // Fecha de vencimiento
  paidDate?: Date // Fecha real de cobro/pago
  paymentMethod: PaymentMethod
  reference?: string
  invoiceNumber?: string
  
  // Tax breakdown
  baseAmount?: number // Importe base (sin IVA)
  taxRate?: number // Porcentaje de IVA (ej: 21)
  taxAmount?: number // Importe del IVA
  
  // For recurring (salaries, subscriptions)
  isRecurring?: boolean
  recurringPeriod?: 'monthly' | 'quarterly' | 'annual'
  
  // Attachments
  attachments?: Attachment[]
  
  // Status & workflow
  status: TransactionStatus
  createdBy: string
  createdByName?: string
  approvedBy?: string
  approvedAt?: Date
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Search
  searchKeywords?: string[]
  
  // Month closing
  monthClosed?: boolean
  closedInMonth?: string // Format: YYYY-MM
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: Date
}

// === MONTH CLOSING ===
export type MonthClosingStatus = 'open' | 'pending_review' | 'closed'

export interface MonthClosing {
  id: string // Format: clubId_YYYY-MM
  clubId: string
  year: number
  month: number
  status: MonthClosingStatus
  
  // Summary
  totalIncome: number
  totalExpenses: number
  balance: number
  transactionCount: number
  
  // Breakdown by category
  incomeByCategory: Record<string, number>
  expensesByCategory: Record<string, number>
  
  // Breakdown by team/project
  byTeam: Record<string, { income: number; expenses: number }>
  byProject: Record<string, { income: number; expenses: number }>
  
  // Workflow
  closedBy?: string
  closedAt?: Date
  reviewedBy?: string
  reviewedAt?: Date
  notes?: string
  
  createdAt: Date
  updatedAt: Date
}

// === FORECASTS & BUDGETS ===
export interface Forecast {
  id: string
  clubId: string
  season: Season
  year: number
  month: number
  categoryId: string
  categoryName?: string
  type: TransactionType
  amount: number
  source: 'historical' | 'manual'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Budget {
  id: string
  clubId: string
  season: Season          // '2025/26'
  name: string
  targetSurplus: number   // Objetivo de superávit
  incomeAllocations: BudgetAllocation[]
  expenseAllocations: BudgetAllocation[]
  createdAt: Date
  updatedAt: Date
}

export interface BudgetAllocation {
  categoryId: string
  amount: number          // Presupuesto anual para esta categoría
}

// === FILTERS & QUERIES ===
export interface TransactionFilters {
  type?: TransactionType
  status?: TransactionStatus
  categoryId?: string
  teamId?: string
  projectId?: string
  eventId?: string
  supplierId?: string
  sponsorId?: string
  employeeId?: string
  dateFrom?: Date
  dateTo?: Date
  searchQuery?: string
  paymentMethod?: PaymentMethod
  season?: Season
  uncategorized?: boolean // Filter only uncategorized transactions
}

export interface DateRange {
  start: Date
  end: Date
}

// === STATISTICS ===
export interface PeriodStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  transactionCount: number
  incomeCount: number
  expenseCount: number
  avgTransactionAmount: number
  largestIncome: number
  largestExpense: number
}

export interface CategoryStats {
  categoryId: string
  categoryName: string
  total: number
  count: number
  percentage: number
}

export interface TrendData {
  label: string
  income: number
  expenses: number
  balance: number
}

// === NOTIFICATIONS ===
export interface Notification {
  id: string
  userId: string
  type: 'transaction_created' | 'transaction_approved' | 'transaction_rejected' | 'month_closed' | 'reminder'
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: Date
}

// === FINANCIAL HEALTH ===
export interface FinancialTarget {
  id: string
  clubId: string
  seasonYear: number // Año de inicio de temporada (2024 = temporada 2024-25)
  targetSurplus: number
  totalBudgetedIncome: number
  totalBudgetedExpenses: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type HealthStatus = 'excellent' | 'good' | 'warning' | 'critical'

export interface FinancialHealthData {
  // Current state
  currentBalance: number
  totalIncomeYTD: number
  totalExpensesYTD: number
  
  // Targets
  targetSurplus: number
  budgetedIncomeYTD: number
  budgetedExpensesYTD: number
  
  // Progress
  progressPercent: number // 0-100+
  balanceVsBudget: number // Actual - Expected
  
  // Projections
  projectedYearEndBalance: number
  gapToTarget: number // How much more income needed
  
  // Status
  status: HealthStatus
  statusMessage: string
  
  // Trends
  monthlyTrend: 'improving' | 'stable' | 'declining'
  incomeOnTrack: boolean
  expensesOnTrack: boolean
}

export interface BudgetAlert {
  id: string
  type: 'overspend' | 'underfund' | 'cashflow' | 'deviation'
  severity: 'info' | 'warning' | 'critical'
  categoryId?: string
  categoryName?: string
  message: string
  amount?: number
  percentDeviation?: number
  createdAt: Date
}

// === TEAM PROFITABILITY ANALYSIS ===
export interface TeamFinancials {
  teamId: string
  teamName: string
  teamColor: string
  ageGroup?: AgeGroup
  playersCount: number
  
  // Income breakdown
  totalIncome: number
  incomeFromFees: number // Cuotas de jugadores
  incomeFromSponsors: number // Patrocinios asignados
  incomeFromGrants: number // Subvenciones
  incomeFromEvents: number // Eventos
  incomeOther: number
  
  // Expense breakdown
  totalExpenses: number
  expensesCoaches: number // Salarios entrenadores
  expensesEquipment: number // Equipaciones
  expensesMaterial: number // Material deportivo
  expensesTransport: number // Transporte/viajes
  expensesFees: number // Licencias, federación
  expensesOther: number
  
  // Analysis
  balance: number // totalIncome - totalExpenses
  balancePerPlayer: number
  
  // Fee analysis
  currentMonthlyFee: number // Cuota actual
  minSustainableFee: number // Cuota mínima = (totalExpenses - otherIncome) / playersCount / months
  feeGap: number // currentFee - minSustainableFee (positive = surplus, negative = deficit)
  feeCoveragePercent: number // How much of expenses are covered by fees
  
  // Status
  isProfitable: boolean
  status: 'surplus' | 'balanced' | 'deficit' | 'critical'
  statusMessage: string
}

export interface TeamProfitabilityAlert {
  id: string
  teamId: string
  teamName: string
  type: 
    | 'fee_too_low' // Cuota insuficiente
    | 'high_expense_category' // Categoría de gasto anormalmente alta
    | 'no_sponsors' // Equipo sin patrocinadores
    | 'coach_cost_high' // Coste de entrenadores alto vs ingresos
    | 'deficit_projected' // Se proyecta déficit
    | 'expense_spike' // Pico de gasto inusual
    | 'low_players' // Pocos jugadores para sostener gastos
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  recommendation: string
  
  // Data for context
  currentValue?: number
  expectedValue?: number
  threshold?: number
  categoryId?: string
  categoryName?: string
  
  createdAt: Date
}

export interface ClubProfitabilitySummary {
  // Overall
  totalTeams: number
  profitableTeams: number
  deficitTeams: number
  criticalTeams: number
  
  // Finances
  totalClubIncome: number
  totalClubExpenses: number
  clubBalance: number
  
  // Unallocated (club-wide expenses not assigned to teams)
  unallocatedExpenses: number
  unallocatedIncome: number
  
  // Analysis
  avgFeeGap: number // Average across all teams
  teamsNeedingAttention: string[] // teamIds with issues
  
  // Top issues
  topAlerts: TeamProfitabilityAlert[]
}

// === SMART ALERTS CONFIG ===
export interface AlertThresholds {
  // Fee alerts
  minFeeCoveragePercent: number // Default: 60% - alert if fees cover less than this
  criticalFeeCoveragePercent: number // Default: 40%
  
  // Expense alerts
  expenseSpikePercent: number // Default: 50% - alert if category > 50% above average
  highExpensePerPlayer: number // Default: 100€ - alert if expense per player exceeds
  
  // Balance alerts
  maxDeficitMonths: number // Default: 3 - alert if deficit for X consecutive months
  
  // Category specific (€/month thresholds)
  categoryThresholds: Record<string, number> // e.g., { 'sanitario': 800 }
}
