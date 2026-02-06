<template>
  <div class="budget-gauge">
    <div class="gauge-header">
      <h3>{{ title }}</h3>
      <q-badge 
        :color="statusColor" 
        text-color="white"
        :label="statusLabel"
      />
    </div>

    <!-- Main Gauge -->
    <div class="gauge-container">
      <svg viewBox="0 0 200 120" class="gauge-svg">
        <!-- Background arc -->
        <path
          :d="backgroundArc"
          fill="none"
          stroke="var(--color-bg-tertiary)"
          stroke-width="20"
          stroke-linecap="round"
        />
        
        <!-- Colored segments -->
        <path
          :d="dangerArc"
          fill="none"
          stroke="#EF4444"
          stroke-width="20"
          stroke-linecap="round"
          opacity="0.3"
        />
        <path
          :d="warningArc"
          fill="none"
          stroke="#F59E0B"
          stroke-width="20"
          stroke-linecap="round"
          opacity="0.3"
        />
        <path
          :d="goodArc"
          fill="none"
          stroke="#10B981"
          stroke-width="20"
          stroke-linecap="round"
          opacity="0.3"
        />
        
        <!-- Progress arc -->
        <path
          :d="progressArc"
          fill="none"
          :stroke="progressColor"
          stroke-width="20"
          stroke-linecap="round"
          class="progress-arc"
        />
        
        <!-- Needle -->
        <g :transform="`rotate(${needleAngle}, 100, 100)`">
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke="var(--color-text-primary)"
            stroke-width="3"
            stroke-linecap="round"
            class="needle"
          />
          <circle
            cx="100"
            cy="100"
            r="8"
            fill="var(--color-text-primary)"
          />
        </g>
        
        <!-- Labels -->
        <text x="25" y="115" class="gauge-label">0%</text>
        <text x="100" y="25" class="gauge-label" text-anchor="middle">100%</text>
        <text x="175" y="115" class="gauge-label" text-anchor="end">200%</text>
      </svg>
      
      <!-- Center value -->
      <div class="gauge-value">
        <span class="value-number" :style="{ color: progressColor }">
          {{ Math.round(percentage) }}%
        </span>
        <span class="value-label">del presupuesto</span>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">Presupuestado</span>
        <span class="stat-value">{{ formatCurrency(budgeted) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ type === 'income' ? 'Ingresado' : 'Gastado' }}</span>
        <span class="stat-value" :class="type">{{ formatCurrency(actual) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Diferencia</span>
        <span class="stat-value" :class="differenceClass">
          {{ difference >= 0 ? '+' : '' }}{{ formatCurrency(difference) }}
        </span>
      </div>
    </div>

    <!-- Progress towards year end -->
    <div class="time-context">
      <div class="time-bar">
        <div class="time-progress" :style="{ width: `${timeProgress}%` }"></div>
      </div>
      <span class="time-label">
        {{ timeProgress.toFixed(0) }}% de la temporada transcurrido
      </span>
    </div>

    <!-- Insight -->
    <div class="insight-box" :class="insightType">
      <q-icon :name="insightIcon" size="20px" />
      <span>{{ insightText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from 'src/utils/formatters'

interface Props {
  title?: string
  type?: 'income' | 'expense'
  actual: number
  budgeted: number
  seasonStartMonth?: number // 0-11, default September (8)
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Cumplimiento Presupuesto',
  type: 'income',
  seasonStartMonth: 8 // September
})

// Calculations
const percentage = computed(() => {
  if (props.budgeted === 0) return 0
  return (props.actual / props.budgeted) * 100
})

const difference = computed(() => {
  return props.type === 'income' 
    ? props.actual - props.budgeted
    : props.budgeted - props.actual // For expenses, under budget is positive
})

const differenceClass = computed(() => {
  if (props.type === 'income') {
    return difference.value >= 0 ? 'positive' : 'negative'
  } else {
    return difference.value >= 0 ? 'positive' : 'negative'
  }
})

// Time progress in season
const timeProgress = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), currentMonth + 1, 0).getDate()
  
  // Calculate months elapsed in season (Sept = 0, Aug = 11)
  let monthsInSeason: number
  if (currentMonth >= props.seasonStartMonth) {
    monthsInSeason = currentMonth - props.seasonStartMonth
  } else {
    monthsInSeason = (12 - props.seasonStartMonth) + currentMonth
  }
  
  // Add partial current month
  const partialMonth = currentDay / daysInMonth
  const totalMonths = monthsInSeason + partialMonth
  
  return (totalMonths / 12) * 100
})

// Status
const statusColor = computed(() => {
  const pct = percentage.value
  const timePct = timeProgress.value
  
  if (props.type === 'income') {
    // For income: ahead of schedule is good
    if (pct >= timePct * 1.1) return 'positive'
    if (pct >= timePct * 0.9) return 'info'
    if (pct >= timePct * 0.7) return 'warning'
    return 'negative'
  } else {
    // For expenses: under budget is good
    if (pct <= timePct * 0.9) return 'positive'
    if (pct <= timePct * 1.1) return 'info'
    if (pct <= timePct * 1.3) return 'warning'
    return 'negative'
  }
})

const statusLabel = computed(() => {
  const color = statusColor.value
  if (color === 'positive') return props.type === 'income' ? 'Por encima' : 'Bajo control'
  if (color === 'info') return 'En línea'
  if (color === 'warning') return 'Atención'
  return 'Crítico'
})

// SVG Arc calculations
const createArc = (startAngle: number, endAngle: number) => {
  const radius = 70
  const centerX = 100
  const centerY = 100
  
  const start = polarToCartesian(centerX, centerY, radius, endAngle)
  const end = polarToCartesian(centerX, centerY, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
  
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  }
}

const backgroundArc = computed(() => createArc(-90, 90))
const dangerArc = computed(() => createArc(-90, -30))
const warningArc = computed(() => createArc(-30, 30))
const goodArc = computed(() => createArc(30, 90))

const progressArc = computed(() => {
  const pct = Math.min(200, Math.max(0, percentage.value))
  const angle = -90 + (pct / 200) * 180
  return createArc(-90, angle)
})

const needleAngle = computed(() => {
  const pct = Math.min(200, Math.max(0, percentage.value))
  return -90 + (pct / 200) * 180
})

const progressColor = computed(() => {
  const pct = percentage.value
  if (props.type === 'income') {
    if (pct >= 100) return '#10B981'
    if (pct >= 70) return '#F59E0B'
    return '#EF4444'
  } else {
    if (pct <= 100) return '#10B981'
    if (pct <= 130) return '#F59E0B'
    return '#EF4444'
  }
})

// Insight
const insightType = computed(() => {
  if (statusColor.value === 'positive') return 'success'
  if (statusColor.value === 'info') return 'info'
  if (statusColor.value === 'warning') return 'warning'
  return 'danger'
})

const insightIcon = computed(() => {
  if (statusColor.value === 'positive') return 'check_circle'
  if (statusColor.value === 'info') return 'info'
  if (statusColor.value === 'warning') return 'warning'
  return 'error'
})

const insightText = computed(() => {
  const pct = percentage.value
  const timePct = timeProgress.value
  
  if (props.type === 'income') {
    if (pct >= timePct * 1.1) {
      return `Los ingresos van un ${((pct / timePct - 1) * 100).toFixed(0)}% por encima de lo esperado para este punto de la temporada.`
    }
    if (pct >= timePct * 0.9) {
      return 'Los ingresos están en línea con lo presupuestado.'
    }
    return `Los ingresos van un ${((1 - pct / timePct) * 100).toFixed(0)}% por debajo de lo esperado. Considera acciones correctivas.`
  } else {
    if (pct <= timePct * 0.9) {
      return `Los gastos están un ${((1 - pct / timePct) * 100).toFixed(0)}% por debajo de lo presupuestado. ¡Buen control!`
    }
    if (pct <= timePct * 1.1) {
      return 'Los gastos están en línea con el presupuesto.'
    }
    return `Los gastos superan lo presupuestado en un ${((pct / timePct - 1) * 100).toFixed(0)}%. Revisa las partidas afectadas.`
  }
})

</script>

<style lang="scss" scoped>
.budget-gauge {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
}

.gauge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.gauge-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-svg {
  width: 100%;
  max-width: 250px;
  height: auto;

  .gauge-label {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    fill: var(--color-text-tertiary);
  }

  .progress-arc {
    transition: d 0.5s ease-out;
  }

  .needle {
    transition: transform 0.5s ease-out;
    transform-origin: 100px 100px;
  }
}

.gauge-value {
  position: absolute;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .value-number {
    font-family: 'DM Sans', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
  }

  .value-label {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-value {
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);

  &.income { color: #10B981; }
  &.expense { color: #EF4444; }
  &.positive { color: #10B981; }
  &.negative { color: #EF4444; }
}

.time-context {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.time-bar {
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.time-progress {
  height: 100%;
  background: linear-gradient(90deg, #635BFF, #818CF8);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.time-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  text-align: center;
}

.insight-box {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  line-height: 1.4;

  &.success {
    background: rgba(16, 185, 129, 0.08);
    color: #059669;
  }

  &.info {
    background: rgba(99, 91, 255, 0.08);
    color: #635BFF;
  }

  &.warning {
    background: rgba(245, 158, 11, 0.08);
    color: #D97706;
  }

  &.danger {
    background: rgba(239, 68, 68, 0.08);
    color: #DC2626;
  }

  .q-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }
}
</style>
