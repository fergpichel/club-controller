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
              v-model="parentCategoryId"
              :options="parentCategoryFilter.options.value"
              label="Categoría"
              outlined
              emit-value
              map-options
              clearable
              use-input
              input-debounce="0"
              hint="Dejar vacío para 'Sin categorizar'"
              class="q-mb-md"
              @filter="parentCategoryFilter.filter"
              @update:model-value="onParentCategoryChange"
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

            <q-select
              v-if="subcategoryOptions.length > 0"
              v-model="subcategoryId"
              :options="subcategoryFilter.options.value"
              label="Subcategoría (opcional)"
              outlined
              emit-value
              map-options
              clearable
              use-input
              input-debounce="0"
              class="q-mb-md"
              hint="Especifica el tipo exacto de gasto/ingreso"
              @filter="subcategoryFilter.filter"
            >
              <template #prepend>
                <q-icon name="subdirectory_arrow_right" />
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
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="payment" />
              </template>
            </q-select>

            <q-select
              v-model="season"
              :options="seasonOptions"
              label="Temporada"
              outlined
              emit-value
              map-options
              clearable
              hint="Auto-calculada desde la fecha. Solo cambiar en excepciones."
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="date_range" />
              </template>
            </q-select>

            <q-input
              v-model="paidDate"
              label="Fecha de cobro / pago real"
              outlined
              hint="Dejar vacío si coincide con la fecha de la transacción"
              clearable
            >
              <template #prepend>
                <q-icon name="event_available" />
              </template>
              <template #append>
                <q-icon name="edit_calendar" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="paidDate" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Cerrar" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </q-card-section>
        </q-card>

        <!-- Tax breakdown (optional) -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="section-title q-mb-sm">Desglose fiscal (opcional)</div>
            <p class="text-caption text-grey q-mb-md">Si aplica IVA, el importe total se calculará automáticamente</p>

            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-input
                  v-model.number="baseAmount"
                  label="Base imponible"
                  outlined
                  type="number"
                  step="0.01"
                  prefix="€"
                  @update:model-value="calculateFromBase"
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="taxRate"
                  :options="taxRateOptions"
                  label="IVA"
                  outlined
                  emit-value
                  map-options
                  @update:model-value="calculateFromBase"
                />
              </div>
            </div>

            <div v-if="baseAmount && taxRate" class="tax-summary q-mt-md">
              <div class="tax-row">
                <span>Base:</span>
                <span>{{ formatCurrency(baseAmount) }}</span>
              </div>
              <div class="tax-row">
                <span>IVA ({{ taxRate }}%):</span>
                <span>{{ formatCurrency(taxAmount) }}</span>
              </div>
              <div class="tax-row total">
                <span>Total:</span>
                <span>{{ formatCurrency((baseAmount || 0) + taxAmount) }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Assignment -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="section-title q-mb-md">Asignación (opcional)</div>

            <q-select
              v-model="teamId"
              :options="teamFilter.options.value"
              label="Equipo"
              outlined
              emit-value
              map-options
              clearable
              use-input
              input-debounce="0"
              class="q-mb-md"
              @filter="teamFilter.filter"
            >
              <template #prepend>
                <q-icon name="groups" />
              </template>
            </q-select>

            <q-select
              v-model="projectId"
              :options="projectFilter.options.value"
              label="Proyecto"
              outlined
              emit-value
              map-options
              clearable
              use-input
              input-debounce="0"
              class="q-mb-md"
              @filter="projectFilter.filter"
            >
              <template #prepend>
                <q-icon name="folder" />
              </template>
            </q-select>

            <q-select
              v-model="eventId"
              :options="eventFilter.options.value"
              label="Evento"
              outlined
              emit-value
              map-options
              clearable
              use-input
              input-debounce="0"
              class="q-mb-md"
              @filter="eventFilter.filter"
            >
              <template #prepend>
                <q-icon name="event" />
              </template>
            </q-select>

            <q-select
              v-if="transactionType === 'income'"
              v-model="sponsorId"
              :options="sponsorFilter.options.value"
              label="Patrocinador"
              outlined
              emit-value
              map-options
              clearable
              use-input
              input-debounce="0"
              class="q-mb-md"
              @filter="sponsorFilter.filter"
            >
              <template #prepend>
                <q-icon name="handshake" />
              </template>
            </q-select>

            <q-select
              v-if="transactionType === 'expense'"
              v-model="supplierId"
              :options="supplierFilter.options.value"
              label="Proveedor"
              outlined
              emit-value
              map-options
              clearable
              use-input
              input-debounce="0"
              @filter="supplierFilter.filter"
            >
              <template #prepend>
                <q-icon name="local_shipping" />
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
import { useCatalogsStore } from 'src/stores/catalogs';
import type { PaymentMethod, Attachment, Season } from 'src/types';
import { getSeasonOptions } from 'src/types';
import { formatCurrency } from 'src/utils/formatters'
import { useSelectFilter } from 'src/composables/useSelectFilter'
import { logger } from 'src/utils/logger'

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
const catalogsStore = useCatalogsStore();

// State
const loading = ref(false);
const _editingType = ref<string | null>(null);
const transactionType = computed(() => _editingType.value || props.type || route.params.type as string || 'expense');
const isEditing = computed(() => !!props.id || !!route.params.id);

// Form fields
const amount = ref<number | null>(null);
const description = ref('');
const parentCategoryId = ref<string | null>(null);
const subcategoryId = ref<string | null>(null);
const date = ref(format(new Date(), 'yyyy-MM-dd'));

// The actual categoryId used for saving (subcategory if selected, else parent)
const categoryId = computed(() => subcategoryId.value || parentCategoryId.value);
const paymentMethod = ref<PaymentMethod>('bank_transfer');
const teamId = ref<string | null>(null);
const projectId = ref<string | null>(null);
const eventId = ref<string | null>(null);
const season = ref<Season | null>(null);
const seasonOptions = getSeasonOptions();
const paidDate = ref<string | null>(null);
const baseAmount = ref<number | null>(null);
const taxRate = ref<number | null>(null);
const taxAmount = computed(() => {
  if (!baseAmount.value || !taxRate.value) return 0;
  return Math.round(baseAmount.value * taxRate.value / 100 * 100) / 100;
});
const sponsorId = ref<string | null>(null);
const supplierId = ref<string | null>(null);
const vendor = ref('');
const invoiceNumber = ref('');
const reference = ref('');
const newAttachments = ref<File[]>([]);
const existingAttachments = ref<Attachment[]>([]);

const taxRateOptions = [
  { label: 'Sin IVA', value: null },
  { label: '4% (Superreducido)', value: 4 },
  { label: '10% (Reducido)', value: 10 },
  { label: '21% (General)', value: 21 }
];

function calculateFromBase() {
  if (baseAmount.value && taxRate.value) {
    amount.value = Math.round((baseAmount.value + taxAmount.value) * 100) / 100;
  }
}

// Options - Categories with hierarchy
const parentCategoryOptionsAll = computed(() => {
  const categories = transactionType.value === 'income'
    ? categoriesStore.incomeParentCategories
    : categoriesStore.expenseParentCategories;

  return categories.map(c => ({
    label: c.name,
    value: c.id,
    icon: c.icon,
    color: c.color
  }));
});

const subcategoryOptions = computed(() => {
  if (!parentCategoryId.value) return [];
  
  const subcategories = categoriesStore.getSubcategories(parentCategoryId.value);
  
  return subcategories.map(c => ({
    label: c.name,
    value: c.id,
    icon: c.icon,
    color: c.color
  }));
});

function onParentCategoryChange() {
  // Reset subcategory when parent changes
  subcategoryId.value = null;
}

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

const sponsorOptions = computed(() => {
  return catalogsStore.activeSponsors.map(s => ({
    label: s.name,
    value: s.id
  }));
});

const supplierOptions = computed(() => {
  return catalogsStore.activeSuppliers.map(s => ({
    label: s.name,
    value: s.id
  }));
});

const paymentMethodOptions = [
  { label: 'Transferencia bancaria', value: 'bank_transfer' },
  { label: 'Efectivo', value: 'cash' },
  { label: 'Tarjeta', value: 'card' },
  { label: 'Cheque', value: 'check' },
  { label: 'Otro', value: 'other' }
];

// Searchable filter wrappers
const parentCategoryFilter = useSelectFilter(parentCategoryOptionsAll)
const subcategoryFilter = useSelectFilter(subcategoryOptions)
const teamFilter = useSelectFilter(teamOptions)
const projectFilter = useSelectFilter(projectOptions)
const eventFilter = useSelectFilter(eventOptions)
const sponsorFilter = useSelectFilter(sponsorOptions)
const supplierFilter = useSelectFilter(supplierOptions)

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

  loading.value = true;

  try {
    // If no category selected, use uncategorized
    const finalCategoryId = categoryId.value || categoriesStore.getUncategorizedId(transactionType.value as 'income' | 'expense');
    const selectedCategory = categoriesStore.getCategoryById(finalCategoryId);
    const selectedTeam = teamId.value ? teamsStore.getTeamById(teamId.value) : null;
    const selectedProject = projectId.value ? teamsStore.getProjectById(projectId.value) : null;
    const selectedEvent = eventId.value ? teamsStore.getEventById(eventId.value) : null;

    const transactionData = {
      type: transactionType.value as 'income' | 'expense',
      amount: amount.value,
      description: description.value,
      categoryId: finalCategoryId,
      categoryName: selectedCategory?.name || 'Sin categorizar',
      season: season.value || undefined,
      date: new Date(date.value),
      paidDate: paidDate.value ? new Date(paidDate.value) : undefined,
      paymentMethod: paymentMethod.value,
      baseAmount: baseAmount.value || undefined,
      taxRate: taxRate.value || undefined,
      taxAmount: taxAmount.value || undefined,
      teamId: teamId.value || undefined,
      teamName: selectedTeam?.name,
      projectId: projectId.value || undefined,
      projectName: selectedProject?.name,
      eventId: eventId.value || undefined,
      eventName: selectedEvent?.name,
      sponsorId: sponsorId.value || undefined,
      sponsorName: sponsorId.value ? catalogsStore.getSponsorById(sponsorId.value)?.name : undefined,
      supplierId: supplierId.value || undefined,
      supplierName: supplierId.value ? catalogsStore.getSupplierById(supplierId.value)?.name : undefined,
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
    logger.error('Error saving transaction:', error);
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
  // Ensure categories, teams, and catalogs are loaded for the form
  await Promise.all([
    categoriesStore.fetchCategories(),
    teamsStore.fetchAll(),
    catalogsStore.fetchAll()
  ]);

  if (isEditing.value) {
    const id = props.id || route.params.id as string;
    const transaction = transactionsStore.getTransactionById(id);

    if (transaction) {
      // Set the type from the existing transaction so the form
      // shows the correct header / categories (income vs expense)
      _editingType.value = transaction.type;

      amount.value = transaction.amount;
      description.value = transaction.description;
      
      // Load category hierarchy
      const category = categoriesStore.getCategoryById(transaction.categoryId);
      if (category) {
        if (category.parentId) {
          // It's a subcategory
          parentCategoryId.value = category.parentId;
          subcategoryId.value = category.id;
        } else {
          // It's a parent category
          parentCategoryId.value = category.id;
          subcategoryId.value = null;
        }
      }
      
      date.value = format(new Date(transaction.date), 'yyyy-MM-dd');
      paymentMethod.value = transaction.paymentMethod;
      season.value = transaction.season || null;
      teamId.value = transaction.teamId || null;
      projectId.value = transaction.projectId || null;
      eventId.value = transaction.eventId || null;
      paidDate.value = transaction.paidDate ? format(new Date(transaction.paidDate), 'yyyy-MM-dd') : null;
      baseAmount.value = transaction.baseAmount || null;
      taxRate.value = transaction.taxRate || null;
      sponsorId.value = transaction.sponsorId || null;
      supplierId.value = transaction.supplierId || null;
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

.tax-summary {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  
  .tax-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    
    &.total {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 4px;
      padding-top: 8px;
      font-weight: 600;
      color: #fff;
    }
  }
}

:deep(.q-field) {
  .q-field__control {
    border-radius: 12px;
  }
}
</style>
