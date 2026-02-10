<template>
  <div class="app-shell" :class="{ 'nav-expanded': navExpanded, 'is-mobile': isMobile }">
    <!-- Desktop: Rail que se expande/contrae al pasar el ratón (como grooter-stats) -->
    <aside
      v-if="!isMobile"
      class="rail"
      @mouseenter="navExpanded = true"
      @mouseleave="navExpanded = false"
    >
      <div class="rail-header">
        <router-link :to="{ name: 'dashboard' }" class="logo">
          <div class="logo-wrap">
            <img src="/favicon.svg" alt="Teempad Funds" class="logo-img" />
          </div>
          <transition name="fade">
            <div v-if="navExpanded" class="logo-text-wrap">
              <span class="logo-name">Teempad</span>
              <span class="logo-suffix">Funds</span>
            </div>
          </transition>
        </router-link>
      </div>

      <nav class="rail-nav">
        <div class="nav-section">
          <router-link
            v-for="item in visibleMainNavItems"
            :key="item.name"
            :to="item.to"
            class="nav-item"
            :class="{
              active: isActiveRoute(item.name),
              'active-parent': isParentRoute(item.name)
            }"
          >
            <span class="nav-item-icon">
              <q-icon :name="item.icon" size="20px" />
            </span>
            <transition name="fade">
              <span v-if="navExpanded" class="nav-label">{{ item.label }}</span>
            </transition>
            <q-badge
              v-if="item.name === 'statistics' && statsBadgeCount > 0"
              color="negative"
              rounded
              class="nav-badge"
            >
              {{ statsBadgeCount > 9 ? '9+' : statsBadgeCount }}
            </q-badge>
          </router-link>
        </div>

        <div v-if="visibleAdminNavItems.length > 0" class="rail-nav-separator" aria-hidden="true">
          <span v-if="navExpanded" class="rail-nav-separator-label">Gestión</span>
        </div>

        <div v-if="visibleAdminNavItems.length > 0" class="nav-section">
          <router-link
            v-for="item in visibleAdminNavItems"
            :key="item.name"
            :to="item.to"
            class="nav-item"
            :class="{ active: isActiveRoute(item.name) }"
          >
            <span class="nav-item-icon">
              <q-icon :name="item.icon" size="20px" />
            </span>
            <transition name="fade">
              <span v-if="navExpanded" class="nav-label">{{ item.label }}</span>
            </transition>
            <q-badge
              v-if="item.badge && item.badge > 0"
              color="negative"
              rounded
              class="nav-badge"
            >
              {{ item.badge > 9 ? '9+' : item.badge }}
            </q-badge>
          </router-link>
        </div>

        <div v-if="authStore.isAccountant" class="rail-nav-separator" aria-hidden="true">
          <span v-if="navExpanded" class="rail-nav-separator-label">Gestoría</span>
        </div>

        <div v-if="authStore.isAccountant" class="nav-section">
          <router-link
            v-for="item in accountantNavItems"
            :key="item.name"
            :to="item.to"
            class="nav-item"
            :class="{ active: isActiveRoute(item.name) }"
          >
            <span class="nav-item-icon">
              <q-icon :name="item.icon" size="20px" />
            </span>
            <transition name="fade">
              <span v-if="navExpanded" class="nav-label">{{ item.label }}</span>
            </transition>
          </router-link>
        </div>

      </nav>

      <div class="rail-footer">
        <div class="user-block" @click="toggleUserMenu">
          <q-avatar size="28px" class="user-avatar">
            {{ userInitials }}
          </q-avatar>
          <transition name="fade">
            <span v-if="navExpanded" class="user-name">{{ authStore.user?.displayName || 'Usuario' }}</span>
          </transition>
        </div>
      </div>
    </aside>

    <!-- Main Content: QLayout para que QPageContainer y QPage tengan altura correcta -->
    <main ref="mainContentRef" class="main-content" :style="mainContentStyle">
      <q-layout view="hHh lpR fFf" class="main-layout">
      <q-header class="main-header" :class="{ 'header-scrolled': scrolled }">
        <q-toolbar class="header-toolbar">
          <q-btn
            v-if="isMobile"
            flat
            dense
            round
            icon="menu"
            aria-label="Más opciones"
            class="menu-btn"
            @click="showMoreDrawer = true"
          />

          <router-link :to="{ name: 'dashboard' }" class="header-brand">
            <div class="brand-logo">
              <img src="/favicon.svg" alt="" class="brand-logo-img" />
            </div>
            <span class="brand-text">Teempad Funds</span>
          </router-link>

          <q-space />

        <!-- Search -->
        <div v-if="$q.screen.gt.sm" class="header-search" @click="showSearchDialog = true">
          <q-icon name="search" size="18px" />
          <span class="search-placeholder">Buscar transacciones...</span>
          <kbd>⌘K</kbd>
        </div>

        <q-space />

        <!-- Actions -->
        <div class="header-actions">
          <q-btn
            v-if="$q.screen.gt.sm && authStore.canEdit"
            unelevated
            color="primary"
            class="new-transaction-btn"
            no-caps
            @click="showQuickAdd = true"
          >
            <q-icon name="add" size="18px" class="q-mr-xs" />
            Nueva
          </q-btn>

          <q-btn flat round class="action-btn">
            <q-icon :name="notificationsStore.unreadCount > 0 ? 'notifications_active' : 'notifications_none'" size="22px" />
            <q-badge v-if="totalBadgeCount > 0" color="negative" floating rounded>
              {{ totalBadgeCount > 9 ? '9+' : totalBadgeCount }}
            </q-badge>

            <q-menu anchor="bottom right" self="top right" class="notifications-menu">
              <div class="notifications-panel">
                <div class="notifications-header">
                  <span class="notifications-title">Notificaciones</span>
                  <q-btn
                    v-if="notificationsStore.unreadCount > 0"
                    flat
                    dense
                    no-caps
                    size="sm"
                    label="Marcar todas"
                    class="mark-all-btn"
                    @click="notificationsStore.markAllAsRead()"
                  />
                </div>

                <!-- Pending approvals shortcut -->
                <div v-if="authStore.canApprove && pendingCount > 0" class="notification-item notification-pending" @click="goToPending">
                  <q-icon name="pending_actions" size="20px" color="warning" class="q-mr-sm" />
                  <div class="notification-body">
                    <span class="notification-text"><strong>{{ pendingCount }}</strong> transacciones pendientes de aprobación</span>
                  </div>
                  <q-icon name="chevron_right" size="18px" color="grey-6" />
                </div>

                <q-separator v-if="authStore.canApprove && pendingCount > 0 && notificationsStore.recentNotifications.length > 0" />

                <!-- Notification items -->
                <div v-if="notificationsStore.recentNotifications.length > 0" class="notifications-list">
                  <div
                    v-for="n in notificationsStore.recentNotifications"
                    :key="n.id"
                    class="notification-item"
                    :class="{ unread: !n.read }"
                    @click="handleNotificationClick(n)"
                  >
                    <q-icon :name="getNotificationIcon(n.type)" size="20px" :color="getNotificationColor(n.type)" class="q-mr-sm" />
                    <div class="notification-body">
                      <span class="notification-text">{{ n.title }}</span>
                      <span class="notification-time">{{ formatTimeAgo(n.createdAt) }}</span>
                    </div>
                    <div v-if="!n.read" class="unread-dot" />
                  </div>
                </div>

                <!-- Empty state -->
                <div v-else-if="pendingCount === 0" class="notifications-empty">
                  <q-icon name="notifications_off" size="32px" color="grey-6" />
                  <span>Sin notificaciones</span>
                </div>
              </div>
            </q-menu>
          </q-btn>

          <q-btn v-if="isMobile" flat round class="user-btn">
            <q-avatar size="34px" class="user-avatar">
              {{ userInitials }}
            </q-avatar>
            <q-menu anchor="bottom right" self="top right" class="user-menu">
              <div class="user-menu-content">
                <div class="user-menu-header">
                  <q-avatar size="48px" class="user-avatar-lg">
                    {{ userInitials }}
                  </q-avatar>
                  <div class="user-info">
                    <p class="user-name">{{ authStore.user?.displayName || 'Usuario' }}</p>
                    <p class="user-email">{{ authStore.user?.email }}</p>
                  </div>
                </div>
                <q-separator />
                <q-list class="user-menu-list">
                  <q-item v-if="authStore.isSuperAdmin" v-close-popup clickable :to="{ name: 'admin-dashboard' }">
                    <q-item-section avatar><q-icon name="admin_panel_settings" color="purple" /></q-item-section>
                    <q-item-section>Backoffice Admin</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable :to="{ name: 'profile' }">
                    <q-item-section avatar><q-icon name="person_outline" /></q-item-section>
                    <q-item-section>Mi perfil</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable :to="{ name: 'settings' }">
                    <q-item-section avatar><q-icon name="settings" /></q-item-section>
                    <q-item-section>Configuración</q-item-section>
                  </q-item>
                  <q-item v-close-popup clickable @click="toggleDarkMode">
                    <q-item-section avatar>
                      <q-icon :name="$q.dark.isActive ? 'light_mode' : 'dark_mode'" />
                    </q-item-section>
                    <q-item-section>{{ $q.dark.isActive ? 'Modo claro' : 'Modo oscuro' }}</q-item-section>
                  </q-item>
                </q-list>
                <q-separator />
                <div class="user-menu-footer">
                  <q-btn
                    v-close-popup
                    flat
                    color="negative"
                    icon="logout"
                    label="Cerrar sesión"
                    class="full-width"
                    no-caps
                    @click="handleLogout"
                  />
                </div>
              </div>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

      <q-page-container>
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </q-page-container>
      </q-layout>
    </main>

    <!-- Mobile: Bottom navigation (like grooter-stats) -->
    <nav v-if="isMobile" class="bottom-nav" aria-label="Navegación principal">
      <router-link
        v-for="item in primaryNavItems"
        :key="item.name"
        :to="item.to"
        class="bottom-nav-item"
        :class="{ active: isActiveRoute(item.name) }"
      >
        <q-icon :name="item.icon" size="24px" class="bottom-nav-icon" />
        <span class="bottom-nav-label">{{ item.label }}</span>
      </router-link>
      <button
        type="button"
        class="bottom-nav-item bottom-nav-more"
        :class="{ active: showMoreDrawer }"
        aria-label="Más opciones"
        @click="showMoreDrawer = true"
      >
        <q-icon name="menu" size="24px" class="bottom-nav-icon" />
        <span class="bottom-nav-label">Más</span>
      </button>
    </nav>

    <!-- Mobile: Más drawer -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="isMobile && showMoreDrawer" class="more-drawer-overlay" @click.self="closeMoreDrawer">
          <div class="more-drawer" role="dialog" aria-label="Más opciones">
            <div class="more-drawer-header">
              <h2>Más</h2>
              <button type="button" class="close-btn" aria-label="Cerrar" @click="closeMoreDrawer">
                <q-icon name="close" size="22px" />
              </button>
            </div>
            <nav class="more-drawer-nav">
              <router-link
                v-for="item in secondaryNavItems"
                :key="item.name"
                :to="item.to"
                class="more-drawer-item"
                @click="closeMoreDrawer"
              >
                <q-icon :name="item.icon" size="22px" />
                <span>{{ item.label }}</span>
              </router-link>
              <button type="button" class="more-drawer-item more-drawer-account" @click="openUserMenuAndCloseDrawer">
                <q-icon name="person_outline" size="22px" />
                <span>Cuenta y Ajustes</span>
              </button>
            </nav>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- User Menu (desktop: from rail; mobile: from header or Más) - keep existing q-menu in header for mobile; desktop needs a Teleport popup -->
    <Teleport to="body">
      <transition name="slide-up">
        <div v-if="showUserMenuPopup" class="user-menu-overlay" @click.self="showUserMenuPopup = false">
          <div class="user-menu-popup">
            <div class="user-menu-header">
              <q-avatar size="48px" class="user-avatar-lg">
                {{ userInitials }}
              </q-avatar>
              <div class="user-info">
                <p class="user-name">{{ authStore.user?.displayName || 'Usuario' }}</p>
                <p class="user-email">{{ authStore.user?.email }}</p>
              </div>
            </div>
            <div class="user-menu-actions">
              <router-link
                v-if="authStore.isSuperAdmin"
                :to="{ name: 'admin-dashboard' }"
                class="user-menu-item admin-link"
                @click="showUserMenuPopup = false"
              >
                <q-icon name="admin_panel_settings" size="20px" />
                <span>Backoffice Admin</span>
              </router-link>
              <router-link :to="{ name: 'settings' }" class="user-menu-item" @click="showUserMenuPopup = false">
                <q-icon name="settings" size="20px" />
                <span>Configuración</span>
              </router-link>
              <router-link :to="{ name: 'profile' }" class="user-menu-item" @click="showUserMenuPopup = false">
                <q-icon name="person_outline" size="20px" />
                <span>Mi perfil</span>
              </router-link>
              <button class="user-menu-item" @click="toggleDarkMode">
                <q-icon :name="$q.dark.isActive ? 'light_mode' : 'dark_mode'" size="20px" />
                <span>{{ $q.dark.isActive ? 'Modo claro' : 'Modo oscuro' }}</span>
              </button>
              <button class="user-menu-item logout" @click="handleLogout">
                <q-icon name="logout" size="20px" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- FAB Mobile -->
    <transition name="fab-scale">
      <div v-if="isMobile && authStore.canEdit && !fabHidden" class="fab-wrapper">
        <q-btn
          fab
          color="primary"
          icon="add"
          class="main-fab"
          @click="showQuickAdd = true"
        />
      </div>
    </transition>

    <!-- Quick Add Dialog -->
    <q-dialog v-model="showQuickAdd" position="bottom">
      <q-card class="quick-add-card">
        <div class="quick-add-handle"></div>
        <q-card-section class="quick-add-header">
          <h3>Nueva transacción</h3>
          <p>¿Qué deseas registrar?</p>
        </q-card-section>
        <q-card-section class="quick-add-body">
          <div class="quick-add-options">
            <button class="quick-option income" @click="goToNewTransaction('income')">
              <div class="option-icon"><q-icon name="trending_up" size="28px" /></div>
              <span class="option-label">Ingreso</span>
              <span class="option-desc">Entrada de dinero</span>
            </button>
            <button class="quick-option expense" @click="goToNewTransaction('expense')">
              <div class="option-icon"><q-icon name="trending_down" size="28px" /></div>
              <span class="option-label">Gasto</span>
              <span class="option-desc">Salida de dinero</span>
            </button>
          </div>
        </q-card-section>
        <q-card-section class="quick-add-footer">
          <q-btn v-close-popup flat label="Cancelar" class="full-width" no-caps />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Search Dialog -->
    <q-dialog v-model="showSearchDialog" position="top" class="search-dialog">
      <q-card class="search-card">
        <q-card-section class="search-input-section">
          <q-icon name="search" size="24px" class="search-icon" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por descripción, categoría, equipo..."
            class="search-input"
            @keydown.esc="showSearchDialog = false"
            @keydown.enter="goToSelectedResult"
            @keydown.down.prevent="selectNextResult"
            @keydown.up.prevent="selectPrevResult"
          />
          <q-btn v-if="searchQuery" flat round dense icon="close" size="sm" @click="searchQuery = ''" />
        </q-card-section>
        
        <q-separator />
        
        <q-card-section class="search-results-section">
          <div v-if="searchLoading" class="search-loading">
            <q-spinner-dots size="32px" color="primary" />
            <span>Cargando transacciones...</span>
          </div>
          
          <div v-else-if="searchQuery.length < 2" class="search-hint">
            <q-icon name="lightbulb" size="20px" />
            <span>Escribe al menos 2 caracteres para buscar</span>
          </div>
          
          <div v-else-if="searchResults.length === 0" class="search-empty">
            <q-icon name="search_off" size="32px" />
            <span>No se encontraron resultados para "{{ searchQuery }}"</span>
          </div>
          
          <div v-else class="search-results">
            <p class="results-count">{{ searchResults.length }} resultado{{ searchResults.length !== 1 ? 's' : '' }}</p>
            <q-list>
              <q-item
                v-for="(result, index) in searchResults.slice(0, 10)"
                :key="result.id"
                clickable
                :class="{ 'result-selected': index === selectedResultIndex }"
                @click="goToTransaction(result.id)"
              >
                <q-item-section avatar>
                  <q-avatar
                    :color="result.type === 'income' ? 'positive' : 'negative'"
                    text-color="white"
                    size="36px"
                  >
                    <q-icon :name="result.type === 'income' ? 'trending_up' : 'trending_down'" size="18px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ result.description }}</q-item-label>
                  <q-item-label caption>
                    {{ result.categoryName }} · {{ formatDateShort(result.date) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label :class="result.type === 'income' ? 'text-positive' : 'text-negative'">
                    {{ result.type === 'income' ? '+' : '-' }}{{ formatCurrency(result.amount) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <p v-if="searchResults.length > 10" class="results-more">
              Y {{ searchResults.length - 10 }} más...
            </p>
          </div>
        </q-card-section>
        
        <q-separator />
        
        <q-card-section class="search-footer">
          <div class="search-shortcuts">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navegar</span>
            <span><kbd>↵</kbd> Abrir</span>
            <span><kbd>Esc</kbd> Cerrar</span>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useDebounceFn } from '@vueuse/core'
import { useAuthStore } from 'src/stores/auth'
import { useTransactionsStore } from 'src/stores/transactions'
import { useCategoriesStore } from 'src/stores/categories'
import { useTeamsStore } from 'src/stores/teams'
import { useCatalogsStore } from 'src/stores/catalogs'
import { useNotificationsStore } from 'src/stores/notifications'
import { useSessionTimeout } from 'src/composables/useSessionTimeout'
import type { Transaction, Notification } from 'src/types'
import { formatCurrency, formatDateShort } from 'src/utils/formatters'
import { logger } from 'src/utils/logger'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()
const teamsStore = useTeamsStore()
const catalogsStore = useCatalogsStore()
const notificationsStore = useNotificationsStore()

// Auto-logout after 30 min of inactivity
useSessionTimeout()

const isMobile = computed(() => $q.screen.lt.md)
const navExpanded = ref(false)
const showMoreDrawer = ref(false)
const showUserMenuPopup = ref(false)
const showQuickAdd = ref(false)
const showSearchDialog = ref(false)
const searchQuery = ref('')
const selectedResultIndex = ref(0)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchLoading = ref(false)
const scrolled = ref(false)
const fabHidden = ref(false)
const mainContentRef = ref<HTMLElement | null>(null)
let pageContainerEl: HTMLElement | null = null

// Nav items
const mainNavItems = [
  { name: 'dashboard', icon: 'dashboard', label: 'Dashboard', to: { name: 'dashboard' } },
  { name: 'transactions', icon: 'receipt_long', label: 'Transacciones', to: { name: 'transactions' } },
  { name: 'expenses', icon: 'trending_down', label: 'Gastos', to: { name: 'expenses' } },
  { name: 'income', icon: 'trending_up', label: 'Ingresos', to: { name: 'income' } },
  { name: 'statistics', icon: 'bar_chart', label: 'Estadísticas', to: { name: 'statistics' } }
]

// For employees: hide statistics (they can only see own transactions)
const visibleMainNavItems = computed(() => {
  if (authStore.isEmployee) {
    return mainNavItems.filter(i => i.name !== 'statistics')
  }
  return mainNavItems
})

// Admin section — items shown based on permissions
const visibleAdminNavItems = computed(() => {
  const items: { name: string; icon: string; label: string; to: { name: string }; badge?: number }[] = []

  // Pending approvals — admin, manager, controller
  if (authStore.canApprove) {
    items.push({ name: 'pending', icon: 'pending_actions', label: 'Pendientes', to: { name: 'pending' }, badge: pendingCount.value })
  }

  // Treasury, profitability, forecasts — anyone who can view stats (not employee)
  if (authStore.canViewStats) {
    items.push({ name: 'financial-overview', icon: 'query_stats', label: 'Cuadro Mando', to: { name: 'financial-overview' } })
    items.push({ name: 'treasury', icon: 'show_chart', label: 'Tesorería', to: { name: 'treasury' } })
    items.push({ name: 'profitability', icon: 'account_balance_wallet', label: 'Rentabilidad', to: { name: 'profitability' } })
    items.push({ name: 'forecasts', icon: 'analytics', label: 'Previsiones', to: { name: 'forecasts' } })
  }

  // Closings — admin, controller
  if (authStore.canDoClosings) {
    items.push({ name: 'closings', icon: 'lock', label: 'Cierres', to: { name: 'closings' } })
  }

  // Settings — always visible (profile at minimum), but full settings only for admin/manager
  items.push({ name: 'settings', icon: 'settings', label: 'Ajustes', to: { name: 'settings' } })

  return items
})

const accountantNavItems = [
  { name: 'accountant', icon: 'account_balance', label: 'Gestoría', to: { name: 'accountant' } },
  { name: 'accountant-export', icon: 'download', label: 'Exportar', to: { name: 'accountant-export' } }
]

// Badge para Estadísticas (ej. notificaciones o avisos)
const statsBadgeCount = computed(() => 0)

// Mobile bottom nav: 4 primary items + "Más"
const primaryNavItems = computed(() => [
  { name: 'dashboard', icon: 'dashboard', label: 'Inicio', to: { name: 'dashboard' } },
  { name: 'expenses', icon: 'trending_down', label: 'Gastos', to: { name: 'expenses' } },
  { name: 'income', icon: 'trending_up', label: 'Ingresos', to: { name: 'income' } }
])

// Mobile "Más" drawer: secondary nav + Cuenta
const secondaryNavItems = computed(() => {
  const items: { name: string; icon: string; label: string; to: { name: string } }[] = [
    { name: 'transactions', icon: 'receipt_long', label: 'Transacciones', to: { name: 'transactions' } }
  ]
  if (authStore.canViewStats) {
    items.push({ name: 'statistics', icon: 'bar_chart', label: 'Estadísticas', to: { name: 'statistics' } })
  }
  if (authStore.canApprove) {
    items.push({ name: 'pending', icon: 'pending_actions', label: 'Pendientes', to: { name: 'pending' } })
  }
  items.push({ name: 'settings', icon: 'settings', label: 'Ajustes', to: { name: 'settings' } })
  return items
})

const mainContentStyle = computed(() => ({
  marginLeft: isMobile.value ? '0' : (navExpanded.value ? '200px' : '60px')
}))

// Computed
const userInitials = computed(() => {
  const name = authStore.user?.displayName || 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const pendingCount = computed(() => transactionsStore.pendingTransactions.length)
const totalBadgeCount = computed(() => {
  const notifUnread = notificationsStore.unreadCount
  const pending = authStore.canApprove ? pendingCount.value : 0
  return notifUnread + pending
})

// Notification helpers
function getNotificationIcon(type: Notification['type']): string {
  const icons: Record<Notification['type'], string> = {
    transaction_created: 'add_circle',
    transaction_approved: 'check_circle',
    transaction_rejected: 'cancel',
    month_closed: 'lock',
    reminder: 'schedule'
  }
  return icons[type] || 'notifications'
}

function getNotificationColor(type: Notification['type']): string {
  const colors: Record<Notification['type'], string> = {
    transaction_created: 'info',
    transaction_approved: 'positive',
    transaction_rejected: 'negative',
    month_closed: 'primary',
    reminder: 'warning'
  }
  return colors[type] || 'grey'
}

function formatTimeAgo(date: Date | string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `hace ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `hace ${diffD}d`
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function handleNotificationClick(n: Notification) {
  if (!n.read) notificationsStore.markAsRead(n.id)
  if (n.link) router.push(n.link)
}

function goToPending() {
  router.push({ name: 'pending' })
}

// Search functionality — server-side via searchKeywords
const searchResults = ref<(Transaction & { categoryName: string; teamName?: string })[]>([])

async function performSearch(query: string) {
  if (query.length < 2) {
    searchResults.value = []
    return
  }
  
  searchLoading.value = true
  try {
    // Fetch from Firebase using searchQuery filter
    await transactionsStore.fetchTransactions({ searchQuery: query })
    
    // Map results with category/team names
    searchResults.value = transactionsStore.transactions
      .map(t => ({
        ...t,
        categoryName: categoriesStore.getCategoryById(t.categoryId)?.name || 'Sin categoría',
        teamName: t.teamId ? teamsStore.getTeamById(t.teamId)?.name : undefined
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (e) {
    logger.error('Search error:', e)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

const debouncedSearch = useDebounceFn((q: string) => performSearch(q), 300)

// Watch for search dialog open/close
watch(showSearchDialog, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 100)
  } else {
    searchQuery.value = ''
    searchResults.value = []
    selectedResultIndex.value = 0
    // Restore the main transaction list (no filters)
    transactionsStore.fetchTransactions({})
  }
})

// Watch search query — debounced server-side search
watch(searchQuery, (newVal) => {
  selectedResultIndex.value = 0
  if (newVal.length < 2) {
    searchResults.value = []
    return
  }
  debouncedSearch(newVal)
})

// Keyboard shortcut for search
function handleKeyboardShortcut(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    showSearchDialog.value = true
  }
}

function goToTransaction(id: string) {
  showSearchDialog.value = false
  router.push({ name: 'transaction-detail', params: { id } })
}

function goToSelectedResult() {
  if (searchResults.value.length > 0 && selectedResultIndex.value < searchResults.value.length) {
    goToTransaction(searchResults.value[selectedResultIndex.value].id)
  }
}

function selectNextResult() {
  const maxIndex = Math.min(searchResults.value.length - 1, 9)
  if (selectedResultIndex.value < maxIndex) {
    selectedResultIndex.value++
  }
}

function selectPrevResult() {
  if (selectedResultIndex.value > 0) {
    selectedResultIndex.value--
  }
}

// Methods
function closeMoreDrawer() {
  showMoreDrawer.value = false
}

function openUserMenuAndCloseDrawer() {
  showMoreDrawer.value = false
  showUserMenuPopup.value = true
}

function toggleUserMenu() {
  showUserMenuPopup.value = !showUserMenuPopup.value
}

function isActiveRoute(name: string): boolean {
  return route.name === name
}

// Padre activo: resaltar en azul cuando la ruta actual es hija (ej. Transacciones en azul en Gastos/Ingresos)
function isParentRoute(name: string): boolean {
  if (route.name === name) return false
  const r = route.name as string
  if (name === 'transactions') {
    return ['transactions', 'expenses', 'income', 'transaction-detail', 'new-transaction'].includes(r)
  }
  return false
}

function goToNewTransaction(type: 'income' | 'expense') {
  showQuickAdd.value = false
  router.push({ name: 'new-transaction', params: { type } })
}

function toggleDarkMode() {
  $q.dark.toggle()
  localStorage.setItem('darkMode', $q.dark.isActive.toString())
}

async function handleLogout() {
  showUserMenuPopup.value = false
  notificationsStore.stop()
  await authStore.logout()
  router.push({ name: 'login' })
}

// Scroll handler (scroll ocurre en .q-page-container, no en window)
let lastScrollTop = 0
function handleScroll() {
  const st = window.scrollY
  scrolled.value = st > 10
  fabHidden.value = st > lastScrollTop && st > 100
  lastScrollTop = st
}

function handlePageContainerScroll(e: Event) {
  const el = e.target as HTMLElement
  const st = el.scrollTop
  scrolled.value = st > 10
  fabHidden.value = st > lastScrollTop && st > 100
  lastScrollTop = st
}

watch(() => route.name, () => {
  if (isMobile.value) showMoreDrawer.value = false
})

async function loadData() {
  if (authStore.isAuthenticated) {
    // Start real-time notifications listener
    notificationsStore.subscribe()

    await Promise.all([
      categoriesStore.fetchCategories(),
      teamsStore.fetchAll(),
      catalogsStore.fetchAll(),
      transactionsStore.fetchTransactions({})
    ])
  }
}

onMounted(async () => {
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode !== null) {
    $q.dark.set(savedDarkMode === 'true')
  } else {
    $q.dark.set(true) // Default to dark mode
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', handleKeyboardShortcut)

  await loadData()

  // Scroll real ocurre en .q-page-container; escuchar ahí para header/FAB
  await nextTick()
  const container = mainContentRef.value?.querySelector('.q-page-container')
  if (container instanceof HTMLElement) {
    pageContainerEl = container
    pageContainerEl.addEventListener('scroll', handlePageContainerScroll, { passive: true })
  }
})

// Watch for auth changes (e.g. after registration redirect)
watch(() => authStore.isAuthenticated, async (isAuth) => {
  if (isAuth && transactionsStore.transactions.length === 0) {
    await loadData()
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeyboardShortcut)
  if (pageContainerEl) {
    pageContainerEl.removeEventListener('scroll', handlePageContainerScroll)
  }
})
</script>

<style lang="scss" scoped>
// === HEADER ===
.main-header {
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-light);
  transition: all var(--duration-fast) var(--ease-out);

  &.header-scrolled {
    box-shadow: var(--shadow-sm);
  }
}

.header-toolbar {
  min-height: 64px;
  padding: 0 var(--space-4);
  gap: var(--space-4);

  @media (min-width: 1024px) {
    padding: 0 var(--space-6);
  }
}

.menu-btn {
  color: var(--color-text-secondary);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;

  .brand-logo {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .brand-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .brand-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
  }
}

.header-search {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-4);
  width: 100%;
  max-width: 320px;
  transition: all var(--duration-fast) var(--ease-out);

  &:focus-within {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1);
  }

  .q-icon {
    color: var(--color-text-tertiary);
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.875rem;
    font-family: inherit;
    color: var(--color-text-primary);
    outline: none;

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  kbd {
    font-family: inherit;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--color-text-muted);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 2px 6px;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.new-transaction-btn {
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  font-weight: 600;
}

.action-btn {
  color: var(--color-text-secondary);
  
  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
}

// === NOTIFICATIONS PANEL ===
.notifications-menu {
  margin-top: var(--space-2);
}

.notifications-panel {
  width: 360px;
  max-height: 480px;
  overflow-y: auto;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
}

.notifications-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);

  .notifications-title {
    font-weight: 700;
    font-size: 0.9375rem;
    color: var(--color-text-primary);
  }

  .mark-all-btn {
    font-size: 0.75rem;
    color: var(--color-accent);
  }
}

.notifications-list {
  padding: var(--space-1) 0;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-5);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-tertiary);
  }

  &.unread {
    background: rgba(99, 91, 255, 0.04);
  }

  &.notification-pending {
    background: rgba(255, 181, 69, 0.06);
  }

  .notification-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .notification-text {
    font-size: 0.8125rem;
    color: var(--color-text-primary);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .notification-time {
    font-size: 0.6875rem;
    color: var(--color-text-muted);
  }

  .unread-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
    margin-left: var(--space-2);
  }
}

.notifications-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-8);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.user-avatar {
  background: var(--gradient-accent);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
}

.user-avatar-lg {
  background: var(--gradient-accent);
  color: white;
  font-size: 1rem;
  font-weight: 700;
}

// === USER MENU ===
.user-menu {
  margin-top: var(--space-2);
}

.user-menu-content {
  width: 280px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.user-menu-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-tertiary);
}

.user-info {
  flex: 1;
  min-width: 0;

  .user-name {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--color-text-primary);
    margin: 0;
  }

  .user-email {
    font-size: 0.8125rem;
    color: var(--color-text-tertiary);
    margin: var(--space-1) 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.user-menu-list {
  padding: var(--space-2);

  .q-item {
    border-radius: var(--radius-md);
    min-height: 42px;
    font-size: 0.875rem;
  }
}

.user-menu-footer {
  padding: var(--space-3);
}

// === APP SHELL (rail + main) ===
.app-shell {
  display: flex;
  min-height: 100vh;
  height: 100vh;
  background: var(--color-bg-primary);
}

.main-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* QLayout interno: debe llenar main para que QPageContainer funcione */
.main-content .main-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Área de página scrollable: ocupa el espacio restante y hace scroll */
.main-content :deep(.q-page-container) {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.app-shell.is-mobile .main-content {
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
}

// === RAIL (desktop: 60px contraído, 200px expandido al hover - como grooter-stats) ===
.rail {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 60px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  z-index: 100;
  overflow: hidden;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  will-change: width;
}

.nav-expanded .rail {
  width: 200px;
}

.rail-header {
  height: 60px;
  min-height: 60px;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.rail .logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: inherit;
}

.rail .logo-wrap {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rail .logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.rail .logo-text-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
  white-space: nowrap;
}

.rail .logo-name {
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.rail .logo-suffix {
  font-weight: 600;
  font-size: 0.8125rem;
  letter-spacing: -0.02em;
  color: var(--color-accent);
}

.rail-nav {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: var(--space-2);
  gap: var(--space-2);
  overflow-y: auto;
  overflow-x: hidden;
}

.rail-nav-separator {
  flex-shrink: 0;
  margin: var(--space-2) var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
  min-height: 0;
}

.rail-nav-separator-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin-top: -0.25rem;
  margin-bottom: var(--space-1);
  padding-left: var(--space-1);
}

.rail .nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rail .nav-item {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-3);
  height: 44px;
  min-height: 44px;
  max-height: 44px;
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
  text-decoration: none;
  transition: all var(--duration-fast) var(--ease-out);
  cursor: pointer;
  position: relative;
  box-sizing: border-box;
}

.rail .nav-item-icon {
  width: 20px;
  min-width: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.rail .nav-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.rail .nav-item.active {
  background: rgba(99, 91, 255, 0.12);
  color: var(--color-text-primary);
}

.rail .nav-item.active .nav-label {
  font-weight: 600;
}

.rail .nav-item.active-parent {
  color: var(--color-accent);
}

.rail .nav-item.active-parent .nav-label {
  font-weight: 500;
}

.rail .nav-label {
  flex: 1;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8125rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.rail .nav-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 0.6875rem;
  font-weight: 700;
}

/* Contraído: badge sobre el icono para no provocar salto al expandir */
.app-shell:not(.nav-expanded) .rail .nav-item {
  position: relative;
}

.app-shell:not(.nav-expanded) .rail .nav-badge {
  position: absolute;
  top: 4px;
  left: 20px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 0.625rem;
}

.rail-footer {
  flex-shrink: 0;
  padding: var(--space-2);
  border-top: 1px solid var(--color-border);
  box-sizing: border-box;
}

.rail .user-block {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out);
}

.rail .user-block:hover {
  background: var(--color-bg-tertiary);
}

.rail .user-avatar {
  background: var(--gradient-accent);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.rail .user-name {
  flex: 1;
  min-width: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// === BOTTOM NAV (mobile, like grooter-stats) ===
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  min-height: 64px;
  padding-bottom: env(safe-area-inset-bottom, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
  z-index: 90;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
}

.bottom-nav-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
  min-height: 48px;
  padding: 8px 4px;
  color: var(--color-text-muted);
  text-decoration: none;
  background: none;
  border: none;
  font: inherit;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav-item:hover {
  color: var(--color-text-primary);
}

.bottom-nav-item.active {
  color: var(--color-accent);
}

.bottom-nav-icon {
  flex-shrink: 0;
}

.bottom-nav-label {
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (min-width: 360px) {
  .bottom-nav-label {
    font-size: 0.75rem;
  }
}

// === MÁS DRAWER (mobile) ===
.more-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.more-drawer {
  width: 100%;
  max-height: 70vh;
  background: var(--color-bg-secondary);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.2);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.more-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.more-drawer-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.more-drawer-nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  max-height: 60vh;
  overflow-y: auto;
}

.more-drawer-item {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 48px;
  padding: 14px 20px;
  color: var(--color-text-primary);
  text-decoration: none;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
}

.more-drawer-item:hover,
.more-drawer-item:focus-visible {
  background: var(--color-bg-tertiary);
}

.more-drawer-account {
  margin-top: 8px;
  border-top: 1px solid var(--color-border);
  color: var(--color-accent);
}

// === USER MENU POPUP (desktop rail + mobile from "Cuenta y Ajustes") ===
.user-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.user-menu-popup {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 320px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.user-menu-popup .user-menu-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}

.user-menu-popup .user-info {
  flex: 1;
  min-width: 0;
}

.user-menu-popup .user-name {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
}

.user-menu-popup .user-email {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu-actions {
  padding: var(--space-2);
}

.user-menu-popup .user-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  text-decoration: none;
}

.user-menu-popup .user-menu-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.user-menu-popup .user-menu-item.logout {
  color: var(--color-danger);
}

.user-menu-popup .user-menu-item.admin-link {
  color: #a855f7;
}

.user-menu-popup .user-menu-item.admin-link:hover {
  background: rgba(124, 58, 237, 0.1);
}

.user-menu-popup .user-menu-item.logout:hover {
  background: var(--color-danger-bg);
}

.more-drawer-header .close-btn {
  padding: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-drawer-header .close-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-active .more-drawer,
.drawer-leave-active .more-drawer {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .more-drawer,
.drawer-leave-to .more-drawer {
  transform: translateY(100%);
}

// === QUICK ADD ===
.quick-add-card {
  width: 100%;
  max-width: 440px;
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0 !important;
  background: var(--color-bg-elevated);

  @media (min-width: 600px) {
    border-radius: var(--radius-2xl) !important;
    margin: var(--space-4);
  }
}

.quick-add-handle {
  width: 36px;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  margin: var(--space-3) auto 0;

  @media (min-width: 600px) {
    display: none;
  }
}

.quick-add-header {
  text-align: center;
  padding: var(--space-5) var(--space-6) 0;

  h3 {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
  }

  p {
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
    margin: var(--space-1) 0 0;
  }
}

.quick-add-body {
  padding: var(--space-5) var(--space-6);
}

.quick-add-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.quick-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  border-radius: var(--radius-xl);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  background: none;

  .option-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .option-label {
    font-size: 1rem;
    font-weight: 700;
  }

  .option-desc {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  &.income {
    background: var(--color-success-bg);
    color: var(--color-success);

    .option-icon {
      background: var(--color-success);
      color: white;
    }

    &:hover {
      border-color: var(--color-success);
      transform: scale(1.02);
    }
  }

  &.expense {
    background: var(--color-danger-bg);
    color: var(--color-danger);

    .option-icon {
      background: var(--color-danger);
      color: white;
    }

    &:hover {
      border-color: var(--color-danger);
      transform: scale(1.02);
    }
  }
}

.quick-add-footer {
  padding: 0 var(--space-6) var(--space-6);
}

// === PAGE TRANSITIONS ===
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

// === FAB ===
.fab-wrapper {
  position: fixed;
  bottom: calc(72px + env(safe-area-inset-bottom));
  right: var(--space-4);
  z-index: 1000;
}

.fab-scale-enter-active,
.fab-scale-leave-active {
  transition: all var(--duration-normal) var(--ease-out);
}

.fab-scale-enter-from,
.fab-scale-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

// === SEARCH DIALOG ===
.header-search {
  cursor: pointer;
  
  .search-placeholder {
    flex: 1;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }
}

.search-card {
  width: 100%;
  max-width: 560px;
  margin-top: var(--space-4);
  border-radius: var(--radius-xl) !important;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xl);
}

.search-input-section {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  
  .search-icon {
    color: var(--color-text-tertiary);
  }
  
  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 1.0625rem;
    font-family: inherit;
    color: var(--color-text-primary);
    outline: none;
    
    &::placeholder {
      color: var(--color-text-muted);
    }
  }
}

.search-results-section {
  max-height: 400px;
  overflow-y: auto;
  padding: 0;
}

.search-hint,
.search-empty,
.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-tertiary);
  
  .q-icon {
    opacity: 0.5;
  }
}

.search-results {
  .results-count {
    padding: var(--space-3) var(--space-5);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .q-item {
    padding: var(--space-3) var(--space-5);
    transition: background var(--duration-fast) var(--ease-out);
    
    &:hover,
    &.result-selected {
      background: var(--color-bg-tertiary);
    }
    
    .q-item__label {
      font-weight: 500;
    }
    
    .q-item__label--caption {
      font-size: 0.8125rem;
      color: var(--color-text-tertiary);
    }
  }
  
  .results-more {
    padding: var(--space-3) var(--space-5);
    text-align: center;
    font-size: 0.8125rem;
    color: var(--color-text-tertiary);
  }
}

.search-footer {
  padding: var(--space-3) var(--space-5);
  background: var(--color-bg-tertiary);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
}

.search-shortcuts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  
  span {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }
  
  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    font-family: inherit;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0 6px;
  }
}
</style>
