<template>
  <router-link
    v-slot="{ isActive, navigate }"
    :to="item.to"
    custom
  >
    <div
      class="nav-item"
      :class="{
        'nav-item--active': isActive,
        'nav-item--mini': mini
      }"
      @click="navigate"
    >
      <div class="nav-item__icon">
        <q-icon :name="item.icon" size="20px" />
        <q-badge
          v-if="item.badge && item.badge > 0"
          color="negative"
          floating
          rounded
          class="nav-badge"
        >
          {{ item.badge > 9 ? '9+' : item.badge }}
        </q-badge>
      </div>
      <span v-if="!mini" class="nav-item__label">{{ item.label }}</span>
      <q-tooltip v-if="mini" anchor="center right" self="center left" :offset="[12, 0]">
        {{ item.label }}
      </q-tooltip>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

interface NavItemProps {
  item: {
    name: string
    icon: string
    label: string
    to: RouteLocationRaw
    color?: string
    badge?: number
  }
  mini?: boolean
}

defineProps<NavItemProps>()
</script>

<style lang="scss" scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  margin: 2px 0;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  color: var(--color-text-secondary);
  min-height: 44px;
  user-select: none;
  position: relative;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  &--active {
    background: rgba(99, 91, 255, 0.08);
    color: var(--color-accent);

    .nav-item__label {
      font-weight: 600;
    }
  }

  &--mini {
    justify-content: center;
    padding: var(--space-3);
    width: 48px;
    margin: var(--space-1) auto;

    .nav-item__icon {
      min-width: auto;
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    position: relative;
  }

  &__label {
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.nav-badge {
  position: absolute;
  top: -8px;
  right: -10px;
  min-width: 16px;
  height: 16px;
  font-size: 0.5625rem;
  font-weight: 700;
  padding: 0 4px;
}
</style>
