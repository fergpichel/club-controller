<template>
  <div class="money-flow-sankey">
    <!-- Period Selector -->
    <div class="controls-row">
      <div class="period-selector">
        <button
          v-for="period in periods"
          :key="period.value"
          :class="['period-btn', { active: selectedPeriod === period.value }]"
          @click="selectedPeriod = period.value"
        >
          {{ period.label }}
        </button>
      </div>
      <div class="period-info">
        <q-icon name="info_outline" size="16px" />
        <span>{{ periodDescription }}</span>
      </div>
    </div>

    <!-- Summary -->
    <div class="flow-summary">
      <div class="summary-item income">
        <span class="summary-label">Total Ingresos</span>
        <span class="summary-value">{{ formatCurrency(totalIncome) }}</span>
      </div>
      <div class="summary-item flow-indicator">
        <q-icon name="arrow_forward" size="32px" />
        <span class="balance" :class="balance >= 0 ? 'positive' : 'negative'">
          {{ balance >= 0 ? '+' : '' }}{{ formatCurrency(balance) }}
        </span>
      </div>
      <div class="summary-item expenses">
        <span class="summary-label">Total Gastos</span>
        <span class="summary-value">{{ formatCurrency(totalExpenses) }}</span>
      </div>
    </div>

    <!-- Sankey Visualization - Full Width SVG -->
    <div ref="sankeyWrapper" class="sankey-wrapper">
      <svg 
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`" 
        preserveAspectRatio="xMidYMid meet"
        class="sankey-svg"
      >
        <defs>
          <!-- Gradients for income flows -->
          <linearGradient 
            v-for="(flow, i) in incomeFlows" 
            :id="'gradient-income-' + i"
            :key="'grad-income-' + flow.id"
            x1="0%" y1="0%" x2="100%" y2="0%"
          >
            <stop offset="0%" :stop-color="flow.color" stop-opacity="0.8" />
            <stop offset="100%" :stop-color="flow.color" stop-opacity="0.4" />
          </linearGradient>
          
          <!-- Gradients for expense flows -->
          <linearGradient 
            v-for="(flow, i) in expenseFlows" 
            :id="'gradient-expense-' + i"
            :key="'grad-expense-' + flow.id"
            x1="0%" y1="0%" x2="100%" y2="0%"
          >
            <stop offset="0%" :stop-color="flow.color" stop-opacity="0.4" />
            <stop offset="100%" :stop-color="flow.color" stop-opacity="0.8" />
          </linearGradient>
        </defs>

        <!-- Income side labels and bars -->
        <g class="income-labels">
          <g v-for="flow in incomeFlowsPositioned" :key="'income-label-' + flow.id">
            <!-- Category bar -->
            <rect
              :x="0"
              :y="flow.y"
              :width="labelWidth - 10"
              :height="flow.height"
              :fill="flow.color"
              rx="4"
              class="category-bar"
              @mouseenter="highlightFlow(flow.id)"
              @mouseleave="clearHighlight"
            />
            <!-- Category name -->
            <text
              :x="labelWidth - 20"
              :y="flow.y + flow.height / 2"
              text-anchor="end"
              dominant-baseline="middle"
              class="label-text"
              :class="{ dimmed: highlightedFlow && highlightedFlow !== flow.id }"
            >
              {{ truncateText(flow.name, 14) }}
            </text>
            <!-- Amount below -->
            <text
              :x="labelWidth - 20"
              :y="flow.y + flow.height / 2 + 14"
              text-anchor="end"
              dominant-baseline="middle"
              class="amount-text"
              :class="{ dimmed: highlightedFlow && highlightedFlow !== flow.id }"
            >
              {{ formatCurrencyShort(flow.amount) }}
            </text>
          </g>
        </g>

        <!-- Income flows (curved paths) -->
        <g class="income-flows">
          <path
            v-for="(flow, i) in incomeFlowsPositioned"
            :key="'income-flow-' + flow.id"
            :d="generateIncomePath(flow)"
            :fill="`url(#gradient-income-${i})`"
            :opacity="highlightedFlow && highlightedFlow !== flow.id ? 0.15 : 1"
            class="flow-path"
            @mouseenter="highlightFlow(flow.id)"
            @mouseleave="clearHighlight"
          />
        </g>

        <!-- Center node -->
        <rect 
          :x="centerX - centerWidth/2" 
          :y="topPadding" 
          :width="centerWidth" 
          :height="svgHeight - topPadding - bottomPadding" 
          rx="8" 
          class="center-node"
        />
        <text 
          :x="centerX" 
          :y="svgHeight / 2" 
          text-anchor="middle" 
          dominant-baseline="middle"
          class="center-label"
        >
          CLUB
        </text>

        <!-- Expense flows (curved paths) -->
        <g class="expense-flows">
          <path
            v-for="(flow, i) in expenseFlowsPositioned"
            :key="'expense-flow-' + flow.id"
            :d="generateExpensePath(flow)"
            :fill="`url(#gradient-expense-${i})`"
            :opacity="highlightedFlow && highlightedFlow !== flow.id ? 0.15 : 1"
            class="flow-path"
            @mouseenter="highlightFlow(flow.id)"
            @mouseleave="clearHighlight"
          />
        </g>

        <!-- Expense side labels and bars -->
        <g class="expense-labels">
          <g v-for="flow in expenseFlowsPositioned" :key="'expense-label-' + flow.id">
            <!-- Category bar -->
            <rect
              :x="svgWidth - labelWidth + 10"
              :y="flow.y"
              :width="labelWidth - 10"
              :height="flow.height"
              :fill="flow.color"
              rx="4"
              class="category-bar"
              @mouseenter="highlightFlow(flow.id)"
              @mouseleave="clearHighlight"
            />
            <!-- Category name -->
            <text
              :x="svgWidth - labelWidth + 20"
              :y="flow.y + flow.height / 2"
              text-anchor="start"
              dominant-baseline="middle"
              class="label-text"
              :class="{ dimmed: highlightedFlow && highlightedFlow !== flow.id }"
            >
              {{ truncateText(flow.name, 14) }}
            </text>
            <!-- Amount below -->
            <text
              :x="svgWidth - labelWidth + 20"
              :y="flow.y + flow.height / 2 + 14"
              text-anchor="start"
              dominant-baseline="middle"
              class="amount-text"
              :class="{ dimmed: highlightedFlow && highlightedFlow !== flow.id }"
            >
              {{ formatCurrencyShort(flow.amount) }}
            </text>
          </g>
        </g>
      </svg>
    </div>

    <!-- Hover tooltip -->
    <div v-if="hoveredFlowData" class="flow-tooltip" :style="tooltipStyle">
      <div class="tooltip-header" :style="{ borderColor: hoveredFlowData.color }">
        {{ hoveredFlowData.name }}
      </div>
      <div class="tooltip-amount">{{ formatCurrency(hoveredFlowData.amount) }}</div>
      <div class="tooltip-percent">{{ hoveredFlowData.percent.toFixed(1) }}% del total</div>
    </div>

    <!-- Insights -->
    <div class="insights-section">
      <div v-for="insight in insights" :key="insight.id" class="insight-card">
        <q-icon :name="insight.icon" :color="insight.color" size="24px" />
        <div class="insight-content">
          <span class="insight-title">{{ insight.title }}</span>
          <span class="insight-text">{{ insight.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { startOfMonth, endOfMonth, subMonths, startOfYear, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTransactionsStore } from 'src/stores/transactions'
import { useCategoriesStore } from 'src/stores/categories'
import { formatCurrency, formatCurrencyShort } from 'src/utils/formatters'

const transactionsStore = useTransactionsStore()
const categoriesStore = useCategoriesStore()

// SVG dimensions
const svgWidth = 1000
const svgHeight = 500
const labelWidth = 180
const centerWidth = 60
const centerX = svgWidth / 2
const topPadding = 20
const bottomPadding = 20
const flowGap = 6

// State
const selectedPeriod = ref('season')
const highlightedFlow = ref<string | null>(null)
const sankeyWrapper = ref<HTMLElement | null>(null)
const mousePosition = ref({ x: 0, y: 0 })

const periods = [
  { value: 'month', label: 'Este mes' },
  { value: '3months', label: 'Último trimestre' },
  { value: 'year', label: 'Este año' },
  { value: 'season', label: 'Temporada' }
]

// Color palettes
const incomeColors = [
  '#10B981', '#059669', '#0D9488', '#14B8A6', '#06B6D4', '#0891B2', '#22C55E', '#16A34A'
]

const expenseColors = [
  '#EF4444', '#DC2626', '#F97316', '#EA580C', '#F59E0B', '#D97706', '#FB923C', '#FBBF24'
]

const periodDescription = computed(() => {
  const now = new Date()
  switch (selectedPeriod.value) {
    case 'month':
      return format(now, 'MMMM yyyy', { locale: es })
    case '3months':
      return `${format(subMonths(now, 2), 'MMM', { locale: es })} - ${format(now, 'MMM yyyy', { locale: es })}`
    case 'year':
      return `Año ${now.getFullYear()}`
    case 'season':
      const seasonStart = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
      return `Temporada ${seasonStart}-${(seasonStart + 1).toString().slice(-2)}`
    default:
      return ''
  }
})

// Filter transactions by period
const filteredTransactions = computed(() => {
  const now = new Date()
  let startDate: Date
  let endDate = now

  switch (selectedPeriod.value) {
    case 'month':
      startDate = startOfMonth(now)
      endDate = endOfMonth(now)
      break
    case '3months':
      startDate = startOfMonth(subMonths(now, 2))
      break
    case 'year':
      startDate = startOfYear(now)
      break
    case 'season':
    default:
      const seasonYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
      startDate = new Date(seasonYear, 8, 1)
      break
  }

  return transactionsStore.transactions.filter(t => {
    const txnDate = new Date(t.date)
    return txnDate >= startDate && txnDate <= endDate && t.status !== 'rejected'
  })
})

// Group transactions by parent category
const incomeByCategory = computed(() => {
  const grouped: Record<string, { id: string; name: string; amount: number }> = {}
  
  filteredTransactions.value
    .filter(t => t.type === 'income')
    .forEach(t => {
      const category = categoriesStore.getCategoryById(t.categoryId)
      const parentId = category?.parentId || t.categoryId
      const parent = categoriesStore.getCategoryById(parentId) || category
      const name = parent?.name || t.categoryName || 'Otros'
      const id = parentId || 'otros'
      
      if (!grouped[id]) {
        grouped[id] = { id, name, amount: 0 }
      }
      grouped[id].amount += t.amount
    })
  
  return Object.values(grouped).sort((a, b) => b.amount - a.amount)
})

const expensesByCategory = computed(() => {
  const grouped: Record<string, { id: string; name: string; amount: number }> = {}
  
  filteredTransactions.value
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const category = categoriesStore.getCategoryById(t.categoryId)
      const parentId = category?.parentId || t.categoryId
      const parent = categoriesStore.getCategoryById(parentId) || category
      const name = parent?.name || t.categoryName || 'Otros'
      const id = parentId || 'otros'
      
      if (!grouped[id]) {
        grouped[id] = { id, name, amount: 0 }
      }
      grouped[id].amount += t.amount
    })
  
  return Object.values(grouped).sort((a, b) => b.amount - a.amount)
})

// Totals
const totalIncome = computed(() => incomeByCategory.value.reduce((sum, c) => sum + c.amount, 0))
const totalExpenses = computed(() => expensesByCategory.value.reduce((sum, c) => sum + c.amount, 0))
const balance = computed(() => totalIncome.value - totalExpenses.value)

// Flow items with colors and percentages
const incomeFlows = computed(() => {
  return incomeByCategory.value.slice(0, 8).map((cat, i) => ({
    ...cat,
    color: incomeColors[i % incomeColors.length],
    percent: totalIncome.value > 0 ? (cat.amount / totalIncome.value) * 100 : 0
  }))
})

const expenseFlows = computed(() => {
  return expensesByCategory.value.slice(0, 8).map((cat, i) => ({
    ...cat,
    color: expenseColors[i % expenseColors.length],
    percent: totalExpenses.value > 0 ? (cat.amount / totalExpenses.value) * 100 : 0
  }))
})

// Calculate positions for income flows
const incomeFlowsPositioned = computed(() => {
  const availableHeight = svgHeight - topPadding - bottomPadding
  const totalAmount = totalIncome.value || 1
  const minHeight = 28
  
  // Calculate raw heights
  let flows = incomeFlows.value.map(flow => ({
    ...flow,
    rawHeight: (flow.amount / totalAmount) * availableHeight
  }))
  
  // Ensure minimum height and recalculate
  const totalRawHeight = flows.reduce((sum, f) => sum + Math.max(f.rawHeight, minHeight), 0) + (flows.length - 1) * flowGap
  const scale = (availableHeight - (flows.length - 1) * flowGap) / flows.reduce((sum, f) => sum + Math.max(f.rawHeight, minHeight), 0)
  
  let currentY = topPadding
  return flows.map(flow => {
    const height = Math.max(flow.rawHeight, minHeight) * (totalRawHeight > availableHeight ? scale : 1)
    const positioned = {
      ...flow,
      y: currentY,
      height,
      centerY: currentY + height / 2
    }
    currentY += height + flowGap
    return positioned
  })
})

// Calculate positions for expense flows
const expenseFlowsPositioned = computed(() => {
  const availableHeight = svgHeight - topPadding - bottomPadding
  const totalAmount = totalExpenses.value || 1
  const minHeight = 28
  
  let flows = expenseFlows.value.map(flow => ({
    ...flow,
    rawHeight: (flow.amount / totalAmount) * availableHeight
  }))
  
  const totalRawHeight = flows.reduce((sum, f) => sum + Math.max(f.rawHeight, minHeight), 0) + (flows.length - 1) * flowGap
  const scale = (availableHeight - (flows.length - 1) * flowGap) / flows.reduce((sum, f) => sum + Math.max(f.rawHeight, minHeight), 0)
  
  let currentY = topPadding
  return flows.map(flow => {
    const height = Math.max(flow.rawHeight, minHeight) * (totalRawHeight > availableHeight ? scale : 1)
    const positioned = {
      ...flow,
      y: currentY,
      height,
      centerY: currentY + height / 2
    }
    currentY += height + flowGap
    return positioned
  })
})

// Generate SVG path for income flow (left to center)
function generateIncomePath(flow: { y: number; height: number; centerY: number }) {
  const startX = labelWidth - 10
  const endX = centerX - centerWidth / 2
  const startY = flow.y
  const height = flow.height
  
  // Calculate center connection point (distribute evenly on center node)
  const centerNodeHeight = svgHeight - topPadding - bottomPadding
  const flowIndex = incomeFlowsPositioned.value.findIndex(f => f.y === flow.y)
  const totalFlows = incomeFlowsPositioned.value.length
  const centerStartY = topPadding + (flowIndex / totalFlows) * centerNodeHeight
  const centerEndY = topPadding + ((flowIndex + 1) / totalFlows) * centerNodeHeight
  
  const controlPoint1X = startX + (endX - startX) * 0.4
  const controlPoint2X = startX + (endX - startX) * 0.6
  
  return `
    M ${startX} ${startY}
    C ${controlPoint1X} ${startY}, ${controlPoint2X} ${centerStartY}, ${endX} ${centerStartY}
    L ${endX} ${centerEndY}
    C ${controlPoint2X} ${centerEndY}, ${controlPoint1X} ${startY + height}, ${startX} ${startY + height}
    Z
  `
}

// Generate SVG path for expense flow (center to right)
function generateExpensePath(flow: { y: number; height: number; centerY: number }) {
  const startX = centerX + centerWidth / 2
  const endX = svgWidth - labelWidth + 10
  const height = flow.height
  
  // Calculate center connection point
  const centerNodeHeight = svgHeight - topPadding - bottomPadding
  const flowIndex = expenseFlowsPositioned.value.findIndex(f => f.y === flow.y)
  const totalFlows = expenseFlowsPositioned.value.length
  const centerStartY = topPadding + (flowIndex / totalFlows) * centerNodeHeight
  const centerEndY = topPadding + ((flowIndex + 1) / totalFlows) * centerNodeHeight
  
  const controlPoint1X = startX + (endX - startX) * 0.4
  const controlPoint2X = startX + (endX - startX) * 0.6
  
  return `
    M ${startX} ${centerStartY}
    C ${controlPoint1X} ${centerStartY}, ${controlPoint2X} ${flow.y}, ${endX} ${flow.y}
    L ${endX} ${flow.y + height}
    C ${controlPoint2X} ${flow.y + height}, ${controlPoint1X} ${centerEndY}, ${startX} ${centerEndY}
    Z
  `
}

// Hovered flow data for tooltip
const hoveredFlowData = computed(() => {
  if (!highlightedFlow.value) return null
  const incomeFlow = incomeFlowsPositioned.value.find(f => f.id === highlightedFlow.value)
  if (incomeFlow) return incomeFlow
  return expenseFlowsPositioned.value.find(f => f.id === highlightedFlow.value) || null
})

const tooltipStyle = computed(() => ({
  left: `${mousePosition.value.x + 15}px`,
  top: `${mousePosition.value.y + 15}px`
}))

// Insights
const insights = computed(() => {
  const result = []
  
  if (balance.value > 0) {
    result.push({
      id: 'balance',
      icon: 'check_circle',
      color: 'positive',
      title: 'Balance positivo',
      text: `Los ingresos superan a los gastos en ${formatCurrency(balance.value)}`
    })
  } else if (balance.value < 0) {
    result.push({
      id: 'balance',
      icon: 'warning',
      color: 'negative',
      title: 'Balance negativo',
      text: `Los gastos superan a los ingresos en ${formatCurrency(Math.abs(balance.value))}`
    })
  }
  
  if (incomeByCategory.value.length > 0) {
    const top = incomeByCategory.value[0]
    const percent = ((top.amount / totalIncome.value) * 100).toFixed(0)
    result.push({
      id: 'top-income',
      icon: 'star',
      color: 'positive',
      title: 'Principal fuente',
      text: `${top.name} representa el ${percent}% de los ingresos`
    })
  }
  
  if (expensesByCategory.value.length > 0) {
    const top = expensesByCategory.value[0]
    const percent = ((top.amount / totalExpenses.value) * 100).toFixed(0)
    result.push({
      id: 'top-expense',
      icon: 'payments',
      color: 'warning',
      title: 'Mayor gasto',
      text: `${top.name} consume el ${percent}% del presupuesto`
    })
  }
  
  const topThreeIncome = incomeByCategory.value.slice(0, 3).reduce((sum, c) => sum + c.amount, 0)
  const concentration = totalIncome.value > 0 ? (topThreeIncome / totalIncome.value) * 100 : 0
  if (concentration > 80) {
    result.push({
      id: 'diversification',
      icon: 'info',
      color: 'info',
      title: 'Alta concentración',
      text: `El ${concentration.toFixed(0)}% de ingresos viene de solo 3 fuentes`
    })
  }
  
  return result
})

function highlightFlow(id: string) {
  highlightedFlow.value = id
}

function clearHighlight() {
  highlightedFlow.value = null
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 1) + '…'
}

onMounted(async () => {
  // Transactions are loaded by parent page; only fetch categories here
  await categoriesStore.fetchCategories()
  
  // Track mouse for tooltip
  document.addEventListener('mousemove', (e) => {
    mousePosition.value = { x: e.clientX, y: e.clientY }
  })
})
</script>

<style lang="scss" scoped>
.money-flow-sankey {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

// Controls
.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.period-selector {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
}

.period-btn {
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--color-text-primary);
  }

  &.active {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-xs);
  }
}

.period-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: 0.875rem;
}

// Summary
.flow-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  padding: var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);

  @media (max-width: 600px) {
    flex-direction: column;
    gap: var(--space-4);
  }
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);

  &.income .summary-value {
    color: #10B981;
  }

  &.expenses .summary-value {
    color: #EF4444;
  }

  &.flow-indicator {
    .q-icon {
      color: var(--color-text-tertiary);
    }
    
    .balance {
      font-family: 'DM Sans', sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      
      &.positive { color: #10B981; }
      &.negative { color: #EF4444; }
    }
  }
}

.summary-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-tertiary);
}

.summary-value {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
}

// Sankey Wrapper
.sankey-wrapper {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  padding: var(--space-4);
  overflow: hidden;
}

.sankey-svg {
  width: 100%;
  height: auto;
  min-height: 400px;
  max-height: 550px;
  
  .category-bar {
    cursor: pointer;
    transition: opacity var(--duration-fast) var(--ease-out);
    
    &:hover {
      opacity: 0.85;
    }
  }
  
  .flow-path {
    cursor: pointer;
    transition: opacity var(--duration-fast) var(--ease-out);
  }
  
  .center-node {
    fill: var(--color-bg-tertiary);
    stroke: var(--color-border-light);
    stroke-width: 1;
  }
  
  .center-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    fill: var(--color-text-tertiary);
    letter-spacing: 0.1em;
  }
  
  .label-text {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
    fill: var(--color-text-primary);
    transition: opacity var(--duration-fast) var(--ease-out);
    
    &.dimmed {
      opacity: 0.3;
    }
  }
  
  .amount-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    fill: var(--color-text-secondary);
    transition: opacity var(--duration-fast) var(--ease-out);
    
    &.dimmed {
      opacity: 0.3;
    }
  }
}

// Tooltip
.flow-tooltip {
  position: fixed;
  z-index: 1000;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-3);
  pointer-events: none;
  min-width: 150px;
  
  .tooltip-header {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text-primary);
    padding-bottom: var(--space-2);
    margin-bottom: var(--space-2);
    border-bottom: 2px solid;
  }
  
  .tooltip-amount {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }
  
  .tooltip-percent {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }
}

// Insights
.insights-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}

.insight-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.insight-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.insight-text {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}
</style>
