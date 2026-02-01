<template>
  <div class="activity-heatmap">
    <div class="heatmap-header">
      <div class="header-left">
        <h3>{{ title }}</h3>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-right">
        <div class="view-toggle">
          <button 
            :class="{ active: viewMode === 'amount' }"
            @click="viewMode = 'amount'"
          >
            Importe
          </button>
          <button 
            :class="{ active: viewMode === 'count' }"
            @click="viewMode = 'count'"
          >
            Cantidad
          </button>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend-row">
      <span class="legend-label">Menos</span>
      <div class="legend-scale">
        <span v-for="level in 5" :key="level" class="legend-cell" :class="`level-${level}`"></span>
      </div>
      <span class="legend-label">Más</span>
    </div>

    <!-- Heatmap Grid -->
    <div class="heatmap-container">
      <!-- Month labels -->
      <div class="month-labels">
        <span v-for="month in monthLabels" :key="month.key" class="month-label">
          {{ month.label }}
        </span>
      </div>

      <!-- Day labels + Grid -->
      <div class="grid-wrapper">
        <div class="day-labels">
          <span></span>
          <span>Lun</span>
          <span></span>
          <span>Mié</span>
          <span></span>
          <span>Vie</span>
          <span></span>
        </div>

        <div class="heatmap-grid">
          <div 
            v-for="(week, weekIndex) in weeks" 
            :key="weekIndex" 
            class="week-column"
          >
            <div
              v-for="(day, dayIndex) in week"
              :key="dayIndex"
              class="day-cell"
              :class="[
                `level-${day.level}`,
                { empty: !day.date, today: day.isToday, future: day.isFuture }
              ]"
              @mouseenter="hoveredDay = day.date ? day : null"
              @mouseleave="hoveredDay = null"
            >
              <q-tooltip v-if="day.date && !day.isFuture" :delay="200">
                <div class="tooltip-content">
                  <strong>{{ formatDate(day.date) }}</strong>
                  <div v-if="viewMode === 'amount'">
                    <span class="text-positive">+{{ formatCurrency(day.income) }}</span>
                    <span class="text-negative">-{{ formatCurrency(day.expenses) }}</span>
                  </div>
                  <div v-else>
                    {{ day.count }} {{ day.count === 1 ? 'movimiento' : 'movimientos' }}
                  </div>
                </div>
              </q-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="stats-summary">
      <div class="stat-item">
        <span class="stat-value">{{ totalTransactions }}</span>
        <span class="stat-label">transacciones</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ activeDays }}</span>
        <span class="stat-label">días con actividad</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ busiestDay }}</span>
        <span class="stat-label">día más activo</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ formatCurrencyShort(avgDailyVolume) }}</span>
        <span class="stat-label">volumen medio/día</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  endOfWeek, eachDayOfInterval, eachWeekOfInterval,
  format, subMonths, isSameDay, isAfter, startOfDay
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useTransactionsStore } from 'src/stores/transactions'

interface Props {
  title?: string
  subtitle?: string
  months?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Actividad Financiera',
  subtitle: 'Movimientos de los últimos meses',
  months: 6
})

const transactionsStore = useTransactionsStore()
const viewMode = ref<'amount' | 'count'>('amount')
const hoveredDay = ref<DayData | null>(null)

interface DayData {
  date: Date | null
  income: number
  expenses: number
  count: number
  level: number
  isToday: boolean
  isFuture: boolean
}

// Calculate date range
const dateRange = computed(() => {
  const end = new Date()
  const start = subMonths(end, props.months)
  return { start, end }
})

// Group transactions by day
const transactionsByDay = computed(() => {
  const map = new Map<string, { income: number; expenses: number; count: number }>()
  
  transactionsStore.transactions
    .filter(t => t.status !== 'rejected')
    .forEach(t => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd')
      const existing = map.get(dateKey) || { income: 0, expenses: 0, count: 0 }
      
      if (t.type === 'income') {
        existing.income += t.amount
      } else {
        existing.expenses += t.amount
      }
      existing.count++
      
      map.set(dateKey, existing)
    })
  
  return map
})

// Calculate intensity levels
const maxValue = computed(() => {
  let max = 0
  transactionsByDay.value.forEach(day => {
    const value = viewMode.value === 'amount' 
      ? day.income + day.expenses 
      : day.count
    if (value > max) max = value
  })
  return max || 1
})

const getLevel = (value: number): number => {
  if (value === 0) return 0
  const ratio = value / maxValue.value
  if (ratio <= 0.2) return 1
  if (ratio <= 0.4) return 2
  if (ratio <= 0.6) return 3
  if (ratio <= 0.8) return 4
  return 5
}

// Generate weeks grid
const weeks = computed(() => {
  const { start, end } = dateRange.value
  const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
  const today = startOfDay(new Date())
  
  return weekStarts.map(weekStart => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    
    return days.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd')
      const dayData = transactionsByDay.value.get(dateKey)
      const isInRange = date >= start && date <= end
      const isFuture = isAfter(date, today)
      
      const value = dayData 
        ? (viewMode.value === 'amount' ? dayData.income + dayData.expenses : dayData.count)
        : 0
      
      return {
        date: isInRange ? date : null,
        income: dayData?.income || 0,
        expenses: dayData?.expenses || 0,
        count: dayData?.count || 0,
        level: isInRange && !isFuture ? getLevel(value) : 0,
        isToday: isSameDay(date, today),
        isFuture
      } as DayData
    })
  })
})

// Month labels
const monthLabels = computed(() => {
  const { start, end } = dateRange.value
  const months: { key: string; label: string }[] = []
  let currentMonth = start
  
  while (currentMonth <= end) {
    months.push({
      key: format(currentMonth, 'yyyy-MM'),
      label: format(currentMonth, 'MMM', { locale: es })
    })
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
  }
  
  return months
})

// Stats
const totalTransactions = computed(() => {
  let total = 0
  transactionsByDay.value.forEach(d => total += d.count)
  return total
})

const activeDays = computed(() => transactionsByDay.value.size)

const busiestDay = computed(() => {
  let maxCount = 0
  let busiestDate: Date | null = null
  
  transactionsByDay.value.forEach((data, dateKey) => {
    if (data.count > maxCount) {
      maxCount = data.count
      busiestDate = new Date(dateKey)
    }
  })
  
  return busiestDate ? format(busiestDate, 'EEEE', { locale: es }) : '-'
})

const avgDailyVolume = computed(() => {
  let totalVolume = 0
  transactionsByDay.value.forEach(d => {
    totalVolume += d.income + d.expenses
  })
  return activeDays.value > 0 ? totalVolume / activeDays.value : 0
})

function formatDate(date: Date): string {
  return format(date, "d 'de' MMMM, yyyy", { locale: es })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatCurrencyShort(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace('.0', '')}k€`
  }
  return `${Math.round(amount)}€`
}

// Data is fetched by parent component
</script>

<style lang="scss" scoped>
.activity-heatmap {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--space-3);

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
}

.view-toggle {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);

  button {
    padding: var(--space-1) var(--space-3);
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--duration-fast);

    &.active {
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
      box-shadow: var(--shadow-xs);
    }
  }
}

// Legend
.legend-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.legend-label {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

.legend-scale {
  display: flex;
  gap: 2px;
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

// Heatmap Grid
.heatmap-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  overflow-x: auto;
}

.month-labels {
  display: flex;
  padding-left: 32px;
  gap: 0;
  
  .month-label {
    flex: 1;
    font-size: 0.6875rem;
    color: var(--color-text-tertiary);
    text-transform: capitalize;
    min-width: 50px;
  }
}

.grid-wrapper {
  display: flex;
  gap: var(--space-2);
}

.day-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 2px;

  span {
    height: 12px;
    font-size: 0.625rem;
    color: var(--color-text-tertiary);
    line-height: 12px;
  }
}

.heatmap-grid {
  display: flex;
  gap: 2px;
}

.week-column {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: transform var(--duration-fast);

  &:hover:not(.empty):not(.future) {
    transform: scale(1.3);
  }

  &.empty {
    background: transparent;
    cursor: default;
  }

  &.future {
    background: var(--color-bg-tertiary);
    opacity: 0.3;
    cursor: default;
  }

  &.today {
    outline: 2px solid #635BFF;
    outline-offset: 1px;
  }
}

// Level colors (GitHub-style green gradient)
.level-0 { background: var(--color-bg-tertiary); }
.level-1 { background: rgba(16, 185, 129, 0.2); }
.level-2 { background: rgba(16, 185, 129, 0.4); }
.level-3 { background: rgba(16, 185, 129, 0.6); }
.level-4 { background: rgba(16, 185, 129, 0.8); }
.level-5 { background: #10B981; }

// Tooltip
.tooltip-content {
  text-align: center;
  
  strong {
    display: block;
    margin-bottom: 4px;
    text-transform: capitalize;
  }
  
  .text-positive {
    color: #10B981;
    margin-right: 8px;
  }
  
  .text-negative {
    color: #EF4444;
  }
}

// Stats Summary
.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-light);

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-transform: capitalize;
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
</style>
