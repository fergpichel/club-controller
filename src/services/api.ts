/**
 * API SERVICE
 * Capa de abstracción que usa mock o Firebase según configuración
 */

import { isMockEnabled, mockService } from 'src/mocks'
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

// === AUTH API ===
export const authApi = {
  async login(email: string, password: string): Promise<User | null> {
    if (isMockEnabled()) {
      return mockService.auth.login(email, password)
    }
    // Firebase implementation handled by auth store directly
    throw new Error('Firebase auth should be handled by auth store')
  },

  async logout(): Promise<void> {
    if (isMockEnabled()) {
      return mockService.auth.logout()
    }
    throw new Error('Firebase auth should be handled by auth store')
  },

  async getCurrentUser(): Promise<User | null> {
    if (isMockEnabled()) {
      return mockService.auth.getCurrentUser()
    }
    throw new Error('Firebase auth should be handled by auth store')
  },

  async register(email: string, password: string, displayName: string): Promise<User> {
    if (isMockEnabled()) {
      return mockService.auth.register(email, password, displayName)
    }
    throw new Error('Firebase auth should be handled by auth store')
  }
}

// === CLUB API ===
export const clubApi = {
  async getClub(clubId: string): Promise<Club | null> {
    if (isMockEnabled()) {
      return mockService.club.getClub(clubId)
    }
    // Firebase implementation
    return null
  },

  async updateClub(clubId: string, data: Partial<Club>): Promise<void> {
    if (isMockEnabled()) {
      return mockService.club.updateClub(clubId, data)
    }
  }
}

// === CATEGORIES API ===
export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    if (isMockEnabled()) {
      return mockService.categories.getAll()
    }
    return []
  },

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    if (isMockEnabled()) {
      return mockService.categories.create(category)
    }
    throw new Error('Not implemented')
  },

  async update(id: string, data: Partial<Category>): Promise<void> {
    if (isMockEnabled()) {
      return mockService.categories.update(id, data)
    }
  },

  async delete(id: string): Promise<void> {
    if (isMockEnabled()) {
      return mockService.categories.delete(id)
    }
  }
}

// === TEAMS API ===
export const teamsApi = {
  async getAll(): Promise<Team[]> {
    if (isMockEnabled()) {
      return mockService.teams.getAll()
    }
    return []
  },

  async getById(id: string): Promise<Team | null> {
    if (isMockEnabled()) {
      return mockService.teams.getById(id)
    }
    return null
  },

  async create(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    if (isMockEnabled()) {
      return mockService.teams.create(team)
    }
    throw new Error('Not implemented')
  },

  async update(id: string, data: Partial<Team>): Promise<void> {
    if (isMockEnabled()) {
      return mockService.teams.update(id, data)
    }
  },

  async delete(id: string): Promise<void> {
    if (isMockEnabled()) {
      return mockService.teams.delete(id)
    }
  }
}

// === EMPLOYEES API ===
export const employeesApi = {
  async getAll(): Promise<Employee[]> {
    if (isMockEnabled()) {
      return mockService.employees.getAll()
    }
    return []
  },

  async getById(id: string): Promise<Employee | null> {
    if (isMockEnabled()) {
      return mockService.employees.getById(id)
    }
    return null
  },

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    if (isMockEnabled()) {
      return mockService.employees.create(employee)
    }
    throw new Error('Not implemented')
  },

  async update(id: string, data: Partial<Employee>): Promise<void> {
    if (isMockEnabled()) {
      return mockService.employees.update(id, data)
    }
  },

  async delete(id: string): Promise<void> {
    if (isMockEnabled()) {
      return mockService.employees.delete(id)
    }
  }
}

// === SUPPLIERS API ===
export const suppliersApi = {
  async getAll(): Promise<Supplier[]> {
    if (isMockEnabled()) {
      return mockService.suppliers.getAll()
    }
    return []
  },

  async getById(id: string): Promise<Supplier | null> {
    if (isMockEnabled()) {
      return mockService.suppliers.getById(id)
    }
    return null
  },

  async create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    if (isMockEnabled()) {
      return mockService.suppliers.create(supplier)
    }
    throw new Error('Not implemented')
  },

  async update(id: string, data: Partial<Supplier>): Promise<void> {
    if (isMockEnabled()) {
      return mockService.suppliers.update(id, data)
    }
  },

  async delete(id: string): Promise<void> {
    if (isMockEnabled()) {
      return mockService.suppliers.delete(id)
    }
  }
}

// === SPONSORS API ===
export const sponsorsApi = {
  async getAll(): Promise<Sponsor[]> {
    if (isMockEnabled()) {
      return mockService.sponsors.getAll()
    }
    return []
  },

  async getById(id: string): Promise<Sponsor | null> {
    if (isMockEnabled()) {
      return mockService.sponsors.getById(id)
    }
    return null
  },

  async create(sponsor: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sponsor> {
    if (isMockEnabled()) {
      return mockService.sponsors.create(sponsor)
    }
    throw new Error('Not implemented')
  },

  async update(id: string, data: Partial<Sponsor>): Promise<void> {
    if (isMockEnabled()) {
      return mockService.sponsors.update(id, data)
    }
  },

  async delete(id: string): Promise<void> {
    if (isMockEnabled()) {
      return mockService.sponsors.delete(id)
    }
  }
}

// === PROJECTS API ===
export const projectsApi = {
  async getAll(): Promise<Project[]> {
    if (isMockEnabled()) {
      return mockService.projects.getAll()
    }
    return []
  },

  async getById(id: string): Promise<Project | null> {
    if (isMockEnabled()) {
      return mockService.projects.getById(id)
    }
    return null
  },

  async create(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    if (isMockEnabled()) {
      return mockService.projects.create(project)
    }
    throw new Error('Not implemented')
  },

  async update(id: string, data: Partial<Project>): Promise<void> {
    if (isMockEnabled()) {
      return mockService.projects.update(id, data)
    }
  },

  async delete(id: string): Promise<void> {
    if (isMockEnabled()) {
      return mockService.projects.delete(id)
    }
  }
}

// === EVENTS API ===
export const eventsApi = {
  async getAll(): Promise<Event[]> {
    if (isMockEnabled()) {
      return mockService.events.getAll()
    }
    return []
  },

  async getById(id: string): Promise<Event | null> {
    if (isMockEnabled()) {
      return mockService.events.getById(id)
    }
    return null
  },

  async getUpcoming(): Promise<Event[]> {
    if (isMockEnabled()) {
      return mockService.events.getUpcoming()
    }
    return []
  },

  async create(event: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    if (isMockEnabled()) {
      return mockService.events.create(event)
    }
    throw new Error('Not implemented')
  },

  async update(id: string, data: Partial<Event>): Promise<void> {
    if (isMockEnabled()) {
      return mockService.events.update(id, data)
    }
  },

  async delete(id: string): Promise<void> {
    if (isMockEnabled()) {
      return mockService.events.delete(id)
    }
  }
}

// === TRANSACTIONS API ===
export const transactionsApi = {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    if (isMockEnabled()) {
      return mockService.transactions.getAll(filters)
    }
    return []
  },

  async getById(id: string): Promise<Transaction | null> {
    if (isMockEnabled()) {
      return mockService.transactions.getById(id)
    }
    return null
  },

  async getPending(): Promise<Transaction[]> {
    if (isMockEnabled()) {
      return mockService.transactions.getPending()
    }
    return []
  },

  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    if (isMockEnabled()) {
      return mockService.transactions.create(transaction)
    }
    throw new Error('Not implemented')
  },

  async update(id: string, data: Partial<Transaction>): Promise<void> {
    if (isMockEnabled()) {
      return mockService.transactions.update(id, data)
    }
  },

  async delete(id: string): Promise<void> {
    if (isMockEnabled()) {
      return mockService.transactions.delete(id)
    }
  },

  async approve(id: string, approvedBy: string): Promise<void> {
    if (isMockEnabled()) {
      return mockService.transactions.approve(id, approvedBy)
    }
  },

  async reject(id: string): Promise<void> {
    if (isMockEnabled()) {
      return mockService.transactions.reject(id)
    }
  }
}

// === STATISTICS API ===
export const statisticsApi = {
  async getMonthlyStats(year: number, month: number): Promise<PeriodStats> {
    if (isMockEnabled()) {
      return mockService.statistics.getMonthlyStats(year, month)
    }
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
  },

  async getTrendData(months: number): Promise<TrendData[]> {
    if (isMockEnabled()) {
      return mockService.statistics.getTrendData(months)
    }
    return []
  },

  async getCategoryStats(startDate: Date, endDate: Date, type: 'income' | 'expense'): Promise<CategoryStats[]> {
    if (isMockEnabled()) {
      return mockService.statistics.getCategoryStats(startDate, endDate, type)
    }
    return []
  }
}

// === MONTH CLOSINGS API ===
export const monthClosingsApi = {
  async getAll(): Promise<MonthClosing[]> {
    if (isMockEnabled()) {
      return mockService.monthClosings.getAll()
    }
    return []
  },

  async getByMonth(year: number, month: number): Promise<MonthClosing | null> {
    if (isMockEnabled()) {
      return mockService.monthClosings.getByMonth(year, month)
    }
    return null
  },

  async close(year: number, month: number, userId: string): Promise<MonthClosing> {
    if (isMockEnabled()) {
      return mockService.monthClosings.close(year, month, userId)
    }
    throw new Error('Not implemented')
  }
}

// === UNIFIED API ===
export const api = {
  auth: authApi,
  club: clubApi,
  categories: categoriesApi,
  teams: teamsApi,
  employees: employeesApi,
  suppliers: suppliersApi,
  sponsors: sponsorsApi,
  projects: projectsApi,
  events: eventsApi,
  transactions: transactionsApi,
  statistics: statisticsApi,
  monthClosings: monthClosingsApi
}
