<template>
  <q-layout view="lHh LpR fFf">
    <!-- Header -->
    <q-header class="sa-header" :class="{ 'sa-header--scrolled': scrolled }">
      <q-toolbar class="sa-toolbar">
        <q-btn
          v-if="$q.screen.lt.md"
          flat
          dense
          round
          icon="menu"
          class="sa-menu-btn"
          @click="drawer = !drawer"
        />

        <router-link :to="{ name: 'superadmin-dashboard' }" class="sa-brand">
          <div class="sa-brand-logo">
            <q-icon name="admin_panel_settings" size="20px" />
          </div>
          <span v-if="$q.screen.gt.xs" class="sa-brand-text">Grootter Admin</span>
        </router-link>

        <q-space />

        <q-btn
          flat
          no-caps
          class="sa-back-btn"
          icon="arrow_back"
          :label="$q.screen.gt.sm ? 'Volver al club' : undefined"
          :to="{ name: 'dashboard' }"
        />

        <q-btn flat round class="sa-user-btn">
          <q-avatar size="34px" class="sa-user-avatar">
            {{ userInitials }}
          </q-avatar>
          <q-menu anchor="bottom right" self="top right" class="sa-user-menu-popup">
            <div class="sa-user-menu">
              <div class="sa-user-menu-header">
                <q-avatar size="44px" class="sa-user-avatar-lg">
                  {{ userInitials }}
                </q-avatar>
                <div class="sa-user-menu-info">
                  <p class="sa-user-name">{{ authStore.user?.displayName || 'Usuario' }}</p>
                  <p class="sa-user-email">{{ authStore.user?.email }}</p>
                  <q-badge color="deep-purple" label="Super Admin" class="q-mt-xs" />
                </div>
              </div>
              <q-separator />
              <q-list class="sa-user-menu-actions">
                <q-item v-close-popup clickable @click="toggleDarkMode">
                  <q-item-section avatar>
                    <q-icon :name="$q.dark.isActive ? 'light_mode' : 'dark_mode'" />
                  </q-item-section>
                  <q-item-section>{{ $q.dark.isActive ? 'Modo claro' : 'Modo oscuro' }}</q-item-section>
                </q-item>
              </q-list>
              <q-separator />
              <div class="sa-user-menu-footer">
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
      </q-toolbar>
    </q-header>

    <!-- Sidebar -->
    <q-drawer
      v-model="drawer"
      :mini="miniState"
      :width="140"
      :mini-width="64"
      :breakpoint="1024"
      class="sa-drawer"
      :behavior="$q.screen.lt.md ? 'mobile' : 'desktop'"
    >
      <q-scroll-area class="fit sa-drawer-scroll">
        <div class="sa-drawer-content">
          <!-- Logo mini -->
          <div v-if="miniState && $q.screen.gt.sm" class="sa-drawer-logo-mini">
            <div class="sa-logo-mini">
              <q-icon name="admin_panel_settings" size="22px" />
            </div>
          </div>

          <!-- Navigation -->
          <nav class="sa-nav">
            <div class="sa-nav-section">
              <p v-if="!miniState || $q.screen.lt.md" class="sa-nav-title">Backoffice</p>
              <NavItem
                v-for="item in navItems"
                :key="item.name"
                :item="item"
                :mini="miniState && $q.screen.gt.sm"
              />
            </div>
          </nav>
        </div>
      </q-scroll-area>

      <!-- Toggle -->
      <div v-if="$q.screen.gt.sm" class="sa-drawer-toggle">
        <q-btn
          flat
          round
          dense
          size="sm"
          :icon="miniState ? 'chevron_right' : 'chevron_left'"
          class="sa-toggle-btn"
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
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import NavItem from 'src/components/NavItem.vue'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

const drawer = ref(true)
const miniState = ref(false)
const scrolled = ref(false)

const navItems = [
  { name: 'superadmin-dashboard', icon: 'dashboard', label: 'Dashboard', to: { name: 'superadmin-dashboard' } },
  { name: 'ai-usage', icon: 'smart_toy', label: 'Uso de IA', to: { name: 'ai-usage' } }
]

const userInitials = computed(() => {
  const name = authStore.user?.displayName || 'U'
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
})

function toggleDarkMode() {
  $q.dark.toggle()
  localStorage.setItem('darkMode', $q.dark.isActive.toString())
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}

function handleScroll() {
  scrolled.value = window.scrollY > 10
}

onMounted(() => {
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode !== null) {
    $q.dark.set(savedDarkMode === 'true')
  } else {
    $q.dark.set(true)
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
// ─── Header ───────────────────────────────────────────────────────────
.sa-header {
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-light);
  transition: all var(--duration-fast) var(--ease-out);

  &--scrolled {
    box-shadow: var(--shadow-sm);
  }
}

.sa-toolbar {
  min-height: 64px;
  padding: 0 var(--space-4);
  gap: var(--space-4);

  @media (min-width: 1024px) {
    padding: 0 var(--space-6);
  }
}

.sa-menu-btn {
  color: var(--color-text-secondary);
}

.sa-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;

  .sa-brand-logo {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .sa-brand-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
  }
}

.sa-back-btn {
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
}

.sa-user-avatar {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
}

.sa-user-avatar-lg {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: white;
  font-size: 1rem;
  font-weight: 700;
}

// ─── User menu ────────────────────────────────────────────────────────
.sa-user-menu {
  width: 280px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.sa-user-menu-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-tertiary);
}

.sa-user-menu-info {
  flex: 1;
  min-width: 0;

  .sa-user-name {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--color-text-primary);
    margin: 0;
  }

  .sa-user-email {
    font-size: 0.8125rem;
    color: var(--color-text-tertiary);
    margin: var(--space-1) 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.sa-user-menu-actions {
  padding: var(--space-2);

  .q-item {
    border-radius: var(--radius-md);
    min-height: 42px;
    font-size: 0.875rem;
  }
}

.sa-user-menu-footer {
  padding: var(--space-3);
}

// ─── Drawer ───────────────────────────────────────────────────────────
.sa-drawer {
  background: var(--color-bg-elevated);
  border-right: 1px solid var(--color-border-light) !important;
}

.sa-drawer-scroll {
  padding-top: var(--space-3);
}

.sa-drawer-content {
  padding: 0 var(--space-1);
}

.sa-drawer-logo-mini {
  display: flex;
  justify-content: center;
  padding: var(--space-4) 0;

  .sa-logo-mini {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
}

.sa-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.sa-nav-title {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 0 var(--space-3);
  margin: 0 0 var(--space-1);
}

.sa-drawer-toggle {
  position: absolute;
  bottom: var(--space-4);
  right: var(--space-4);

  .sa-toggle-btn {
    background: var(--color-bg-tertiary);
    color: var(--color-text-tertiary);

    &:hover {
      background: var(--color-border);
      color: var(--color-text-secondary);
    }
  }
}

// ─── Page transitions ─────────────────────────────────────────────────
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
