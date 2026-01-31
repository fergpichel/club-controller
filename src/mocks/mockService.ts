/**
 * MOCK SERVICE
 * Simula las operaciones de Firebase con persistencia en localStorage
 * Activar con VITE_USE_MOCK=true
 */

import { mockData } from './data'
import type {
  User,
  Club,
  Category,
  Team,
  Project,
  Event,
  Supplier,
  Sponsor,
  Employee,
  Transaction,
  MonthClosing,
  TransactionFilters,
  PeriodStats,
  CategoryStats,
  TrendData
} from 'src/types'

// === STORAGE KEYS ===
const STORAGE_KEYS = {
  club: 'mock_club',
  users: 'mock_users',
  categories: 'mock_categories',
  teams: 'mock_teams',
  employees: 'mock_employees',
  suppliers: 'mock_suppliers',
  sponsors: 'mock_sponsors',
  projects: 'mock_projects',
  events: 'mock_events',
  transactions: 'mock_transactions',
  monthClosings: 'mock_monthClosings',
  currentUser: 'mock_currentUser'
}

// === HELPERS ===
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convert date strings back to Date objects
      return parseDates(parsed) as T
    }
    return defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

function parseDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(obj)) {
    return new Date(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map(parseDates)
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = parseDates(value)
    }
    return result
  }
  return obj
}

function delay(ms = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// === INITIALIZATION ===
function initializeMockData(): void {
  // Only initialize if not already in localStorage
  if (!localStorage.getItem(STORAGE_KEYS.transactions)) {
    saveToStorage(STORAGE_KEYS.club, mockData.club)
    saveToStorage(STORAGE_KEYS.users, mockData.users)
    saveToStorage(STORAGE_KEYS.categories, mockData.categories)
    saveToStorage(STORAGE_KEYS.teams, mockData.teams)
    saveToStorage(STORAGE_KEYS.employees, mockData.employees)
    saveToStorage(STORAGE_KEYS.suppliers, mockData.suppliers)
    saveToStorage(STORAGE_KEYS.sponsors, mockData.sponsors)
    saveToStorage(STORAGE_KEYS.projects, mockData.projects)
    saveToStorage(STORAGE_KEYS.events, mockData.events)
    saveToStorage(STORAGE_KEYS.transactions, mockData.transactions)
    saveToStorage(STORAGE_KEYS.monthClosings, mockData.monthClosings)
    console.log('🎭 Mock data initialized')
  }
}

function resetMockData(): void {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  initializeMockData()
  console.log('🔄 Mock data reset')
}

// === AUTH SERVICE ===
const authService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async login(email: string, _password: string): Promise<User | null> {
    await delay(500)
    const users = getFromStorage<User[]>(STORAGE_KEYS.users, mockData.users)
    const user = users.find(u => u.email === email)
    if (user) {
      saveToStorage(STORAGE_KEYS.currentUser, user)
      return user
    }
    // For demo, accept any email and create a mock user
    const demoUser: User = {
      uid: generateId('user'),
      email,
      displayName: email.split('@')[0],
      role: 'manager',
      clubId: mockData.club.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    saveToStorage(STORAGE_KEYS.currentUser, demoUser)
    return demoUser
  },

  async logout(): Promise<void> {
    await delay(200)
    localStorage.removeItem(STORAGE_KEYS.currentUser)
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(100)
    return getFromStorage<User | null>(STORAGE_KEYS.currentUser, null)
  },

  async register(email: string, _password: string, displayName: string): Promise<User> {
    await delay(500)
    const newUser: User = {
      uid: generateId('user'),
      email,
      displayName,
      role: 'employee',
      clubId: mockData.club.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const users = getFromStorage<User[]>(STORAGE_KEYS.users, mockData.users)
    users.push(newUser)
    saveToStorage(STORAGE_KEYS.users, users)
    saveToStorage(STORAGE_KEYS.currentUser, newUser)
    return newUser
  }
}

// === CLUB SERVICE ===
const clubService = {
  async getClub(clubId: string): Promise<Club | null> {
    await delay(200)
    const club = getFromStorage<Club>(STORAGE_KEYS.club, mockData.club)
    return club.id === clubId ? club : null
  },

  async updateClub(clubId: string, data: Partial<Club>): Promise<void> {
    await delay(300)
    const club = getFromStorage<Club>(STORAGE_KEYS.club, mockData.club)
    if (club.id === clubId) {
      saveToStorage(STORAGE_KEYS.club, { ...club, ...data })
    }
  }
}

// === CATEGORIES SERVICE ===
const categoriesService = {
  async getAll(): Promise<Category[]> {
    await delay(200)
    return getFromStorage<Category[]>(STORAGE_KEYS.categories, mockData.categories)
  },

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    await delay(300)
    const categories = getFromStorage<Category[]>(STORAGE_KEYS.categories, mockData.categories)
    const newCategory: Category = { ...category, id: generateId('cat') }
    categories.push(newCategory)
    saveToStorage(STORAGE_KEYS.categories, categories)
    return newCategory
  },

  async update(id: string, data: Partial<Category>): Promise<void> {
    await delay(300)
    const categories = getFromStorage<Category[]>(STORAGE_KEYS.categories, mockData.categories)
    const index = categories.findIndex(c => c.id === id)
    if (index !== -1) {
      categories[index] = { ...categories[index], ...data }
      saveToStorage(STORAGE_KEYS.categories, categories)
    }
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const categories = getFromStorage<Category[]>(STORAGE_KEYS.categories, mockData.categories)
    saveToStorage(STORAGE_KEYS.categories, categories.filter(c => c.id !== id))
  }
}

// === TEAMS SERVICE ===
const teamsService = {
  async getAll(): Promise<Team[]> {
    await delay(200)
    return getFromStorage<Team[]>(STORAGE_KEYS.teams, mockData.teams)
  },

  async getById(id: string): Promise<Team | null> {
    await delay(150)
    const teams = getFromStorage<Team[]>(STORAGE_KEYS.teams, mockData.teams)
    return teams.find(t => t.id === id) || null
  },

  async create(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    await delay(300)
    const teams = getFromStorage<Team[]>(STORAGE_KEYS.teams, mockData.teams)
    const newTeam: Team = { ...team, id: generateId('team'), createdAt: new Date() }
    teams.push(newTeam)
    saveToStorage(STORAGE_KEYS.teams, teams)
    return newTeam
  },

  async update(id: string, data: Partial<Team>): Promise<void> {
    await delay(300)
    const teams = getFromStorage<Team[]>(STORAGE_KEYS.teams, mockData.teams)
    const index = teams.findIndex(t => t.id === id)
    if (index !== -1) {
      teams[index] = { ...teams[index], ...data }
      saveToStorage(STORAGE_KEYS.teams, teams)
    }
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const teams = getFromStorage<Team[]>(STORAGE_KEYS.teams, mockData.teams)
    saveToStorage(STORAGE_KEYS.teams, teams.filter(t => t.id !== id))
  }
}

// === EMPLOYEES SERVICE ===
const employeesService = {
  async getAll(): Promise<Employee[]> {
    await delay(200)
    return getFromStorage<Employee[]>(STORAGE_KEYS.employees, mockData.employees)
  },

  async getById(id: string): Promise<Employee | null> {
    await delay(150)
    const employees = getFromStorage<Employee[]>(STORAGE_KEYS.employees, mockData.employees)
    return employees.find(e => e.id === id) || null
  },

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    await delay(300)
    const employees = getFromStorage<Employee[]>(STORAGE_KEYS.employees, mockData.employees)
    const newEmployee: Employee = {
      ...employee,
      id: generateId('emp'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    employees.push(newEmployee)
    saveToStorage(STORAGE_KEYS.employees, employees)
    return newEmployee
  },

  async update(id: string, data: Partial<Employee>): Promise<void> {
    await delay(300)
    const employees = getFromStorage<Employee[]>(STORAGE_KEYS.employees, mockData.employees)
    const index = employees.findIndex(e => e.id === id)
    if (index !== -1) {
      employees[index] = { ...employees[index], ...data, updatedAt: new Date() }
      saveToStorage(STORAGE_KEYS.employees, employees)
    }
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const employees = getFromStorage<Employee[]>(STORAGE_KEYS.employees, mockData.employees)
    saveToStorage(STORAGE_KEYS.employees, employees.filter(e => e.id !== id))
  }
}

// === SUPPLIERS SERVICE ===
const suppliersService = {
  async getAll(): Promise<Supplier[]> {
    await delay(200)
    return getFromStorage<Supplier[]>(STORAGE_KEYS.suppliers, mockData.suppliers)
  },

  async getById(id: string): Promise<Supplier | null> {
    await delay(150)
    const suppliers = getFromStorage<Supplier[]>(STORAGE_KEYS.suppliers, mockData.suppliers)
    return suppliers.find(s => s.id === id) || null
  },

  async create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    await delay(300)
    const suppliers = getFromStorage<Supplier[]>(STORAGE_KEYS.suppliers, mockData.suppliers)
    const newSupplier: Supplier = {
      ...supplier,
      id: generateId('sup'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    suppliers.push(newSupplier)
    saveToStorage(STORAGE_KEYS.suppliers, suppliers)
    return newSupplier
  },

  async update(id: string, data: Partial<Supplier>): Promise<void> {
    await delay(300)
    const suppliers = getFromStorage<Supplier[]>(STORAGE_KEYS.suppliers, mockData.suppliers)
    const index = suppliers.findIndex(s => s.id === id)
    if (index !== -1) {
      suppliers[index] = { ...suppliers[index], ...data, updatedAt: new Date() }
      saveToStorage(STORAGE_KEYS.suppliers, suppliers)
    }
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const suppliers = getFromStorage<Supplier[]>(STORAGE_KEYS.suppliers, mockData.suppliers)
    saveToStorage(STORAGE_KEYS.suppliers, suppliers.filter(s => s.id !== id))
  }
}

// === SPONSORS SERVICE ===
const sponsorsService = {
  async getAll(): Promise<Sponsor[]> {
    await delay(200)
    return getFromStorage<Sponsor[]>(STORAGE_KEYS.sponsors, mockData.sponsors)
  },

  async getById(id: string): Promise<Sponsor | null> {
    await delay(150)
    const sponsors = getFromStorage<Sponsor[]>(STORAGE_KEYS.sponsors, mockData.sponsors)
    return sponsors.find(s => s.id === id) || null
  },

  async create(sponsor: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sponsor> {
    await delay(300)
    const sponsors = getFromStorage<Sponsor[]>(STORAGE_KEYS.sponsors, mockData.sponsors)
    const newSponsor: Sponsor = {
      ...sponsor,
      id: generateId('spo'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    sponsors.push(newSponsor)
    saveToStorage(STORAGE_KEYS.sponsors, sponsors)
    return newSponsor
  },

  async update(id: string, data: Partial<Sponsor>): Promise<void> {
    await delay(300)
    const sponsors = getFromStorage<Sponsor[]>(STORAGE_KEYS.sponsors, mockData.sponsors)
    const index = sponsors.findIndex(s => s.id === id)
    if (index !== -1) {
      sponsors[index] = { ...sponsors[index], ...data, updatedAt: new Date() }
      saveToStorage(STORAGE_KEYS.sponsors, sponsors)
    }
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const sponsors = getFromStorage<Sponsor[]>(STORAGE_KEYS.sponsors, mockData.sponsors)
    saveToStorage(STORAGE_KEYS.sponsors, sponsors.filter(s => s.id !== id))
  }
}

// === PROJECTS SERVICE ===
const projectsService = {
  async getAll(): Promise<Project[]> {
    await delay(200)
    return getFromStorage<Project[]>(STORAGE_KEYS.projects, mockData.projects)
  },

  async getById(id: string): Promise<Project | null> {
    await delay(150)
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.projects, mockData.projects)
    return projects.find(p => p.id === id) || null
  },

  async create(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    await delay(300)
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.projects, mockData.projects)
    const newProject: Project = { ...project, id: generateId('proj'), createdAt: new Date() }
    projects.push(newProject)
    saveToStorage(STORAGE_KEYS.projects, projects)
    return newProject
  },

  async update(id: string, data: Partial<Project>): Promise<void> {
    await delay(300)
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.projects, mockData.projects)
    const index = projects.findIndex(p => p.id === id)
    if (index !== -1) {
      projects[index] = { ...projects[index], ...data }
      saveToStorage(STORAGE_KEYS.projects, projects)
    }
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.projects, mockData.projects)
    saveToStorage(STORAGE_KEYS.projects, projects.filter(p => p.id !== id))
  }
}

// === EVENTS SERVICE ===
const eventsService = {
  async getAll(): Promise<Event[]> {
    await delay(200)
    return getFromStorage<Event[]>(STORAGE_KEYS.events, mockData.events)
  },

  async getById(id: string): Promise<Event | null> {
    await delay(150)
    const events = getFromStorage<Event[]>(STORAGE_KEYS.events, mockData.events)
    return events.find(e => e.id === id) || null
  },

  async getUpcoming(): Promise<Event[]> {
    await delay(200)
    const events = getFromStorage<Event[]>(STORAGE_KEYS.events, mockData.events)
    const now = new Date()
    return events
      .filter(e => new Date(e.date) >= now && e.status !== 'cancelled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  },

  async create(event: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    await delay(300)
    const events = getFromStorage<Event[]>(STORAGE_KEYS.events, mockData.events)
    const newEvent: Event = { ...event, id: generateId('evt'), createdAt: new Date() }
    events.push(newEvent)
    saveToStorage(STORAGE_KEYS.events, events)
    return newEvent
  },

  async update(id: string, data: Partial<Event>): Promise<void> {
    await delay(300)
    const events = getFromStorage<Event[]>(STORAGE_KEYS.events, mockData.events)
    const index = events.findIndex(e => e.id === id)
    if (index !== -1) {
      events[index] = { ...events[index], ...data }
      saveToStorage(STORAGE_KEYS.events, events)
    }
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const events = getFromStorage<Event[]>(STORAGE_KEYS.events, mockData.events)
    saveToStorage(STORAGE_KEYS.events, events.filter(e => e.id !== id))
  }
}

// === TRANSACTIONS SERVICE ===
const transactionsService = {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    await delay(300)
    let transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    
    if (filters) {
      if (filters.type) transactions = transactions.filter(t => t.type === filters.type)
      if (filters.status) transactions = transactions.filter(t => t.status === filters.status)
      if (filters.categoryId) transactions = transactions.filter(t => t.categoryId === filters.categoryId)
      if (filters.teamId) transactions = transactions.filter(t => t.teamId === filters.teamId)
      if (filters.projectId) transactions = transactions.filter(t => t.projectId === filters.projectId)
      if (filters.eventId) transactions = transactions.filter(t => t.eventId === filters.eventId)
      if (filters.supplierId) transactions = transactions.filter(t => t.supplierId === filters.supplierId)
      if (filters.sponsorId) transactions = transactions.filter(t => t.sponsorId === filters.sponsorId)
      if (filters.employeeId) transactions = transactions.filter(t => t.employeeId === filters.employeeId)
      if (filters.dateFrom) transactions = transactions.filter(t => new Date(t.date) >= new Date(filters.dateFrom!))
      if (filters.dateTo) transactions = transactions.filter(t => new Date(t.date) <= new Date(filters.dateTo!))
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        transactions = transactions.filter(t =>
          t.description.toLowerCase().includes(query) ||
          t.categoryName?.toLowerCase().includes(query) ||
          t.teamName?.toLowerCase().includes(query)
        )
      }
    }
    
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  async getById(id: string): Promise<Transaction | null> {
    await delay(150)
    const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    return transactions.find(t => t.id === id) || null
  },

  async getPending(): Promise<Transaction[]> {
    await delay(200)
    const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    return transactions.filter(t => t.status === 'pending')
  },

  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    await delay(400)
    const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    const categories = getFromStorage<Category[]>(STORAGE_KEYS.categories, mockData.categories)
    const teams = getFromStorage<Team[]>(STORAGE_KEYS.teams, mockData.teams)
    
    const category = categories.find(c => c.id === transaction.categoryId)
    const team = transaction.teamId ? teams.find(t => t.id === transaction.teamId) : null
    
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId('txn'),
      categoryName: category?.name,
      teamName: team?.name,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    transactions.push(newTransaction)
    saveToStorage(STORAGE_KEYS.transactions, transactions)
    return newTransaction
  },

  async update(id: string, data: Partial<Transaction>): Promise<void> {
    await delay(300)
    const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    const index = transactions.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...data, updatedAt: new Date() }
      saveToStorage(STORAGE_KEYS.transactions, transactions)
    }
  },

  async delete(id: string): Promise<void> {
    await delay(300)
    const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    saveToStorage(STORAGE_KEYS.transactions, transactions.filter(t => t.id !== id))
  },

  async approve(id: string, approvedBy: string): Promise<void> {
    await delay(300)
    const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    const index = transactions.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      }
      saveToStorage(STORAGE_KEYS.transactions, transactions)
    }
  },

  async reject(id: string): Promise<void> {
    await delay(300)
    const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    const index = transactions.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        status: 'rejected',
        updatedAt: new Date()
      }
      saveToStorage(STORAGE_KEYS.transactions, transactions)
    }
  }
}

// === STATISTICS SERVICE ===
const statisticsService = {
  async getMonthlyStats(year: number, month: number): Promise<PeriodStats> {
    await delay(300)
    const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    
    const monthTransactions = transactions.filter(t => {
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() === month - 1
    })
    
    const income = monthTransactions.filter(t => t.type === 'income')
    const expenses = monthTransactions.filter(t => t.type === 'expense')
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
    
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: monthTransactions.length,
      incomeCount: income.length,
      expenseCount: expenses.length,
      avgTransactionAmount: monthTransactions.length > 0 
        ? monthTransactions.reduce((sum, t) => sum + t.amount, 0) / monthTransactions.length 
        : 0,
      largestIncome: income.length > 0 ? Math.max(...income.map(t => t.amount)) : 0,
      largestExpense: expenses.length > 0 ? Math.max(...expenses.map(t => t.amount)) : 0
    }
  },

  async getTrendData(months: number): Promise<TrendData[]> {
    await delay(300)
    const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    const result: TrendData[] = []
    const now = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()
      
      const monthTransactions = transactions.filter(t => {
        const d = new Date(t.date)
        return d.getFullYear() === year && d.getMonth() === month
      })
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      
      result.push({
        label: date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        income,
        expenses,
        balance: income - expenses
      })
    }
    
    return result
  },

  async getCategoryStats(startDate: Date, endDate: Date, type: 'income' | 'expense'): Promise<CategoryStats[]> {
    await delay(300)
    const transactions = getFromStorage<Transaction[]>(STORAGE_KEYS.transactions, mockData.transactions)
    const categories = getFromStorage<Category[]>(STORAGE_KEYS.categories, mockData.categories)
    
    const filtered = transactions.filter(t => {
      const d = new Date(t.date)
      return t.type === type && d >= startDate && d <= endDate
    })
    
    const total = filtered.reduce((sum, t) => sum + t.amount, 0)
    const byCategoryId: Record<string, number> = {}
    
    filtered.forEach(t => {
      byCategoryId[t.categoryId] = (byCategoryId[t.categoryId] || 0) + t.amount
    })
    
    return Object.entries(byCategoryId)
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId)
        return {
          categoryId,
          categoryName: category?.name || 'Sin categoría',
          total: amount,
          count: filtered.filter(t => t.categoryId === categoryId).length,
          percentage: total > 0 ? (amount / total) * 100 : 0
        }
      })
      .sort((a, b) => b.total - a.total)
  }
}

// === MONTH CLOSINGS SERVICE ===
const monthClosingsService = {
  async getAll(): Promise<MonthClosing[]> {
    await delay(200)
    return getFromStorage<MonthClosing[]>(STORAGE_KEYS.monthClosings, mockData.monthClosings)
  },

  async getByMonth(year: number, month: number): Promise<MonthClosing | null> {
    await delay(150)
    const closings = getFromStorage<MonthClosing[]>(STORAGE_KEYS.monthClosings, mockData.monthClosings)
    return closings.find(c => c.year === year && c.month === month) || null
  },

  async close(year: number, month: number, userId: string): Promise<MonthClosing> {
    await delay(500)
    const closings = getFromStorage<MonthClosing[]>(STORAGE_KEYS.monthClosings, mockData.monthClosings)
    const stats = await statisticsService.getMonthlyStats(year, month)
    
    const closing: MonthClosing = {
      id: `${mockData.club.id}_${year}-${String(month).padStart(2, '0')}`,
      clubId: mockData.club.id,
      year,
      month,
      status: 'closed',
      totalIncome: stats.totalIncome,
      totalExpenses: stats.totalExpenses,
      balance: stats.balance,
      transactionCount: stats.transactionCount,
      incomeByCategory: {},
      expensesByCategory: {},
      byTeam: {},
      byProject: {},
      closedBy: userId,
      closedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    closings.push(closing)
    saveToStorage(STORAGE_KEYS.monthClosings, closings)
    return closing
  }
}

// === EXPORT ===
export const mockService = {
  init: initializeMockData,
  reset: resetMockData,
  auth: authService,
  club: clubService,
  categories: categoriesService,
  teams: teamsService,
  employees: employeesService,
  suppliers: suppliersService,
  sponsors: sponsorsService,
  projects: projectsService,
  events: eventsService,
  transactions: transactionsService,
  statistics: statisticsService,
  monthClosings: monthClosingsService
}

// Initialize on import
if (import.meta.env.VITE_USE_MOCK === 'true') {
  initializeMockData()
}
