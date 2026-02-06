<template>
  <q-page class="pending-page">
    <!-- Header -->
    <div class="page-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Pendientes de aprobación</h1>
          <p class="header-subtitle">{{ pendingTransactions.length }} transacciones</p>
        </div>
        <q-btn
          v-if="pendingTransactions.length > 0"
          flat
          color="white"
          label="Aprobar todas"
          icon="done_all"
          @click="approveAll"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Pending list -->
      <div v-if="pendingTransactions.length > 0">
        <q-card
          v-for="transaction in pendingTransactions"
          :key="transaction.id"
          class="pending-card q-mb-md animate-stagger"
        >
          <q-card-section>
            <div class="row items-start">
              <!-- Transaction info -->
              <div class="col">
                <div class="row items-center q-mb-sm">
                  <q-icon
                    :name="transaction.type === 'income' ? 'trending_up' : 'trending_down'"
                    :color="transaction.type === 'income' ? 'positive' : 'negative'"
                    size="24px"
                    class="q-mr-sm"
                  />
                  <span class="transaction-amount" :class="transaction.type">
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                  </span>
                </div>
                <div class="transaction-description">{{ transaction.description }}</div>
                <div class="transaction-meta">
                  <q-chip dense size="sm" :style="{ backgroundColor: getCategoryColor(transaction.categoryId) + '20', color: getCategoryColor(transaction.categoryId) }">
                    {{ transaction.categoryName || 'Sin categoría' }}
                  </q-chip>
                  <span v-if="transaction.teamName" class="meta-item">
                    <q-icon name="groups" size="14px" />
                    {{ transaction.teamName }}
                  </span>
                  <span class="meta-item">
                    <q-icon name="event" size="14px" />
                    {{ formatDateCompact(transaction.date) }}
                  </span>
                </div>
                <div class="created-by">
                  Creado por {{ transaction.createdByName || 'Usuario' }}
                </div>
              </div>

              <!-- Actions -->
              <div class="actions-col">
                <q-btn
                  round
                  flat
                  color="positive"
                  icon="check"
                  @click="approve(transaction.id)"
                >
                  <q-tooltip>Aprobar</q-tooltip>
                </q-btn>
                <q-btn
                  round
                  flat
                  color="negative"
                  icon="close"
                  @click="reject(transaction.id)"
                >
                  <q-tooltip>Rechazar</q-tooltip>
                </q-btn>
                <q-btn
                  round
                  flat
                  color="grey"
                  icon="visibility"
                  :to="{ name: 'transaction-detail', params: { id: transaction.id } }"
                >
                  <q-tooltip>Ver detalles</q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-card-section>

          <!-- Attachments indicator -->
          <q-card-section v-if="transaction.attachments?.length" class="q-pt-none">
            <q-chip
              dense
              size="sm"
              icon="attach_file"
              color="grey-3"
            >
              {{ transaction.attachments.length }} adjunto(s)
            </q-chip>
          </q-card-section>
        </q-card>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <q-icon name="check_circle" class="empty-icon text-positive" />
        <p class="empty-title">Todo al día</p>
        <p class="empty-description">No hay transacciones pendientes de aprobación</p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useTransactionsStore } from 'src/stores/transactions';
import { useCategoriesStore } from 'src/stores/categories';
import { formatCurrency, formatDateCompact } from 'src/utils/formatters'

const $q = useQuasar();
const transactionsStore = useTransactionsStore();
const categoriesStore = useCategoriesStore();

const pendingTransactions = computed(() => transactionsStore.pendingTransactions);

function getCategoryColor(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId);
  return category?.color || '#9E9E9E';
}

async function approve(id: string) {
  const success = await transactionsStore.approveTransaction(id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Transacción aprobada'
    });
  }
}

async function reject(id: string) {
  $q.dialog({
    title: 'Rechazar transacción',
    message: '¿Estás seguro de que quieres rechazar esta transacción?',
    cancel: true
  }).onOk(async () => {
    const success = await transactionsStore.rejectTransaction(id);
    if (success) {
      $q.notify({
        type: 'info',
        message: 'Transacción rechazada'
      });
    }
  });
}

async function approveAll() {
  $q.dialog({
    title: 'Aprobar todas',
    message: `¿Aprobar las ${pendingTransactions.value.length} transacciones pendientes?`,
    cancel: true
  }).onOk(async () => {
    $q.loading.show();
    const ids = pendingTransactions.value.map(t => t.id);
    const success = await transactionsStore.batchApproveTransactions(ids);
    $q.loading.hide();
    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Todas las transacciones aprobadas'
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Error al aprobar las transacciones'
      });
    }
  });
}

onMounted(async () => {
  // Ensure categories are loaded for display
  await categoriesStore.fetchCategories();
  transactionsStore.fetchTransactions({ status: 'pending' });
});
</script>

<style lang="scss" scoped>
.pending-page {
  background: var(--color-background);
}

.page-content {
  max-width: 800px;
  margin: 0 auto;
}

.pending-card {
  transition: all 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-lg);
  }

  .transaction-amount {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 1.25rem;

    &.income {
      color: var(--color-positive);
    }

    &.expense {
      color: var(--color-negative);
    }
  }

  .transaction-description {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .transaction-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 8px;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--color-on-surface-variant);
    }
  }

  .created-by {
    font-size: 0.75rem;
    color: var(--color-on-surface-variant);
  }

  .actions-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
