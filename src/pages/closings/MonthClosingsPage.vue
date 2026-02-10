<template>
  <q-page class="closings-page">
    <!-- Header -->
    <div class="page-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Cierres de mes</h1>
          <p class="header-subtitle">Gestión de períodos contables por temporada</p>
        </div>
        <q-select
          v-model="selectedSeason"
          :options="seasonOptions"
          dense
          outlined
          emit-value
          map-options
          bg-color="white"
          style="min-width: 180px"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Season summary -->
      <q-card class="q-mb-lg animate-fade-in">
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <h3 class="section-title">Resumen Temporada {{ selectedSeason }}</h3>
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
              <div class="stat-value text-positive">{{ formatCurrency(seasonSummary.totalIncome) }}</div>
              <div class="stat-label">Ingresos totales</div>
            </div>
            <div class="stat-card stat-negative">
              <div class="stat-value text-negative">{{ formatCurrency(seasonSummary.totalExpenses) }}</div>
              <div class="stat-label">Gastos totales</div>
            </div>
            <div class="stat-card stat-neutral">
              <div class="stat-value" :class="seasonSummary.balance >= 0 ? 'text-positive' : 'text-negative'">
                {{ formatCurrency(seasonSummary.balance) }}
              </div>
              <div class="stat-label">Balance temporada</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ closedMonthsCount }}/12</div>
              <div class="stat-label">Meses cerrados</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Months grid — season order (Jul-Jun) -->
      <div class="months-grid">
        <div
          v-for="month in seasonMonths"
          :key="`${month.year}-${month.number}`"
          class="month-card animate-stagger"
          :class="{ 'is-closed': month.closing?.status === 'closed' }"
        >
          <div class="month-header">
            <div class="month-title">{{ month.name }} {{ month.year }}</div>
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

            <div class="month-count">
              <q-icon name="receipt_long" size="14px" />
              {{ month.transactionCount }} movimientos
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
                @click="closeMonth(month.number, month.year)"
              />
              <q-btn
                v-else-if="month.closing?.status === 'closed'"
                outline
                color="primary"
                label="Ver detalle"
                size="sm"
                class="full-width"
                :to="{ name: 'closing-detail', params: { year: month.year, month: month.number } }"
              />
              <q-btn
                v-else
                outline
                color="primary"
                label="Ver transacciones"
                size="sm"
                class="full-width"
                :to="transactionsLink(month)"
              />
              <q-btn
                v-if="month.closing?.status !== 'closed' && month.isPast"
                flat
                dense
                size="sm"
                label="Ver transacciones"
                class="full-width q-mt-xs"
                :to="transactionsLink(month)"
              />
              <q-btn
                v-else-if="month.closing?.status === 'closed'"
                flat
                dense
                size="sm"
                label="Ver transacciones"
                class="full-width q-mt-xs"
                :to="transactionsLink(month)"
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
import { isBefore, endOfMonth, startOfMonth } from 'date-fns';
import { useStatisticsStore } from 'src/stores/statistics';
import { useTransactionsStore } from 'src/stores/transactions';
import { computeSeason, getSeasonOptions } from 'src/types';
import { formatCurrency } from 'src/utils/formatters'

const $q = useQuasar();
const statisticsStore = useStatisticsStore();
const transactionsStore = useTransactionsStore();

// State
const currentSeason = computeSeason(new Date());
const selectedSeason = ref(currentSeason);
const closingMonth = ref<number | null>(null);
const showCloseDialog = ref(false);
const closeNotes = ref('');
const monthToCloseNumber = ref<number | null>(null);
const monthToCloseYear = ref<number | null>(null);
const generatingForecasts = ref(false);

const seasonOptions = getSeasonOptions();

// Season order: Jul(7), Aug(8), Sep(9), Oct(10), Nov(11), Dec(12), Jan(1), Feb(2), Mar(3), Apr(4), May(5), Jun(6)
const SEASON_MONTHS = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
const monthNames: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
};

// Computed: get start year from season string
const seasonStartYear = computed(() => parseInt(selectedSeason.value.split('/')[0]));

// Build month cards from real transaction data
const seasonMonths = computed(() => {
  const now = new Date();
  const allTransactions = transactionsStore.transactions;
  const startYear = seasonStartYear.value;

  return SEASON_MONTHS.map(monthNum => {
    const year = monthNum >= 7 ? startYear : startYear + 1;
    const monthStart = startOfMonth(new Date(year, monthNum - 1));
    const monthEnd = endOfMonth(new Date(year, monthNum - 1));
    const isPast = isBefore(monthEnd, now);

    // Get real transaction data for this month
    const monthTransactions = allTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= monthStart && tDate <= monthEnd;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const closing = statisticsStore.getMonthClosingStatus(year, monthNum);

    return {
      number: monthNum,
      year,
      name: monthNames[monthNum],
      income,
      expenses,
      balance: income - expenses,
      transactionCount: monthTransactions.length,
      isPast,
      closing
    };
  });
});

const seasonSummary = computed(() => {
  const totals = seasonMonths.value.reduce(
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
  return seasonMonths.value.filter(m => m.closing?.status === 'closed').length;
});

const monthToClose = computed(() => {
  if (monthToCloseNumber.value === null) return '';
  return `${monthNames[monthToCloseNumber.value]} ${monthToCloseYear.value}`;
});

const canGenerateForecasts = computed(() => {
  return selectedSeason.value === currentSeason;
});

// Methods

/** Link to transactions page filtered by this month (query month=YYYY-MM) */
function transactionsLink(month: { year: number; number: number }) {
  const monthStr = `${month.year}-${String(month.number).padStart(2, '0')}`;
  return { name: 'transactions' as const, query: { month: monthStr } };
}

function closeMonth(monthNumber: number, year: number) {
  monthToCloseNumber.value = monthNumber;
  monthToCloseYear.value = year;
  closeNotes.value = '';
  showCloseDialog.value = true;
}

async function confirmCloseMonth() {
  if (monthToCloseNumber.value === null || monthToCloseYear.value === null) return;

  closingMonth.value = monthToCloseNumber.value;

  const result = await statisticsStore.closeMonth(
    monthToCloseYear.value,
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
    await statisticsStore.generateHistoricalForecasts(seasonStartYear.value);
    $q.notify({
      type: 'positive',
      message: 'Previsiones generadas basadas en la temporada anterior'
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Error al generar previsiones'
    });
  } finally {
    generatingForecasts.value = false;
  }
}

watch(selectedSeason, () => {
  const startYear = parseInt(selectedSeason.value.split('/')[0]);
  // Fetch closings for both years of the season
  statisticsStore.fetchMonthClosings(startYear);
  statisticsStore.fetchMonthClosings(startYear + 1);
});

onMounted(() => {
  const startYear = seasonStartYear.value;
  statisticsStore.fetchMonthClosings(startYear);
  statisticsStore.fetchMonthClosings(startYear + 1);
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

    .month-count {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--color-text-tertiary);
      padding-bottom: 12px;
    }
  }
}
</style>
