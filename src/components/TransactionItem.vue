<template>
  <article
    class="transaction-item"
    :class="transaction.type"
    @click="$router.push({ name: 'transaction-detail', params: { id: transaction.id } })"
  >
    <!-- Category Icon -->
    <div
      class="transaction-icon"
      :style="{
        backgroundColor: `${categoryColor}15`,
        color: categoryColor
      }"
    >
      <q-icon :name="categoryIcon" size="20px" />
    </div>

    <!-- Info -->
    <div class="transaction-info">
      <p class="transaction-title" :class="{ 'is-masked-text': descriptionHidden }">
        {{ descriptionHidden ? '••••••••••••••' : transaction.description }}
      </p>
      <div class="transaction-meta">
        <span>{{ categoryName }}</span>
        <span v-if="transaction.teamName">{{ transaction.teamName }}</span>
        <span>{{ formatDateRelative(transaction.date) }}</span>
      </div>
    </div>

    <!-- Reveal button (privacy mode) -->
    <q-btn
      v-if="descriptionHidden || isTemporarilyRevealed"
      flat
      round
      dense
      size="sm"
      :icon="descriptionHidden ? 'visibility' : 'visibility_off'"
      class="reveal-btn"
      @click.stop="toggleReveal"
    >
      <q-tooltip>{{ descriptionHidden ? 'Mostrar concepto (5s)' : 'Ocultar concepto' }}</q-tooltip>
    </q-btn>

    <!-- Amount & Status -->
    <div class="transaction-right">
      <p class="transaction-amount" :class="[transaction.type, { 'is-masked': isMasked }]">
        {{ isMasked ? '***,** €' : `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}` }}
      </p>
      <q-badge
        v-if="transaction.status === 'pending'"
        color="warning"
        text-color="dark"
        class="status-badge"
      >
        Pendiente
      </q-badge>
    </div>

    <!-- Arrow -->
    <q-icon name="chevron_right" size="18px" class="transaction-arrow" />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCategoriesStore } from 'src/stores/categories'
import { useSensitiveData } from 'src/composables/useSensitiveData'
import type { Transaction } from 'src/types'
import { formatCurrency, formatDateRelative } from 'src/utils/formatters'

const props = defineProps<{
  transaction: Transaction
}>()

const categoriesStore = useCategoriesStore()
const {
  isSensitiveTransaction,
  canViewSensitive,
  isDescriptionMasked,
  revealDescription,
  hideDescription,
  isRevealed
} = useSensitiveData()

const category = computed(() => {
  return categoriesStore.getCategoryById(props.transaction.categoryId)
})

/** Whether the amount should be masked for the current user */
const isMasked = computed(() => {
  return !canViewSensitive.value && isSensitiveTransaction(props.transaction)
})

/** Whether the description should be hidden (privacy / anti-curious mode) */
const descriptionHidden = computed(() => isDescriptionMasked(props.transaction))

/** Whether this item is in the temporary "revealed" state */
const isTemporarilyRevealed = computed(() => isRevealed(props.transaction.id))

function toggleReveal() {
  if (descriptionHidden.value) {
    revealDescription(props.transaction.id)
  } else {
    hideDescription(props.transaction.id)
  }
}

const categoryName = computed(() => {
  return category.value?.name || props.transaction.categoryName || 'Sin categoría'
})

const categoryIcon = computed(() => {
  return category.value?.icon || 'receipt_long'
})

const categoryColor = computed(() => {
  return category.value?.color || '#8898AA'
})

</script>

<style lang="scss" scoped>
.transaction-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-4);
  background: transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  position: relative;

  &:hover {
    background: var(--color-bg-tertiary);

    .transaction-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 50%;
    border-radius: var(--radius-full);
    opacity: 0;
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  &:hover::before {
    opacity: 1;
  }

  &.income::before {
    background: var(--color-success);
  }

  &.expense::before {
    background: var(--color-danger);
  }
}

.transaction-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--duration-fast) var(--ease-out);

  .transaction-item:hover & {
    transform: scale(1.05);
  }
}

.transaction-info {
  flex: 1;
  min-width: 0;
}

.transaction-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.transaction-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: 2px;

  span {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);

    &:not(:last-child)::after {
      content: '·';
      margin-left: var(--space-3);
      color: var(--color-text-muted);
    }
  }
}

.transaction-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  flex-shrink: 0;
}

.transaction-amount {
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;

  &.income {
    color: var(--color-success);
  }

  &.expense {
    color: var(--color-danger);
  }

  &.is-masked {
    color: var(--color-text-muted);
    font-style: italic;
    letter-spacing: 1px;
  }
}

.status-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.reveal-btn {
  color: var(--color-text-muted);
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity var(--duration-fast) var(--ease-out);

  &:hover {
    opacity: 1;
    color: var(--color-accent);
  }
}

.is-masked-text {
  color: var(--color-text-muted) !important;
  font-style: italic;
  letter-spacing: 1px;
  user-select: none;
}

.transaction-arrow {
  color: var(--color-text-muted);
  opacity: 0;
  transform: translateX(-8px);
  transition: all var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

// Responsive
@media (max-width: 480px) {
  .transaction-icon {
    width: 38px;
    height: 38px;
  }

  .transaction-title {
    font-size: 0.875rem;
  }

  .transaction-meta span:not(:first-child) {
    display: none;
  }

  .transaction-arrow {
    display: none;
  }
}
</style>
