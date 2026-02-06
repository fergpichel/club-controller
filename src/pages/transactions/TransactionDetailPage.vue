<template>
  <q-page class="transaction-detail-page">
    <!-- Header -->
    <div class="page-header" :class="transaction?.type || 'expense'">
      <div class="row items-center">
        <q-btn
          flat
          round
          icon="arrow_back"
          color="white"
          @click="$router.back()"
        />
        <div class="q-ml-sm">
          <h1>Detalle de {{ transaction?.type === 'income' ? 'ingreso' : 'gasto' }}</h1>
        </div>
      </div>
    </div>

    <div v-if="transaction" class="page-content q-pa-md">
      <!-- Amount card -->
      <q-card class="amount-card q-mb-md text-center">
        <q-card-section>
          <div class="amount" :class="transaction.type">
            {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
          </div>
          <div class="description" :class="{ 'is-masked-text': descriptionHidden }">
            {{ descriptionHidden ? '••••••••••••••' : transaction.description }}
            <q-btn
              v-if="descriptionHidden || isTemporarilyRevealed"
              flat
              round
              dense
              size="sm"
              :icon="descriptionHidden ? 'visibility' : 'visibility_off'"
              class="reveal-btn-inline"
              @click="toggleReveal"
            >
              <q-tooltip>{{ descriptionHidden ? 'Mostrar concepto (5s)' : 'Ocultar concepto' }}</q-tooltip>
            </q-btn>
          </div>
          <q-badge
            :color="statusColor"
            :label="statusLabel"
            class="q-mt-sm"
          />
        </q-card-section>
      </q-card>

      <!-- Details -->
      <q-card class="q-mb-md">
        <q-list>
          <q-item>
            <q-item-section avatar>
              <q-icon name="category" :color="categoryColor" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>Categoría</q-item-label>
              <q-item-label>{{ transaction.categoryName || 'Sin categoría' }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator inset="item" />

          <q-item>
            <q-item-section avatar>
              <q-icon name="event" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>Fecha</q-item-label>
              <q-item-label>{{ formatDateLong(transaction.date) }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator inset="item" />

          <q-item>
            <q-item-section avatar>
              <q-icon name="payment" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>Método de pago</q-item-label>
              <q-item-label>{{ paymentMethodLabel }}</q-item-label>
            </q-item-section>
          </q-item>

          <template v-if="transaction.teamName">
            <q-separator inset="item" />
            <q-item clickable :to="{ name: 'team-detail', params: { id: transaction.teamId } }">
              <q-item-section avatar>
                <q-icon name="groups" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Equipo</q-item-label>
                <q-item-label>{{ transaction.teamName }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </template>

          <template v-if="transaction.projectName">
            <q-separator inset="item" />
            <q-item clickable :to="{ name: 'project-detail', params: { id: transaction.projectId } }">
              <q-item-section avatar>
                <q-icon name="folder" color="secondary" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Proyecto</q-item-label>
                <q-item-label>{{ transaction.projectName }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </template>

          <template v-if="transaction.eventName">
            <q-separator inset="item" />
            <q-item clickable :to="{ name: 'event-detail', params: { id: transaction.eventId } }">
              <q-item-section avatar>
                <q-icon name="event" color="accent" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Evento</q-item-label>
                <q-item-label>{{ transaction.eventName }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </template>

          <template v-if="transaction.vendor">
            <q-separator inset="item" />
            <q-item>
              <q-item-section avatar>
                <q-icon name="storefront" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>{{ transaction.type === 'income' ? 'Pagador' : 'Proveedor' }}</q-item-label>
                <q-item-label>{{ transaction.vendor }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <template v-if="transaction.invoiceNumber">
            <q-separator inset="item" />
            <q-item>
              <q-item-section avatar>
                <q-icon name="receipt" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Nº factura / referencia</q-item-label>
                <q-item-label>{{ transaction.invoiceNumber }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <template v-if="transaction.reference">
            <q-separator inset="item" />
            <q-item>
              <q-item-section avatar>
                <q-icon name="notes" />
              </q-item-section>
              <q-item-section>
                <q-item-label caption>Notas</q-item-label>
                <q-item-label>{{ transaction.reference }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-card>

      <!-- Attachments -->
      <q-card v-if="transaction.attachments && transaction.attachments.length > 0" class="q-mb-md">
        <q-card-section>
          <div class="section-title q-mb-md">Adjuntos</div>
          <div class="attachments-grid">
            <div
              v-for="attachment in transaction.attachments"
              :key="attachment.id"
              class="attachment-item"
              @click="openAttachment(attachment)"
            >
              <q-icon
                :name="getAttachmentIcon(attachment.type)"
                size="32px"
                color="primary"
              />
              <span class="attachment-name">{{ attachment.name }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Audit info -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="section-title q-mb-md">Información de auditoría</div>
          <div class="audit-row">
            <span class="audit-label">Creado por:</span>
            <span>{{ transaction.createdByName || 'Usuario' }}</span>
          </div>
          <div class="audit-row">
            <span class="audit-label">Fecha creación:</span>
            <span>{{ formatDateTime(transaction.createdAt) }}</span>
          </div>
          <template v-if="transaction.approvedBy">
            <div class="audit-row">
              <span class="audit-label">Aprobado por:</span>
              <span>{{ transaction.approvedBy }}</span>
            </div>
            <div v-if="transaction.approvedAt" class="audit-row">
              <span class="audit-label">Fecha aprobación:</span>
              <span>{{ formatDateTime(transaction.approvedAt) }}</span>
            </div>
          </template>
        </q-card-section>
      </q-card>

      <!-- Actions -->
      <div class="actions-row">
        <template v-if="transaction.status === 'pending' && authStore.canApprove">
          <q-btn
            color="positive"
            icon="check"
            label="Aprobar"
            class="action-btn"
            :loading="loading"
            @click="handleApprove"
          />
          <q-btn
            color="negative"
            icon="close"
            label="Rechazar"
            class="action-btn"
            outline
            :loading="loading"
            @click="handleReject"
          />
        </template>

        <template v-if="canEdit">
          <q-btn
            color="primary"
            icon="edit"
            label="Editar"
            class="action-btn"
            outline
            :to="{ name: 'edit-transaction', params: { id: transaction.id } }"
          />
          <q-btn
            color="negative"
            icon="delete"
            label="Eliminar"
            class="action-btn"
            flat
            @click="confirmDelete"
          />
        </template>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else class="text-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { useTransactionsStore } from 'src/stores/transactions';
import { useCategoriesStore } from 'src/stores/categories';
import { useSensitiveData } from 'src/composables/useSensitiveData';
import type { Attachment } from 'src/types';
import { formatCurrency, formatDateLong, formatDateTime } from 'src/utils/formatters'

const props = defineProps<{
  id?: string;
}>();

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const transactionsStore = useTransactionsStore();
const categoriesStore = useCategoriesStore();

const {
  isDescriptionMasked,
  revealDescription,
  hideDescription,
  isRevealed
} = useSensitiveData();

const loading = ref(false);

const transactionId = computed(() => props.id || route.params.id as string);

const transaction = computed(() => {
  return transactionsStore.getTransactionById(transactionId.value);
});

/** Whether the description should be hidden (privacy mode) */
const descriptionHidden = computed(() => {
  if (!transaction.value) return false;
  return isDescriptionMasked(transaction.value);
});

const isTemporarilyRevealed = computed(() => {
  if (!transaction.value) return false;
  return isRevealed(transaction.value.id);
});

function toggleReveal() {
  if (!transaction.value) return;
  if (descriptionHidden.value) {
    revealDescription(transaction.value.id);
  } else {
    hideDescription(transaction.value.id);
  }
}

const category = computed(() => {
  if (!transaction.value) return null;
  return categoriesStore.getCategoryById(transaction.value.categoryId);
});

const categoryColor = computed(() => category.value?.color || 'grey');

const canEdit = computed(() => {
  if (!transaction.value) return false;
  if (transaction.value.monthClosed) return false;
  return authStore.canEdit;
});

const statusColor = computed(() => {
  const statusColors: Record<string, string> = {
    pending: 'warning',
    approved: 'positive',
    rejected: 'negative',
    paid: 'info'
  };
  return statusColors[transaction.value?.status || 'pending'];
});

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    paid: 'Pagado'
  };
  return labels[transaction.value?.status || 'pending'];
});

const paymentMethodLabel = computed(() => {
  const methods: Record<string, string> = {
    bank_transfer: 'Transferencia bancaria',
    cash: 'Efectivo',
    card: 'Tarjeta',
    check: 'Cheque',
    other: 'Otro'
  };
  return methods[transaction.value?.paymentMethod || 'other'];
});

function getAttachmentIcon(type: string): string {
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'picture_as_pdf';
  return 'attach_file';
}

function openAttachment(attachment: Attachment) {
  window.open(attachment.url, '_blank');
}

async function handleApprove() {
  loading.value = true;
  const success = await transactionsStore.approveTransaction(transactionId.value);
  loading.value = false;

  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Transacción aprobada'
    });
  }
}

async function handleReject() {
  loading.value = true;
  const success = await transactionsStore.rejectTransaction(transactionId.value);
  loading.value = false;

  if (success) {
    $q.notify({
      type: 'info',
      message: 'Transacción rechazada'
    });
  }
}

function confirmDelete() {
  $q.dialog({
    title: 'Eliminar transacción',
    message: '¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer.',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    loading.value = true;
    const success = await transactionsStore.deleteTransaction(transactionId.value);
    loading.value = false;

    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Transacción eliminada'
      });
      router.push({ name: 'transactions' });
    }
  });
}

onMounted(async () => {
  // Load categories for display
  await categoriesStore.fetchCategories();
  
  if (!transaction.value) {
    await transactionsStore.fetchTransactions({});
  }
});
</script>

<style lang="scss" scoped>
.transaction-detail-page {
  background: var(--color-background);
}

.page-header {
  &.income {
    background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%);
  }

  &.expense {
    background: linear-gradient(135deg, #C62828 0%, #EF5350 100%);
  }
}

.page-content {
  max-width: 600px;
  margin: 0 auto;
}

.amount-card {
  .amount {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;

    &.income {
      color: var(--color-positive);
    }

    &.expense {
      color: var(--color-negative);
    }
  }

  .description {
    font-size: 1.1rem;
    color: var(--color-on-surface);
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &.is-masked-text {
      color: var(--color-text-muted);
      font-style: italic;
      letter-spacing: 1px;
      user-select: none;
    }
  }

  .reveal-btn-inline {
    color: var(--color-text-muted);
    opacity: 0.6;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
      color: var(--color-accent, #635BFF);
    }
  }
}

.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-on-surface);
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;

  .attachment-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    background: var(--color-surface-variant);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--color-primary);
      color: white;

      :deep(.q-icon) {
        color: white !important;
      }
    }

    .attachment-name {
      font-size: 0.75rem;
      margin-top: 8px;
      text-align: center;
      word-break: break-word;
    }
  }
}

.audit-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 0.9rem;

  &:last-child {
    border-bottom: none;
  }

  .audit-label {
    color: var(--color-on-surface-variant);
  }
}

.actions-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  .action-btn {
    flex: 1;
    min-width: 120px;
  }
}
</style>
