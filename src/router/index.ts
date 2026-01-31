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

  // Navigation guard for authentication
  Router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    
    // Public routes that don't require authentication
    const publicRoutes = ['login', 'register', 'forgot-password'];
    const isPublicRoute = publicRoutes.includes(to.name as string);
    
    // If still loading auth state, wait
    if (authStore.loading && !isPublicRoute) {
      // Allow navigation, the auth boot will handle redirect if needed
      next();
      return;
    }
    
    // If not authenticated and trying to access protected route
    if (!authStore.isAuthenticated && !isPublicRoute) {
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }
    
    // If authenticated and trying to access auth pages, redirect to dashboard
    if (authStore.isAuthenticated && isPublicRoute) {
      next({ name: 'dashboard' });
      return;
    }
    
    // Check role-based access
    if (to.meta.requiresManager && !authStore.isManager) {
      next({ name: 'dashboard' });
      return;
    }
    
    if (to.meta.requiresAccountant && !authStore.isAccountant && !authStore.isManager) {
      next({ name: 'dashboard' });
      return;
    }
    
    next();
  });

  return Router;
});
