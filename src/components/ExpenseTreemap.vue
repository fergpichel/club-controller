<template>
  <div class="expense-treemap">
    <div class="treemap-header">
      <div class="header-left">
        <h3>{{ title }}</h3>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-right">
        <span class="total-label">Total:</span>
        <span class="total-value">{{ formatCurrency(totalExpenses) }}</span>
      </div>
    </div>

    <!-- Treemap Grid -->
    <div class="treemap-grid">
      <div
        v-for="category in sortedCategories"
        :key="category.id"
        class="treemap-cell"
        :class="{ expanded: expandedCategory === category.id }"
        :style="getCellStyle(category)"
        @click="toggleCategory(category.id)"
        @mouseenter="hoveredCategory = category.id"
        @mouseleave="hoveredCategory = null"
      >
        <div class="cell-content">
          <q-icon :name="category.icon" size="24px" />
          <span class="cell-name">{{ category.name }}</span>
          <span class="cell-amount">{{ formatCurrencyShort(category.amount) }}</span>
          <span class="cell-percent">{{ category.percent.toFixed(1) }}%</span>
        </div>
        
        <!-- Subcategories (when expanded) -->
        <div v-if="expandedCategory === category.id && category.subcategories.length > 0" class="subcategories">
          <div
            v-for="sub in category.subcategories"
            :key="sub.id"
            class="subcategory-item"
          >
            <span class="sub-name">{{ sub.name }}</span>
            <span class="sub-amount">{{ formatCurrencyShort(sub.amount) }}</span>
            <div class="sub-bar">
              <div class="sub-bar-fill" :style="{ width: `${sub.percentOfParent}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend / Details -->
    <div class="treemap-legend">
      <div v-for="category in sortedCategories.slice(0, 6)" :key="'legend-' + category.id" class="legend-item">
        <span class="legend-color" :style="{ background: category.color }"></span>
        <span class="legend-name">{{ category.name }}</span>
        <span class="legend-value">{{ category.percent.toFixed(1) }}%</span>
      </div>
    </div>

    <!-- Top Expenses -->
    <div class="top-expenses">
      <h4>Principales gastos del período</h4>
      <div class="expense-list">
        <div v-for="expense in topExpenses" :key="expense.id" class="expense-item">
          <div class="expense-info">
            <q-icon :name="getCategoryIcon(expense.categoryId)" size="20px" :style="{ color: getCategoryColor(expense.categoryId) }" />
            <div class="expense-details">
              <span class="expense-desc">{{ expense.description }}</span>
              <span class="expense-category">{{ expense.categoryName }}</span>
            </div>
          </div>
          <span class="expense-amount">{{ formatCurrency(expense.amount) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTransactionsStore } from 'src/stores/transactions'
import { useCategoriesStore } from 'src/stores/categories'
import { formatCurrency, formatCurrencyShort } from 'src/utils/formatters'

withDefaults(defineProps<{
  title?: string
  subtitle?: string
}>(), {
  title: 'Distribución de Gastos',
  subtitle: 'Visualización jerárquica por categoría'
})

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()

const expandedCategory = ref<string | null>(null)
const hoveredCategory = ref<string | null>(null)

// Color palette for categories
const categoryColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', 
  '#84CC16', '#22C55E', '#14B8A6', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
  '#D946EF', '#EC4899', '#F43F5E'
]

// Group expenses by category
const expensesByCategory = computed(() => {
  const grouped: Record<string, {
    id: string
    name: string
    icon: string
    amount: number
    subcategories: { id: string; name: string; amount: number; percentOfParent: number }[]
  }> = {}

  transactionsStore.transactions
    .filter(t => t.type === 'expense' && t.status !== 'rejected')
    .forEach(t => {
      const category = categoriesStore.getCategoryById(t.categoryId)
      const parentId = category?.parentId || t.categoryId
      const parent = categoriesStore.getCategoryById(parentId) || category
      
      const parentName = parent?.name || t.categoryName || 'Otros'
      const parentIcon = parent?.icon || 'receipt'
      
      if (!grouped[parentId]) {
        grouped[parentId] = {
          id: parentId,
          name: parentName,
          icon: parentIcon,
          amount: 0,
          subcategories: []
        }
      }
      
      grouped[parentId].amount += t.amount
      
      // Track subcategory if different from parent
      if (category?.parentId) {
        const subIndex = grouped[parentId].subcategories.findIndex(s => s.id === t.categoryId)
        if (subIndex >= 0) {
          grouped[parentId].subcategories[subIndex].amount += t.amount
        } else {
          grouped[parentId].subcategories.push({
            id: t.categoryId,
            name: category.name,
            amount: t.amount,
            percentOfParent: 0
          })
        }
      }
    })

  // Calculate percentOfParent for subcategories
  Object.values(grouped).forEach(cat => {
    cat.subcategories.forEach(sub => {
      sub.percentOfParent = cat.amount > 0 ? (sub.amount / cat.amount) * 100 : 0
    })
    cat.subcategories.sort((a, b) => b.amount - a.amount)
  })

  return grouped
})

const totalExpenses = computed(() => {
  return Object.values(expensesByCategory.value).reduce((sum, cat) => sum + cat.amount, 0)
})

const sortedCategories = computed(() => {
  return Object.values(expensesByCategory.value)
    .map((cat, index) => ({
      ...cat,
      percent: totalExpenses.value > 0 ? (cat.amount / totalExpenses.value) * 100 : 0,
      color: categoryColors[index % categoryColors.length]
    }))
    .sort((a, b) => b.amount - a.amount)
})

// Top individual expenses
const topExpenses = computed(() => {
  return transactionsStore.transactions
    .filter(t => t.type === 'expense' && t.status !== 'rejected')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})

// Calculate cell style for treemap effect
function getCellStyle(category: { percent: number; color: string; id: string }) {
  // Calculate relative size based on percentage
  const minSize = 15 // Minimum percentage width
  const size = Math.max(minSize, category.percent)
  
  const isHovered = hoveredCategory.value === category.id
  const isExpanded = expandedCategory.value === category.id
  
  return {
    '--cell-color': category.color,
    flexBasis: `${size}%`,
    flexGrow: isExpanded ? 2 : 1,
    opacity: hoveredCategory.value && !isHovered && !isExpanded ? 0.6 : 1
  }
}

function toggleCategory(id: string) {
  expandedCategory.value = expandedCategory.value === id ? null : id
}

function getCategoryIcon(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId)
  return category?.icon || 'receipt'
}

function getCategoryColor(categoryId: string): string {
  const catData = sortedCategories.value.find(c => c.id === categoryId)
  if (catData) return catData.color
  
  const category = categoriesStore.getCategoryById(categoryId)
  const parentId = category?.parentId || categoryId
  const parentData = sortedCategories.value.find(c => c.id === parentId)
  return parentData?.color || '#8898AA'
}

onMounted(async () => {
  // Transactions are loaded by parent page; only fetch categories here
  await categoriesStore.fetchCategories()
})
</script>

<style lang="scss" scoped>
.expense-treemap {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
}

.treemap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--space-4);

  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .subtitle {
    margin: var(--space-1) 0 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .header-right {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .total-label {
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
  }

  .total-value {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #EF4444;
  }
}

// Treemap Grid
.treemap-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  min-height: 300px;
}

.treemap-cell {
  min-width: 120px;
  min-height: 100px;
  padding: var(--space-3);
  background: var(--cell-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &.expanded {
    flex-basis: 100% !important;
    min-height: 200px;
  }

  .cell-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    color: white;

    .q-icon {
      opacity: 0.9;
    }

    .cell-name {
      font-size: 0.9375rem;
      font-weight: 600;
      line-height: 1.2;
    }

    .cell-amount {
      font-family: 'DM Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .cell-percent {
      font-size: 0.75rem;
      opacity: 0.8;
    }
  }
}

// Subcategories
.subcategories {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
}

.subcategory-item {
  background: rgba(255, 255, 255, 0.15);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);

  .sub-name {
    display: block;
    font-size: 0.8125rem;
    font-weight: 500;
    color: white;
    margin-bottom: 2px;
  }

  .sub-amount {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    color: white;
  }

  .sub-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-full);
    margin-top: var(--space-1);
    overflow: hidden;

    .sub-bar-fill {
      height: 100%;
      background: white;
      border-radius: var(--radius-full);
    }
  }
}

// Legend
.treemap-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-sm);
  }

  .legend-name {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }

  .legend-value {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

// Top Expenses
.top-expenses {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);

  h4 {
    margin: 0 0 var(--space-3);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.expense-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.expense-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.expense-details {
  display: flex;
  flex-direction: column;
  min-width: 0;

  .expense-desc {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .expense-category {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }
}

.expense-amount {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #EF4444;
  flex-shrink: 0;
}
</style>
