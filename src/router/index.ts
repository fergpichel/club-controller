import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'src/stores/auth';

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Navigation guard for authentication & authorization
  Router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    
    // Public routes that don't require authentication
    const publicRoutes = ['login', 'register', 'forgot-password'];
    const isPublicRoute = publicRoutes.includes(to.name as string);
    const isSetupRoute = to.name === 'setup';
    
    // If still loading auth state, allow
    if (authStore.loading && !isPublicRoute) {
      next();
      return;
    }
    
    // Not authenticated → redirect to login (unless public or setup)
    if (!authStore.isAuthenticated && !isPublicRoute && !isSetupRoute) {
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }
    
    // Authenticated but needs setup (no club) → redirect to setup wizard
    if (authStore.needsSetup && !isSetupRoute) {
      next({ name: 'setup' });
      return;
    }

    // Already has a club, don't allow going back to setup
    if (authStore.isAuthenticated && !authStore.needsSetup && isSetupRoute) {
      next({ name: 'dashboard' });
      return;
    }
    
    // Authenticated trying to access auth pages → dashboard
    if (authStore.isAuthenticated && !authStore.needsSetup && isPublicRoute) {
      next({ name: 'dashboard' });
      return;
    }
    
    // Role-based access checks
    if (to.meta.requiresSettings && !authStore.canManageSettings) {
      next({ name: 'dashboard' });
      return;
    }

    if (to.meta.requiresClosings && !authStore.canDoClosings) {
      next({ name: 'dashboard' });
      return;
    }

    // requiresManager: admin, manager, controller, editor (everyone who can see all data)
    if (to.meta.requiresManager && !authStore.canViewAll) {
      next({ name: 'dashboard' });
      return;
    }
    
    if (to.meta.requiresAccountant && !authStore.isAccountant && !authStore.canViewAll) {
      next({ name: 'dashboard' });
      return;
    }

    // Employee can only access: dashboard (their own), transactions, new-transaction, transaction-detail, edit-transaction, settings (profile)
    if (authStore.isEmployee) {
      const employeeAllowed = [
        'dashboard', 'transactions', 'new-transaction',
        'transaction-detail', 'edit-transaction',
        'expenses', 'income', 'settings', 'profile'
      ];
      if (!employeeAllowed.includes(to.name as string)) {
        next({ name: 'dashboard' });
        return;
      }
    }
    
    next();
  });

  return Router;
});
