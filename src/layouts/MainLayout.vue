<template>
  <q-layout view="lHh LpR fFf">
    <!-- Header -->
    <q-header class="main-header" :class="{ 'header-scrolled': scrolled }">
      <q-toolbar class="header-toolbar">
        <q-btn
          v-if="$q.screen.lt.md"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="menu-btn"
          @click="toggleLeftDrawer"
        />

        <router-link :to="{ name: 'dashboard' }" class="header-brand">
          <div class="brand-logo">
            <q-icon name="sports_soccer" size="22px" />
          </div>
          <span v-if="$q.screen.gt.xs" class="brand-text">Club Controller</span>
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
            <q-icon name="notifications_none" size="22px" />
            <q-badge v-if="pendingCount > 0" color="negative" floating rounded>
              {{ pendingCount > 9 ? '9+' : pendingCount }}
            </q-badge>
          </q-btn>

          <q-btn flat round class="user-btn">
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

    <!-- Sidebar -->
    <q-drawer
      v-model="leftDrawerOpen"
      :mini="miniState"
      :width="260"
      :mini-width="72"
      :breakpoint="1024"
      class="main-drawer"
      :behavior="$q.screen.lt.md ? 'mobile' : 'desktop'"
    >
      <q-scroll-area class="fit drawer-scroll">
        <div class="drawer-content">
          <!-- Logo mini -->
          <div v-if="miniState && $q.screen.gt.sm" class="drawer-logo-mini">
            <div class="logo-mini">
              <q-icon name="sports_soccer" size="22px" />
            </div>
          </div>

          <!-- Navigation -->
          <nav class="nav-sections">
            <div class="nav-section">
              <p v-if="!miniState || $q.screen.lt.md" class="nav-section-title">Principal</p>
              <NavItem v-for="item in mainNavItems" :key="item.name" :item="item" :mini="miniState && $q.screen.gt.sm" />
            </div>

            <div class="nav-section">
              <p v-if="!miniState || $q.screen.lt.md" class="nav-section-title">Gestión</p>
              <NavItem v-for="item in managementNavItems" :key="item.name" :item="item" :mini="miniState && $q.screen.gt.sm" />
            </div>

            <div v-if="authStore.isManager" class="nav-section">
              <p v-if="!miniState || $q.screen.lt.md" class="nav-section-title">Admin</p>
              <NavItem v-for="item in adminNavItems" :key="item.name" :item="item" :mini="miniState && $q.screen.gt.sm" />
            </div>

            <div v-if="authStore.isAccountant" class="nav-section">
              <p v-if="!miniState || $q.screen.lt.md" class="nav-section-title">Gestoría</p>
              <NavItem v-for="item in accountantNavItems" :key="item.name" :item="item" :mini="miniState && $q.screen.gt.sm" />
            </div>
          </nav>
        </div>
      </q-scroll-area>

      <!-- Toggle -->
      <div v-if="$q.screen.gt.sm" class="drawer-toggle">
        <q-btn
          flat
          round
          dense
          size="sm"
          :icon="miniState ? 'chevron_right' : 'chevron_left'"
          class="toggle-btn"
          @click="miniState = !miniState"
        />
      </div>
    </q-drawer>

    <!-- Page -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- Mobile Nav -->
    <q-footer v-if="$q.screen.lt.md" class="mobile-nav">
      <nav class="nav-container">
        <router-link
          v-for="item in mobileNavItems"
          :key="item.name"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActiveRoute(item.name) }"
        >
          <q-icon :name="item.icon" />
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
    </q-footer>

    <!-- FAB Mobile -->
    <transition name="fab-scale">
      <div v-if="$q.screen.lt.md && authStore.canEdit && !fabHidden" class="fab-wrapper">
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
                    {{ result.categoryName }} · {{ formatDate(result.date) }}
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
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useTransactionsStore } from 'src/stores/transactions'
import { useCategoriesStore } from 'src/stores/categories'
import { useTeamsStore } from 'src/stores/teams'
import NavItem from 'src/components/NavItem.vue'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()
const teamsStore = useTeamsStore()

const leftDrawerOpen = ref(true)  // Default to open for desktop
const miniState = ref(false)
const showQuickAdd = ref(false)
const showSearchDialog = ref(false)
const searchQuery = ref('')
const selectedResultIndex = ref(0)
const searchInputRef = ref<HTMLInputElement | null>(null)
const allTransactionsLoaded = ref(false)
const searchLoading = ref(false)
const scrolled = ref(false)
const fabHidden = ref(false)

// Nav items
const mainNavItems = [
  { name: 'dashboard', icon: 'dashboard', label: 'Dashboard', to: { name: 'dashboard' } },
  { name: 'transactions', icon: 'receipt_long', label: 'Transacciones', to: { name: 'transactions' } },
  { name: 'expenses', icon: 'trending_down', label: 'Gastos', to: { name: 'expenses' } },
  { name: 'income', icon: 'trending_up', label: 'Ingresos', to: { name: 'income' } },
  { name: 'statistics', icon: 'bar_chart', label: 'Estadísticas', to: { name: 'statistics' } }
]

const managementNavItems = [
  { name: 'teams', icon: 'groups', label: 'Equipos', to: { name: 'teams' } },
  { name: 'projects', icon: 'folder', label: 'Proyectos', to: { name: 'projects' } },
  { name: 'events', icon: 'event', label: 'Eventos', to: { name: 'events' } }
]

const adminNavItems = computed(() => [
  { name: 'pending', icon: 'pending_actions', label: 'Pendientes', to: { name: 'pending' }, badge: pendingCount.value },
  { name: 'profitability', icon: 'account_balance_wallet', label: 'Rentabilidad', to: { name: 'profitability' } },
  { name: 'closings', icon: 'lock', label: 'Cierres', to: { name: 'closings' } },
  { name: 'categories', icon: 'category', label: 'Categorías', to: { name: 'categories' } },
  { name: 'forecasts', icon: 'analytics', label: 'Previsiones', to: { name: 'forecasts' } }
])

const accountantNavItems = [
  { name: 'accountant', icon: 'account_balance', label: 'Gestoría', to: { name: 'accountant' } },
  { name: 'accountant-export', icon: 'download', label: 'Exportar', to: { name: 'accountant-export' } }
]

const mobileNavItems = [
  { name: 'dashboard', icon: 'dashboard', label: 'Inicio', to: { name: 'dashboard' } },
  { name: 'expenses', icon: 'trending_down', label: 'Gastos', to: { name: 'expenses' } },
  { name: 'income', icon: 'trending_up', label: 'Ingresos', to: { name: 'income' } },
  { name: 'statistics', icon: 'bar_chart', label: 'Stats', to: { name: 'statistics' } }
]

// Computed
const userInitials = computed(() => {
  const name = authStore.user?.displayName || 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const pendingCount = computed(() => transactionsStore.pendingTransactions.length)

// Search functionality
const searchResults = computed(() => {
  if (searchQuery.value.length < 2) return []
  
  const query = searchQuery.value.toLowerCase()
  
  return transactionsStore.transactions
    .filter(t => {
      // Search in description
      if (t.description.toLowerCase().includes(query)) return true
      
      // Search in category name
      const category = categoriesStore.getCategoryById(t.categoryId)
      if (category?.name.toLowerCase().includes(query)) return true
      
      // Search in team name
      if (t.teamId) {
        const team = teamsStore.getTeamById(t.teamId)
        if (team?.name.toLowerCase().includes(query)) return true
      }
      
      // Search in amount (as string)
      if (t.amount.toString().includes(query)) return true
      
      return false
    })
    .map(t => ({
      ...t,
      categoryName: categoriesStore.getCategoryById(t.categoryId)?.name || 'Sin categoría',
      teamName: t.teamId ? teamsStore.getTeamById(t.teamId)?.name : undefined
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// Watch for search dialog open to focus input and load transactions
watch(showSearchDialog, async (newVal) => {
  if (newVal) {
    // Always load all transactions for search (if not already done)
    if (!allTransactionsLoaded.value) {
      searchLoading.value = true
      await transactionsStore.fetchTransactions({})
      allTransactionsLoaded.value = true
      searchLoading.value = false
    }
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 100)
  } else {
    searchQuery.value = ''
    selectedResultIndex.value = 0
  }
})

// Watch search query to reset selected index
watch(searchQuery, () => {
  selectedResultIndex.value = 0
})

// Keyboard shortcut for search
function handleKeyboardShortcut(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    showSearchDialog.value = true
  }
}

function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
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
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function isActiveRoute(name: string): boolean {
  return route.name === name
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
  await authStore.logout()
  router.push({ name: 'login' })
}

// Scroll handler
let lastScrollTop = 0
function handleScroll() {
  const st = window.scrollY
  scrolled.value = st > 10
  fabHidden.value = st > lastScrollTop && st > 100
  lastScrollTop = st
}

watch(() => route.name, () => {
  if ($q.screen.lt.md) leftDrawerOpen.value = false
})

onMounted(async () => {
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode !== null) $q.dark.set(savedDarkMode === 'true')

  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', handleKeyboardShortcut)

  if (authStore.clubId) {
    await Promise.all([
      categoriesStore.fetchCategories(),
      teamsStore.fetchAll(),
      transactionsStore.fetchTransactions({ status: 'pending' })
    ])
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeyboardShortcut)
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
    background: var(--gradient-brand);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
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

// === DRAWER ===
.main-drawer {
  background: var(--color-bg-elevated);
  border-right: 1px solid var(--color-border-light) !important;
}

.drawer-scroll {
  padding-top: var(--space-4);
}

.drawer-content {
  padding: 0 var(--space-2);
}

.drawer-logo-mini {
  display: flex;
  justify-content: center;
  padding: var(--space-4) 0;

  .logo-mini {
    width: 40px;
    height: 40px;
    background: var(--gradient-brand);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
}

.nav-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.nav-section-title {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 0 var(--space-4);
  margin: 0 0 var(--space-2);
}

.drawer-toggle {
  position: absolute;
  bottom: var(--space-4);
  right: var(--space-4);

  .toggle-btn {
    background: var(--color-bg-tertiary);
    color: var(--color-text-tertiary);

    &:hover {
      background: var(--color-border);
      color: var(--color-text-secondary);
    }
  }
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
