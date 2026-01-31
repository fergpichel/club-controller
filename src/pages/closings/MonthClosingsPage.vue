<template>
  <q-page class="closings-page">
    <!-- Header -->
    <div class="page-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Cierres de mes</h1>
          <p class="header-subtitle">Gestión de períodos contables</p>
        </div>
        <q-select
          v-model="selectedYear"
          :options="yearOptions"
          dense
          outlined
          bg-color="white"
          style="min-width: 100px"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Year summary -->
      <q-card class="q-mb-lg animate-fade-in">
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <h3 class="section-title">Resumen {{ selectedYear }}</h3>
            <q-btn
              v-if="canGenerateForecasts"
              outline
              color="primary"
              label="Generar previsiones"
              icon="analytics"
              :loading="generatingForecasts"
              @click="generateForecasts"
            />
          </div>
          <div class="stats-grid">
            <div class="stat-card stat-positive">
              <div class="stat-value text-positive">{{ formatCurrency(yearSummary.totalIncome) }}</div>
              <div class="stat-label">Ingresos totales</div>
            </div>
            <div class="stat-card stat-negative">
              <div class="stat-value text-negative">{{ formatCurrency(yearSummary.totalExpenses) }}</div>
              <div class="stat-label">Gastos totales</div>
            </div>
            <div class="stat-card stat-neutral">
              <div class="stat-value" :class="yearSummary.balance >= 0 ? 'text-positive' : 'text-negative'">
                {{ formatCurrency(yearSummary.balance) }}
              </div>
              <div class="stat-label">Balance anual</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ closedMonthsCount }}/12</div>
              <div class="stat-label">Meses cerrados</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Months grid -->
      <div class="months-grid">
        <div
          v-for="month in months"
          :key="month.number"
          class="month-card animate-stagger"
          :class="{ 'is-closed': month.closing?.status === 'closed' }"
        >
          <div class="month-header">
            <div class="month-title">{{ month.name }}</div>
            <q-badge
              v-if="month.closing?.status === 'closed'"
              color="positive"
              icon="lock"
            >
              Cerrado
            </q-badge>
            <q-badge
              v-else-if="month.isPast"
              color="warning"
            >
              Pendiente
            </q-badge>
            <q-badge
              v-else
              color="grey"
              outline
            >
              Futuro
            </q-badge>
          </div>

          <div class="month-body">
            <div class="month-summary">
              <div class="summary-item">
                <div class="summary-value text-positive">{{ formatCurrency(month.income) }}</div>
                <div class="summary-label">Ingresos</div>
              </div>
              <div class="summary-item">
                <div class="summary-value text-negative">{{ formatCurrency(month.expenses) }}</div>
                <div class="summary-label">Gastos</div>
              </div>
            </div>

            <div class="month-balance">
              <span class="balance-label">Balance:</span>
              <span class="balance-value" :class="month.balance >= 0 ? 'text-positive' : 'text-negative'">
                {{ formatCurrency(month.balance) }}
              </span>
            </div>

            <div class="month-actions">
              <q-btn
                v-if="month.closing?.status !== 'closed' && month.isPast"
                color="primary"
                label="Cerrar mes"
                icon="lock"
                size="sm"
                class="full-width"
                :loading="closingMonth === month.number"
                @click="closeMonth(month.number)"
              />
              <q-btn
                v-else-if="month.closing?.status === 'closed'"
                outline
                color="primary"
                label="Ver detalle"
                size="sm"
                class="full-width"
                :to="{ name: 'closing-detail', params: { year: selectedYear, month: month.number } }"
              />
              <q-btn
                v-else
                outline
                color="grey"
                label="Ver transacciones"
                size="sm"
                class="full-width"
                :to="{ name: 'transactions' }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Close month dialog -->
    <q-dialog v-model="showCloseDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <q-avatar icon="lock" color="primary" text-color="white" />
          <span class="q-ml-sm text-h6">Cerrar {{ monthToClose }}</span>
        </q-card-section>

        <q-card-section>
          <p>
            Al cerrar el mes, todas las transacciones quedarán bloqueadas y no podrán ser editadas.
            Esta información estará disponible para la gestoría.
          </p>
          <q-input
            v-model="closeNotes"
            label="Notas (opcional)"
            type="textarea"
            rows="3"
            outlined
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" color="grey" />
          <q-btn
            label="Cerrar mes"
            color="primary"
            :loading="closingMonth !== null"
            @click="confirmCloseMonth"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { isBefore, endOfMonth } from 'date-fns';
import { useStatisticsStore } from 'src/stores/statistics';

const $q = useQuasar();
const statisticsStore = useStatisticsStore();

// State
const selectedYear = ref(new Date().getFullYear());
const closingMonth = ref<number | null>(null);
const showCloseDialog = ref(false);
const closeNotes = ref('');
const monthToCloseNumber = ref<number | null>(null);
const generatingForecasts = ref(false);

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2];
});

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const months = computed(() => {
  const now = new Date();
  return monthNames.map((name, index) => {
    const monthNumber = index + 1;
    const monthEnd = endOfMonth(new Date(selectedYear.value, index));
    const isPast = isBefore(monthEnd, now);
    const closing = statisticsStore.getMonthClosingStatus(selectedYear.value, monthNumber);

    // Mock data - in real app, fetch from store
    const income = Math.random() * 10000;
    const expenses = Math.random() * 8000;

    return {
      number: monthNumber,
      name,
      income,
      expenses,
      balance: income - expenses,
      isPast,
      closing
    };
  });
});

const yearSummary = computed(() => {
  const totals = months.value.reduce(
    (acc, month) => ({
      totalIncome: acc.totalIncome + month.income,
      totalExpenses: acc.totalExpenses + month.expenses
    }),
    { totalIncome: 0, totalExpenses: 0 }
  );

  return {
    ...totals,
    balance: totals.totalIncome - totals.totalExpenses
  };
});

const closedMonthsCount = computed(() => {
  return statisticsStore.monthClosings.filter(
    c => c.year === selectedYear.value && c.status === 'closed'
  ).length;
});

const monthToClose = computed(() => {
  if (monthToCloseNumber.value === null) return '';
  return `${monthNames[monthToCloseNumber.value - 1]} ${selectedYear.value}`;
});

const canGenerateForecasts = computed(() => {
  return selectedYear.value === new Date().getFullYear();
});

// Methods
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function closeMonth(monthNumber: number) {
  monthToCloseNumber.value = monthNumber;
  closeNotes.value = '';
  showCloseDialog.value = true;
}

async function confirmCloseMonth() {
  if (monthToCloseNumber.value === null) return;

  closingMonth.value = monthToCloseNumber.value;

  const result = await statisticsStore.closeMonth(
    selectedYear.value,
    monthToCloseNumber.value,
    closeNotes.value
  );

  closingMonth.value = null;
  showCloseDialog.value = false;

  if (result) {
    $q.notify({
      type: 'positive',
      message: `${monthToClose.value} cerrado correctamente`
    });
  } else {
    $q.notify({
      type: 'negative',
      message: 'Error al cerrar el mes'
    });
  }
}

async function generateForecasts() {
  generatingForecasts.value = true;

  try {
    await statisticsStore.generateHistoricalForecasts(selectedYear.value);
    $q.notify({
      type: 'positive',
      message: 'Previsiones generadas basadas en el año anterior'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error al generar previsiones'
    });
  } finally {
    generatingForecasts.value = false;
  }
}

watch(selectedYear, () => {
  statisticsStore.fetchMonthClosings(selectedYear.value);
});

onMounted(() => {
  statisticsStore.fetchMonthClosings(selectedYear.value);
});
</script>

<style lang="scss" scoped>
.closings-page {
  background: var(--color-bg-primary);
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.month-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-border);
  }

  &.is-closed {
    border: 2px solid var(--color-success);

    .month-header {
      background: linear-gradient(135deg, #059669 0%, #10B981 100%);
    }
  }

  .month-header {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border-light);

    .month-title {
      font-family: 'DM Sans', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
    }
  }

  .month-body {
    padding: 16px;

    .month-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;

      .summary-item {
        text-align: center;
        padding: 12px 8px;
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-md);

        .summary-value {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.125rem;
          font-weight: 700;
          display: block;
          margin-bottom: 4px;
        }

        .summary-label {
          font-size: 0.75rem;
          color: var(--color-text-tertiary);
        }
      }
    }

    .month-balance {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-top: 1px solid var(--color-border-light);
      margin-bottom: 12px;

      .balance-label {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .balance-value {
        font-family: 'DM Sans', sans-serif;
        font-weight: 700;
        font-size: 1rem;
      }
    }
  }
}
</style>
