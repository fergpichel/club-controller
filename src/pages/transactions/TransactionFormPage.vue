<template>
  <q-page class="transaction-form-page">
    <!-- Header -->
    <div class="page-header" :class="transactionType">
      <div class="row items-center">
        <q-btn
          flat
          round
          icon="arrow_back"
          color="white"
          @click="$router.back()"
        />
        <div class="q-ml-sm">
          <h1>{{ isEditing ? 'Editar' : 'Nuevo' }} {{ transactionType === 'income' ? 'ingreso' : 'gasto' }}</h1>
        </div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <q-form class="transaction-form" @submit.prevent="handleSubmit">
        <!-- Amount -->
        <q-card class="amount-card q-mb-md">
          <q-card-section class="text-center">
            <label class="amount-label">Importe</label>
            <div class="amount-input-wrapper">
              <span class="currency-symbol">€</span>
              <input
                v-model="amount"
                type="number"
                step="0.01"
                min="0"
                class="amount-input"
                :class="transactionType"
                placeholder="0,00"
                required
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Main details -->
        <q-card class="q-mb-md">
          <q-card-section>
            <q-input
              v-model="description"
              label="Descripción"
              outlined
              :rules="[val => !!val || 'Descripción requerida']"
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="description" />
              </template>
            </q-input>

            <q-select
              v-model="categoryId"
              :options="categoryOptions"
              label="Categoría"
              outlined
              emit-value
              map-options
              :rules="[val => !!val || 'Categoría requerida']"
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="category" />
              </template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon :name="scope.opt.icon" :style="{ color: scope.opt.color }" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input
              v-model="date"
              label="Fecha"
              outlined
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="event" />
              </template>
              <template #append>
                <q-icon name="edit_calendar" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="date" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Cerrar" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-select
              v-model="paymentMethod"
              :options="paymentMethodOptions"
              label="Método de pago"
              outlined
              emit-value
              map-options
            >
              <template #prepend>
                <q-icon name="payment" />
              </template>
            </q-select>
          </q-card-section>
        </q-card>

        <!-- Assignment -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="section-title q-mb-md">Asignación (opcional)</div>

            <q-select
              v-model="teamId"
              :options="teamOptions"
              label="Equipo"
              outlined
              emit-value
              map-options
              clearable
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="groups" />
              </template>
            </q-select>

            <q-select
              v-model="projectId"
              :options="projectOptions"
              label="Proyecto"
              outlined
              emit-value
              map-options
              clearable
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="folder" />
              </template>
            </q-select>

            <q-select
              v-model="eventId"
              :options="eventOptions"
              label="Evento"
              outlined
              emit-value
              map-options
              clearable
            >
              <template #prepend>
                <q-icon name="event" />
              </template>
            </q-select>
          </q-card-section>
        </q-card>

        <!-- Additional info -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="section-title q-mb-md">Información adicional</div>

            <q-input
              v-model="vendor"
              :label="transactionType === 'income' ? 'Pagador' : 'Proveedor'"
              outlined
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="storefront" />
              </template>
            </q-input>

            <q-input
              v-model="invoiceNumber"
              label="Nº de factura / referencia"
              outlined
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="receipt" />
              </template>
            </q-input>

            <q-input
              v-model="reference"
              label="Notas adicionales"
              outlined
              type="textarea"
              rows="2"
            >
              <template #prepend>
                <q-icon name="notes" />
              </template>
            </q-input>
          </q-card-section>
        </q-card>

        <!-- Attachments -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="section-title q-mb-md">Adjuntos</div>

            <q-file
              v-model="newAttachments"
              label="Añadir archivos"
              outlined
              multiple
              accept="image/*,.pdf"
              max-files="5"
              counter
            >
              <template #prepend>
                <q-icon name="attach_file" />
              </template>
              <template #append>
                <q-icon name="cloud_upload" />
              </template>
            </q-file>

            <!-- Existing attachments (if editing) -->
            <div v-if="existingAttachments.length > 0" class="q-mt-md">
              <div class="text-caption text-grey-7 q-mb-sm">Archivos existentes:</div>
              <q-chip
                v-for="attachment in existingAttachments"
                :key="attachment.id"
                removable
                color="primary"
                text-color="white"
                icon="attachment"
                @remove="removeExistingAttachment(attachment.id)"
              >
                {{ attachment.name }}
              </q-chip>
            </div>
          </q-card-section>
        </q-card>

        <!-- Submit button -->
        <q-btn
          type="submit"
          :color="transactionType === 'income' ? 'positive' : 'negative'"
          :label="isEditing ? 'Guardar cambios' : `Registrar ${transactionType === 'income' ? 'ingreso' : 'gasto'}`"
          class="full-width submit-btn"
          size="lg"
          :loading="loading"
        />
      </q-form>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { format } from 'date-fns';
import { useTransactionsStore } from 'src/stores/transactions';
import { useCategoriesStore } from 'src/stores/categories';
import { useTeamsStore } from 'src/stores/teams';
import type { PaymentMethod, Attachment } from 'src/types';

const props = defineProps<{
  type?: string;
  id?: string;
}>();

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const transactionsStore = useTransactionsStore();
const categoriesStore = useCategoriesStore();
const teamsStore = useTeamsStore();

// State
const loading = ref(false);
const transactionType = computed(() => props.type || route.params.type as string || 'expense');
const isEditing = computed(() => !!props.id || !!route.params.id);

// Form fields
const amount = ref<number | null>(null);
const description = ref('');
const categoryId = ref<string | null>(null);
const date = ref(format(new Date(), 'yyyy-MM-dd'));
const paymentMethod = ref<PaymentMethod>('bank_transfer');
const teamId = ref<string | null>(null);
const projectId = ref<string | null>(null);
const eventId = ref<string | null>(null);
const vendor = ref('');
const invoiceNumber = ref('');
const reference = ref('');
const newAttachments = ref<File[]>([]);
const existingAttachments = ref<Attachment[]>([]);

// Options
const categoryOptions = computed(() => {
  const categories = transactionType.value === 'income'
    ? categoriesStore.incomeCategories
    : categoriesStore.expenseCategories;

  return categories.map(c => ({
    label: c.name,
    value: c.id,
    icon: c.icon,
    color: c.color
  }));
});

const teamOptions = computed(() => {
  return teamsStore.activeTeams.map(t => ({
    label: t.name,
    value: t.id
  }));
});

const projectOptions = computed(() => {
  return teamsStore.activeProjects.map(p => ({
    label: p.name,
    value: p.id
  }));
});

const eventOptions = computed(() => {
  return teamsStore.upcomingEvents.map(e => ({
    label: e.name,
    value: e.id
  }));
});

const paymentMethodOptions = [
  { label: 'Transferencia bancaria', value: 'bank_transfer' },
  { label: 'Efectivo', value: 'cash' },
  { label: 'Tarjeta', value: 'card' },
  { label: 'Cheque', value: 'check' },
  { label: 'Otro', value: 'other' }
];

// Methods
function removeExistingAttachment(attachmentId: string) {
  existingAttachments.value = existingAttachments.value.filter(a => a.id !== attachmentId);
}

async function handleSubmit() {
  if (!amount.value || amount.value <= 0) {
    $q.notify({
      type: 'negative',
      message: 'Introduce un importe válido'
    });
    return;
  }

  if (!categoryId.value) {
    $q.notify({
      type: 'negative',
      message: 'Selecciona una categoría'
    });
    return;
  }

  loading.value = true;

  try {
    const selectedCategory = categoriesStore.getCategoryById(categoryId.value);
    const selectedTeam = teamId.value ? teamsStore.getTeamById(teamId.value) : null;
    const selectedProject = projectId.value ? teamsStore.getProjectById(projectId.value) : null;
    const selectedEvent = eventId.value ? teamsStore.getEventById(eventId.value) : null;

    const transactionData = {
      type: transactionType.value as 'income' | 'expense',
      amount: amount.value,
      description: description.value,
      categoryId: categoryId.value,
      categoryName: selectedCategory?.name,
      date: new Date(date.value),
      paymentMethod: paymentMethod.value,
      teamId: teamId.value || undefined,
      teamName: selectedTeam?.name,
      projectId: projectId.value || undefined,
      projectName: selectedProject?.name,
      eventId: eventId.value || undefined,
      eventName: selectedEvent?.name,
      vendor: vendor.value || undefined,
      invoiceNumber: invoiceNumber.value || undefined,
      reference: reference.value || undefined,
      status: 'pending' as const,
      attachments: existingAttachments.value
    };

    let transactionId: string;

    if (isEditing.value) {
      const id = props.id || route.params.id as string;
      await transactionsStore.updateTransaction(id, transactionData);
      transactionId = id;
    } else {
      const result = await transactionsStore.createTransaction(transactionData);
      if (!result) throw new Error('Failed to create transaction');
      transactionId = result.id;
    }

    // Upload new attachments
    if (newAttachments.value.length > 0) {
      for (const file of newAttachments.value) {
        await transactionsStore.uploadAttachment(transactionId, file);
      }
    }

    $q.notify({
      type: 'positive',
      message: isEditing.value ? 'Transacción actualizada' : 'Transacción creada'
    });

    router.push({ name: 'transactions' });
  } catch (error) {
    console.error('Error saving transaction:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al guardar la transacción'
    });
  } finally {
    loading.value = false;
  }
}

// Load categories, teams, and existing transaction if editing
onMounted(async () => {
  // Ensure categories and teams are loaded for the form
  await Promise.all([
    categoriesStore.fetchCategories(),
    teamsStore.fetchAll()
  ]);

  if (isEditing.value) {
    const id = props.id || route.params.id as string;
    const transaction = transactionsStore.getTransactionById(id);

    if (transaction) {
      amount.value = transaction.amount;
      description.value = transaction.description;
      categoryId.value = transaction.categoryId;
      date.value = format(new Date(transaction.date), 'yyyy-MM-dd');
      paymentMethod.value = transaction.paymentMethod;
      teamId.value = transaction.teamId || null;
      projectId.value = transaction.projectId || null;
      eventId.value = transaction.eventId || null;
      vendor.value = transaction.vendor || '';
      invoiceNumber.value = transaction.invoiceNumber || '';
      reference.value = transaction.reference || '';
      existingAttachments.value = transaction.attachments || [];
    }
  }
});
</script>

<style lang="scss" scoped>
.transaction-form-page {
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
  background: var(--color-surface);
  
  .amount-label {
    display: block;
    font-size: 0.9rem;
    color: var(--color-on-surface-variant);
    margin-bottom: 8px;
  }

  .amount-input-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .currency-symbol {
      font-size: 2rem;
      color: var(--color-on-surface-variant);
    }

    .amount-input {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 3rem;
      font-weight: 700;
      width: 200px;
      text-align: center;
      border: none;
      background: transparent;
      outline: none;

      &.income {
        color: var(--color-positive);
      }

      &.expense {
        color: var(--color-negative);
      }

      &::placeholder {
        color: var(--color-on-surface-variant);
        opacity: 0.5;
      }

      // Hide number input spinners
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      -moz-appearance: textfield;
    }
  }
}

.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-on-surface);
}

.submit-btn {
  border-radius: var(--radius-md);
  font-weight: 600;
}

:deep(.q-field) {
  .q-field__control {
    border-radius: 12px;
  }
}
</style>
