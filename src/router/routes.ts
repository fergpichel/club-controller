import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // Auth routes (no layout)
  {
    path: '/auth',
    component: () => import('src/layouts/AuthLayout.vue'),
    children: [
      { 
        path: 'login', 
        name: 'login',
        component: () => import('src/pages/auth/LoginPage.vue') 
      },
      { 
        path: 'register', 
        name: 'register',
        component: () => import('src/pages/auth/RegisterPage.vue') 
      },
      { 
        path: 'forgot-password', 
        name: 'forgot-password',
        component: () => import('src/pages/auth/ForgotPasswordPage.vue') 
      }
    ]
  },

  // Main app routes
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // Dashboard
      { 
        path: '', 
        name: 'dashboard',
        component: () => import('src/pages/DashboardPage.vue') 
      },

      // Transactions
      { 
        path: 'transactions', 
        name: 'transactions',
        component: () => import('src/pages/transactions/TransactionsPage.vue') 
      },
      { 
        path: 'transactions/new/:type', 
        name: 'new-transaction',
        component: () => import('src/pages/transactions/TransactionFormPage.vue'),
        props: true
      },
      { 
        path: 'transactions/:id', 
        name: 'transaction-detail',
        component: () => import('src/pages/transactions/TransactionDetailPage.vue'),
        props: true
      },
      { 
        path: 'transactions/:id/edit', 
        name: 'edit-transaction',
        component: () => import('src/pages/transactions/TransactionFormPage.vue'),
        props: true
      },

      // Expenses
      { 
        path: 'expenses', 
        name: 'expenses',
        component: () => import('src/pages/transactions/ExpensesPage.vue')
      },

      // Income
      { 
        path: 'income', 
        name: 'income',
        component: () => import('src/pages/transactions/IncomePage.vue')
      },

      // Pending Approvals
      { 
        path: 'pending', 
        name: 'pending',
        component: () => import('src/pages/transactions/PendingPage.vue'),
        meta: { requiresManager: true }
      },

      // Statistics
      { 
        path: 'statistics', 
        name: 'statistics',
        component: () => import('src/pages/statistics/StatisticsPage.vue')
      },
      { 
        path: 'statistics/category/:id', 
        name: 'category-stats',
        component: () => import('src/pages/statistics/CategoryStatsPage.vue'),
        props: true
      },
      { 
        path: 'statistics/team/:id', 
        name: 'team-stats',
        component: () => import('src/pages/statistics/TeamStatsPage.vue'),
        props: true
      },
      { 
        path: 'statistics/project/:id', 
        name: 'project-stats',
        component: () => import('src/pages/statistics/ProjectStatsPage.vue'),
        props: true
      },

      // Profitability Analysis
      {
        path: 'profitability',
        name: 'profitability',
        component: () => import('src/pages/analysis/ProfitabilityPage.vue'),
        meta: { requiresManager: true }
      },

      // Month Closings
      { 
        path: 'closings', 
        name: 'closings',
        component: () => import('src/pages/closings/MonthClosingsPage.vue'),
        meta: { requiresManager: true }
      },
      { 
        path: 'closings/:year/:month', 
        name: 'closing-detail',
        component: () => import('src/pages/closings/ClosingDetailPage.vue'),
        props: true
      },

      // Accountant View (Gestoría)
      { 
        path: 'accountant', 
        name: 'accountant',
        component: () => import('src/pages/accountant/AccountantPage.vue'),
        meta: { requiresAccountant: true }
      },
      { 
        path: 'accountant/export', 
        name: 'accountant-export',
        component: () => import('src/pages/accountant/ExportPage.vue'),
        meta: { requiresAccountant: true }
      },

      // Teams
      { 
        path: 'teams', 
        name: 'teams',
        component: () => import('src/pages/teams/TeamsPage.vue')
      },
      { 
        path: 'teams/:id', 
        name: 'team-detail',
        component: () => import('src/pages/teams/TeamDetailPage.vue'),
        props: true
      },

      // Projects
      { 
        path: 'projects', 
        name: 'projects',
        component: () => import('src/pages/projects/ProjectsPage.vue')
      },
      { 
        path: 'projects/:id', 
        name: 'project-detail',
        component: () => import('src/pages/projects/ProjectDetailPage.vue'),
        props: true
      },

      // Events
      { 
        path: 'events', 
        name: 'events',
        component: () => import('src/pages/events/EventsPage.vue')
      },
      { 
        path: 'events/:id', 
        name: 'event-detail',
        component: () => import('src/pages/events/EventDetailPage.vue'),
        props: true
      },

      // Categories
      { 
        path: 'categories', 
        name: 'categories',
        component: () => import('src/pages/settings/CategoriesPage.vue'),
        meta: { requiresManager: true }
      },

      // Forecasts
      { 
        path: 'forecasts', 
        name: 'forecasts',
        component: () => import('src/pages/forecasts/ForecastsPage.vue'),
        meta: { requiresManager: true }
      },

      // Settings
      { 
        path: 'settings', 
        name: 'settings',
        component: () => import('src/pages/settings/SettingsPage.vue')
      },
      { 
        path: 'profile', 
        name: 'profile',
        component: () => import('src/pages/settings/ProfilePage.vue')
      }
    ]
  },

  // Catch-all redirect
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/pages/ErrorNotFound.vue')
  }
];

export default routes;
