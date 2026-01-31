<template>
  <q-page class="accountant-page">
    <!-- Header -->
    <div class="page-header accountant-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Vista Gestoría</h1>
          <p class="header-subtitle">Acceso a documentación y cierres</p>
        </div>
        <q-btn
          color="white"
          text-color="primary"
          icon="download"
          label="Exportar"
          :to="{ name: 'accountant-export' }"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Period selector -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="row q-col-gutter-md items-center">
            <div class="col-12 col-sm-4">
              <q-select
                v-model="selectedYear"
                :options="yearOptions"
                label="Año"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="selectedMonth"
                :options="monthOptions"
                label="Mes"
                outlined
                dense
                emit-value
                map-options
                clearable
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-btn
                color="primary"
                label="Filtrar"
                icon="filter_list"
                class="full-width"
                @click="applyFilters"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Closed months -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <h3 class="section-title q-mb-md">Meses cerrados disponibles</h3>

          <q-list v-if="closedMonths.length > 0" separator>
            <q-item
              v-for="closing in closedMonths"
              :key="closing.id"
              clickable
              @click="selectClosing(closing)"
            >
              <q-item-section avatar>
                <q-icon name="lock" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ formatMonth(closing.year, closing.month) }}</q-item-label>
                <q-item-label caption>
                  {{ closing.transactionCount }} transacciones
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="closing-amounts">
                  <span class="text-positive">+{{ formatCurrency(closing.totalIncome) }}</span>
                  <span class="text-negative">-{{ formatCurrency(closing.totalExpenses) }}</span>
                </div>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  icon="download"
                  @click.stop="downloadClosing(closing)"
                >
                  <q-tooltip>Descargar</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-else class="empty-state q-py-lg">
            <q-icon name="folder_off" class="empty-icon" />
            <p class="empty-title">Sin cierres</p>
            <p class="empty-description">No hay meses cerrados en este período</p>
          </div>
        </q-card-section>
      </q-card>

      <!-- Selected closing detail -->
      <q-card v-if="selectedClosing" class="q-mb-lg animate-fade-in">
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <h3 class="section-title">
              {{ formatMonth(selectedClosing.year, selectedClosing.month) }}
            </h3>
            <div class="row q-gutter-sm">
              <q-btn
                outline
                color="primary"
                icon="picture_as_pdf"
                label="PDF"
                @click="exportPDF"
              />
              <q-btn
                outline
                color="positive"
                icon="table_chart"
                label="Excel"
                @click="exportExcel"
              />
            </div>
          </div>

          <!-- Summary -->
          <div class="stats-grid q-mb-lg">
            <div class="stat-card stat-positive">
              <div class="stat-value text-positive">{{ formatCurrency(selectedClosing.totalIncome) }}</div>
              <div class="stat-label">Ingresos</div>
            </div>
            <div class="stat-card stat-negative">
              <div class="stat-value text-negative">{{ formatCurrency(selectedClosing.totalExpenses) }}</div>
              <div class="stat-label">Gastos</div>
            </div>
            <div class="stat-card stat-neutral">
              <div class="stat-value" :class="selectedClosing.balance >= 0 ? 'text-positive' : 'text-negative'">
                {{ formatCurrency(selectedClosing.balance) }}
              </div>
              <div class="stat-label">Balance</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ selectedClosing.transactionCount }}</div>
              <div class="stat-label">Transacciones</div>
            </div>
          </div>

          <!-- Category breakdown -->
          <q-tabs v-model="detailTab" dense class="q-mb-md" align="left">
            <q-tab name="income" label="Ingresos" />
            <q-tab name="expenses" label="Gastos" />
            <q-tab name="attachments" label="Documentos" />
          </q-tabs>

          <q-tab-panels v-model="detailTab" animated>
            <q-tab-panel name="income">
              <div v-if="incomeByCategory.length > 0">
                <div
                  v-for="cat in incomeByCategory"
                  :key="cat.categoryId"
                  class="category-row"
                >
                  <span class="category-name">{{ cat.categoryName }}</span>
                  <span class="category-amount text-positive">{{ formatCurrency(cat.total) }}</span>
                </div>
              </div>
              <div v-else class="text-grey-6 text-center q-py-md">Sin datos</div>
            </q-tab-panel>

            <q-tab-panel name="expenses">
              <div v-if="expensesByCategory.length > 0">
                <div
                  v-for="cat in expensesByCategory"
                  :key="cat.categoryId"
                  class="category-row"
                >
                  <span class="category-name">{{ cat.categoryName }}</span>
                  <span class="category-amount text-negative">{{ formatCurrency(cat.total) }}</span>
                </div>
              </div>
              <div v-else class="text-grey-6 text-center q-py-md">Sin datos</div>
            </q-tab-panel>

            <q-tab-panel name="attachments">
              <div v-if="attachments.length > 0" class="attachments-list">
                <q-item
                  v-for="attachment in attachments"
                  :key="attachment.id"
                  clickable
                  @click="openAttachment(attachment)"
                >
                  <q-item-section avatar>
                    <q-icon :name="getAttachmentIcon(attachment.type)" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ attachment.name }}</q-item-label>
                    <q-item-label caption>{{ attachment.transactionDescription }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn flat round icon="download" @click.stop="downloadAttachment(attachment)" />
                  </q-item-section>
                </q-item>
              </div>
              <div v-else class="text-grey-6 text-center q-py-md">
                Sin documentos adjuntos en este período
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>

      <!-- Transactions list -->
      <q-card v-if="selectedClosing">
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <h3 class="section-title">Transacciones del período</h3>
            <q-btn
              flat
              dense
              color="primary"
              icon="download"
              label="Exportar lista"
              @click="exportTransactionsList"
            />
          </div>

          <q-table
            :rows="closingTransactions"
            :columns="transactionColumns"
            row-key="id"
            flat
            bordered
            :pagination="{ rowsPerPage: 20 }"
          >
            <template #body-cell-amount="props">
              <q-td :props="props">
                <span :class="props.row.type === 'income' ? 'text-positive' : 'text-negative'">
                  {{ props.row.type === 'income' ? '+' : '-' }}{{ formatCurrency(props.row.amount) }}
                </span>
              </q-td>
            </template>
            <template #body-cell-attachments="props">
              <q-td :props="props">
                <q-badge v-if="props.row.attachments?.length" color="info">
                  {{ props.row.attachments.length }}
                </q-badge>
                <span v-else class="text-grey-5">-</span>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStatisticsStore } from 'src/stores/statistics';
import { useTransactionsStore } from 'src/stores/transactions';
import { useCategoriesStore } from 'src/stores/categories';
import type { MonthClosing, Attachment } from 'src/types';

const $q = useQuasar();
const statisticsStore = useStatisticsStore();
const transactionsStore = useTransactionsStore();
const categoriesStore = useCategoriesStore();

// State
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref<number | null>(null);
const selectedClosing = ref<MonthClosing | null>(null);
const detailTab = ref('income');

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
});

const monthOptions = [
  { label: 'Enero', value: 1 },
  { label: 'Febrero', value: 2 },
  { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 },
  { label: 'Mayo', value: 5 },
  { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 },
  { label: 'Agosto', value: 8 },
  { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 },
  { label: 'Noviembre', value: 11 },
  { label: 'Diciembre', value: 12 }
];

const transactionColumns = [
  { name: 'date', label: 'Fecha', field: 'date', format: (val: Date) => format(new Date(val), 'dd/MM/yyyy'), sortable: true },
  { name: 'description', label: 'Descripción', field: 'description', align: 'left' as const },
  { name: 'category', label: 'Categoría', field: 'categoryName' },
  { name: 'amount', label: 'Importe', field: 'amount', sortable: true },
  { name: 'invoiceNumber', label: 'Nº Factura', field: 'invoiceNumber' },
  { name: 'vendor', label: 'Proveedor/Pagador', field: 'vendor' },
  { name: 'attachments', label: 'Docs', field: 'attachments' }
];

// Computed
const closedMonths = computed(() => {
  return statisticsStore.monthClosings
    .filter(c => c.status === 'closed' && c.year === selectedYear.value)
    .sort((a, b) => b.month - a.month);
});

const incomeByCategory = computed(() => {
  if (!selectedClosing.value) return [];
  const data = selectedClosing.value.incomeByCategory;
  return Object.entries(data).map(([categoryId, total]) => {
    const category = categoriesStore.getCategoryById(categoryId);
    return {
      categoryId,
      categoryName: category?.name || 'Sin categoría',
      total
    };
  }).sort((a, b) => b.total - a.total);
});

const expensesByCategory = computed(() => {
  if (!selectedClosing.value) return [];
  const data = selectedClosing.value.expensesByCategory;
  return Object.entries(data).map(([categoryId, total]) => {
    const category = categoriesStore.getCategoryById(categoryId);
    return {
      categoryId,
      categoryName: category?.name || 'Sin categoría',
      total
    };
  }).sort((a, b) => b.total - a.total);
});

const closingTransactions = computed(() => {
  if (!selectedClosing.value) return [];
  return transactionsStore.transactions.filter(
    t => t.closedInMonth === `${selectedClosing.value!.year}-${String(selectedClosing.value!.month).padStart(2, '0')}`
  );
});

const attachments = computed(() => {
  const allAttachments: (Attachment & { transactionDescription: string })[] = [];
  closingTransactions.value.forEach(t => {
    if (t.attachments) {
      t.attachments.forEach(a => {
        allAttachments.push({
          ...a,
          transactionDescription: t.description
        });
      });
    }
  });
  return allAttachments;
});

// Methods
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function formatMonth(year: number, month: number): string {
  return format(new Date(year, month - 1), 'MMMM yyyy', { locale: es });
}

function getAttachmentIcon(type: string): string {
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'picture_as_pdf';
  return 'attach_file';
}

function applyFilters() {
  statisticsStore.fetchMonthClosings(selectedYear.value);
  if (selectedMonth.value) {
    const closing = statisticsStore.getMonthClosing(selectedYear.value, selectedMonth.value);
    if (closing) {
      selectClosing(closing);
    }
  }
}

async function selectClosing(closing: MonthClosing) {
  selectedClosing.value = closing;
  await transactionsStore.fetchMonthTransactions(closing.year, closing.month);
}

function downloadClosing(closing: MonthClosing) {
  $q.notify({
    type: 'info',
    message: `Descargando ${formatMonth(closing.year, closing.month)}...`
  });
  // TODO: Implement actual download
}

function openAttachment(attachment: Attachment & { transactionDescription: string }) {
  window.open(attachment.url, '_blank');
}

function downloadAttachment(attachment: Attachment) {
  window.open(attachment.url, '_blank');
}

function exportPDF() {
  $q.notify({
    type: 'info',
    message: 'Generando PDF...'
  });
  // TODO: Implement PDF export
}

function exportExcel() {
  $q.notify({
    type: 'info',
    message: 'Generando Excel...'
  });
  // TODO: Implement Excel export
}

function exportTransactionsList() {
  $q.notify({
    type: 'info',
    message: 'Exportando lista de transacciones...'
  });
  // TODO: Implement export
}

onMounted(() => {
  statisticsStore.fetchMonthClosings(selectedYear.value);
  categoriesStore.fetchCategories();
});
</script>

<style lang="scss" scoped>
.accountant-page {
  background: var(--color-background);
}

.accountant-header {
  background: linear-gradient(135deg, #37474F 0%, #607D8B 100%);
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

.closing-amounts {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
}

.category-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  &:last-child {
    border-bottom: none;
  }

  .category-name {
    font-size: 0.9rem;
  }

  .category-amount {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
  }
}
</style>
