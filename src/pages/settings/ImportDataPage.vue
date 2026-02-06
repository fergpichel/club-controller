<template>
  <q-page class="import-page">
    <div class="page-container">
      <!-- Header -->
      <div class="import-header">
        <div class="import-header-content">
          <q-btn flat round icon="arrow_back" class="back-btn" @click="$router.back()" />
          <div>
            <h1>Importar Temporada</h1>
            <p class="subtitle">Carga transacciones desde Excel</p>
          </div>
        </div>
      </div>

      <!-- Steps -->
      <div class="steps-bar">
        <div v-for="s in steps" :key="s.num" :class="['step-item', { active: step >= s.num, current: step === s.num }]">
          <div class="step-num">{{ step > s.num ? '✓' : s.num }}</div>
          <span>{{ s.label }}</span>
        </div>
      </div>

      <!-- ===== STEP 1: Upload & Detect ===== -->
      <section v-if="step === 1" class="step-section">
        <div
          class="drop-zone"
          :class="{ dragging: isDragging, hasFile: !!selectedFile }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" style="display: none" @change="handleFileSelect" />
          <template v-if="!selectedFile">
            <q-icon name="upload_file" size="56px" color="grey-5" />
            <h3>Arrastra tu Excel de temporada</h3>
            <p>o haz clic para seleccionar</p>
            <p class="formats">.xlsx, .xls, .csv</p>
          </template>
          <template v-else>
            <q-icon name="description" size="56px" color="primary" />
            <h3>{{ selectedFile.name }}</h3>
            <p>{{ formatFileSize(selectedFile.size) }}</p>
            <q-btn flat label="Cambiar" color="primary" @click.stop="triggerFileInput" />
          </template>
        </div>

        <!-- Sheet detection results -->
        <div v-if="sheetAnalysis.length > 0" class="config-card">
          <h3><q-icon name="tab" class="q-mr-sm" />Pestañas detectadas</h3>
          <div class="sheets-detected">
            <div v-for="(s, idx) in sheetAnalysis" :key="idx" class="sheet-detected-row">
              <span class="sheet-name">{{ s.name }}</span>
              <q-select
                :model-value="s.detectedAs"
                :options="sheetTypeOptions"
                dense
                outlined
                emit-value
                map-options
                class="sheet-type-select"
                @update:model-value="(val: string) => updateSheetType(idx, val)"
              />
              <span class="sheet-rows" :class="{ dimmed: s.detectedAs === 'skip' }">
                {{ s.detectedAs === 'skip' ? 'Omitir' : `${s.rowCount} filas` }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="selectedFile" class="action-bar">
          <div></div>
          <q-btn
            v-if="sheetAnalysis.length === 0"
            label="Analizar archivo"
            color="primary"
            icon-right="search"
            :loading="parsing"
            @click="parseFile"
          />
          <q-btn
            v-else
            label="Continuar"
            color="primary"
            icon-right="arrow_forward"
            @click="step = 2"
          />
        </div>
      </section>

      <!-- ===== STEP 2: Season + Column Mapping ===== -->
      <section v-if="step === 2" class="step-section">
        <div class="config-card">
          <h3><q-icon name="date_range" class="q-mr-sm" />Temporada</h3>
          <div class="season-selector">
            <q-select
              v-model="seasonStartYear"
              :options="yearOptions"
              label="Año inicio"
              outlined
              dense
              emit-value
              map-options
              class="year-select"
              @update:model-value="seasonEndYear = seasonStartYear + 1"
            />
            <span class="season-slash">/</span>
            <div class="season-end">{{ String(seasonEndYear).slice(-2) }}</div>
          </div>
          <p class="config-hint">Jul {{ seasonStartYear }} — Jun {{ seasonEndYear }}</p>
        </div>

        <!-- Expense column mapping -->
        <div class="config-card">
          <h3><q-icon name="arrow_downward" color="negative" class="q-mr-sm" />Columnas de gastos</h3>
          <p class="config-hint">Mapea las columnas del Excel a los campos de la app. Los campos opcionales se dejan en "No mapear" si no aplican.</p>

          <div v-if="expenseHeaders.length > 0 || Object.values(columnMapping).some(v => v)" class="column-mapping-sections">
            <!-- Basic fields -->
            <div class="mapping-group">
              <div class="mapping-group-title">Datos básicos</div>
              <div class="column-mapping-grid">
                <div v-for="field in expenseColumnFields.filter(f => f.group === 'basic')" :key="field.key" class="mapping-item">
                  <div class="field-label">
                    {{ field.label }}
                    <q-badge v-if="field.required" color="red-4" label="*" class="q-ml-xs" />
                  </div>
                  <q-select
                    v-model="columnMapping[field.key as keyof ColumnMapping]"
                    :options="expenseColumnOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    clearable
                  />
                </div>
              </div>
            </div>

            <!-- Fiscal fields -->
            <div class="mapping-group">
              <div class="mapping-group-title">Desglose fiscal</div>
              <div class="column-mapping-grid">
                <div v-for="field in expenseColumnFields.filter(f => f.group === 'fiscal')" :key="field.key" class="mapping-item">
                  <div class="field-label">{{ field.label }}</div>
                  <q-select
                    v-model="columnMapping[field.key as keyof ColumnMapping]"
                    :options="expenseColumnOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    clearable
                  />
                </div>
              </div>
            </div>

            <!-- Payment fields -->
            <div class="mapping-group">
              <div class="mapping-group-title">Pago / cobro</div>
              <div class="column-mapping-grid">
                <div v-for="field in expenseColumnFields.filter(f => f.group === 'payment')" :key="field.key" class="mapping-item">
                  <div class="field-label">{{ field.label }}</div>
                  <q-select
                    v-model="columnMapping[field.key as keyof ColumnMapping]"
                    :options="expenseColumnOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    clearable
                  />
                </div>
              </div>
            </div>

            <!-- Extra fields -->
            <q-expansion-item
              icon="more_horiz"
              label="Campos adicionales"
              header-class="mapping-group-expansion"
              dense
              default-closed
            >
              <div class="column-mapping-grid q-pa-sm">
                <div v-for="field in expenseColumnFields.filter(f => f.group === 'extra')" :key="field.key" class="mapping-item">
                  <div class="field-label">{{ field.label }}</div>
                  <q-select
                    v-model="columnMapping[field.key as keyof ColumnMapping]"
                    :options="expenseColumnOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    clearable
                  />
                </div>
              </div>
            </q-expansion-item>
          </div>

          <div v-else class="no-headers-warning">
            <q-icon name="warning" color="amber" size="20px" />
            <span>No se detectaron cabeceras en las pestañas de gastos. Verifica que las pestañas estén correctamente clasificadas en el paso anterior.</span>
          </div>
        </div>

        <!-- Income column mapping -->
        <div v-if="hasIncomeTab" class="config-card">
          <h3><q-icon name="arrow_upward" color="positive" class="q-mr-sm" />Columnas de ingresos</h3>
          <p class="config-hint">Las cabeceras se detectan por sección dentro de la pestaña de ingresos. Ajusta si es necesario.</p>

          <div v-if="incomeHeaders.length > 0 || Object.values(incomeColumnMapping).some(v => v)" class="column-mapping-sections">
            <div class="mapping-group">
              <div class="mapping-group-title">Datos básicos</div>
              <div class="column-mapping-grid">
                <div v-for="field in incomeColumnFields.filter(f => f.group === 'basic')" :key="field.key" class="mapping-item">
                  <div class="field-label">
                    {{ field.label }}
                    <q-badge v-if="field.required" color="red-4" label="*" class="q-ml-xs" />
                  </div>
                  <q-select
                    v-model="incomeColumnMapping[field.key as keyof ColumnMapping]"
                    :options="incomeColumnOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    clearable
                  />
                </div>
              </div>
            </div>

            <div class="mapping-group">
              <div class="mapping-group-title">Desglose fiscal</div>
              <div class="column-mapping-grid">
                <div v-for="field in incomeColumnFields.filter(f => f.group === 'fiscal')" :key="field.key" class="mapping-item">
                  <div class="field-label">{{ field.label }}</div>
                  <q-select
                    v-model="incomeColumnMapping[field.key as keyof ColumnMapping]"
                    :options="incomeColumnOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    clearable
                  />
                </div>
              </div>
            </div>

            <div class="mapping-group">
              <div class="mapping-group-title">Pago / cobro</div>
              <div class="column-mapping-grid">
                <div v-for="field in incomeColumnFields.filter(f => f.group === 'payment')" :key="field.key" class="mapping-item">
                  <div class="field-label">{{ field.label }}</div>
                  <q-select
                    v-model="incomeColumnMapping[field.key as keyof ColumnMapping]"
                    :options="incomeColumnOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    clearable
                  />
                </div>
              </div>
            </div>

            <q-expansion-item
              icon="more_horiz"
              label="Campos adicionales"
              header-class="mapping-group-expansion"
              dense
              default-closed
            >
              <div class="column-mapping-grid q-pa-sm">
                <div v-for="field in incomeColumnFields.filter(f => f.group === 'extra')" :key="field.key" class="mapping-item">
                  <div class="field-label">{{ field.label }}</div>
                  <q-select
                    v-model="incomeColumnMapping[field.key as keyof ColumnMapping]"
                    :options="incomeColumnOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    clearable
                  />
                </div>
              </div>
            </q-expansion-item>
          </div>

          <div v-else class="no-headers-warning">
            <q-icon name="info" color="blue" size="20px" />
            <span>Los ingresos se detectan por secciones dentro de la pestaña. Las cabeceras se leen automáticamente para cada mes.</span>
          </div>
        </div>

        <div class="action-bar">
          <q-btn flat label="Atrás" icon="arrow_back" @click="step = 1" />
          <q-btn
            label="Procesar datos"
            color="primary"
            icon-right="arrow_forward"
            :loading="processing"
            :disable="!columnMapping.amount || !columnMapping.concepto"
            @click="processSheets"
          />
        </div>
      </section>

      <!-- ===== STEP 3: Category Mapping ===== -->
      <section v-if="step === 3" class="step-section">
        <div class="step-intro">
          <h2>Asignar categorías</h2>
          <p>
            <strong>{{ totalRows }}</strong> transacciones en
            <strong>{{ parsedMonths.filter(m => m.enabled).length }}</strong> meses.
            <strong>{{ conceptoGroups.length }}</strong> conceptos únicos a mapear.
          </p>
        </div>

        <!-- Quick filters -->
        <div class="mapping-filters">
          <button :class="['filter-pill', { active: conceptoFilter === 'all' }]" @click="conceptoFilter = 'all'">
            Todos ({{ conceptoGroups.length }})
          </button>
          <button :class="['filter-pill', { active: conceptoFilter === 'unmapped' }]" @click="conceptoFilter = 'unmapped'">
            <q-icon name="warning" size="14px" /> Sin categoría ({{ unmappedCount }})
          </button>
          <button :class="['filter-pill income', { active: conceptoFilter === 'income' }]" @click="conceptoFilter = 'income'">
            <q-icon name="arrow_upward" size="14px" /> Ingresos ({{ incomeCount }})
          </button>
          <button :class="['filter-pill expense', { active: conceptoFilter === 'expense' }]" @click="conceptoFilter = 'expense'">
            <q-icon name="arrow_downward" size="14px" /> Gastos ({{ expenseCount }})
          </button>
        </div>

        <!-- Concepto list -->
        <div class="concepto-list">
          <div
            v-for="(group, idx) in filteredGroups"
            :key="`${group.type}-${group.concepto}`"
            class="concepto-card"
            :class="{ mapped: group.categoryId, income: group.type === 'income', expense: group.type === 'expense' }"
          >
            <div class="concepto-header">
              <div class="concepto-info">
                <div class="concepto-name-row">
                  <q-badge :color="group.type === 'income' ? 'positive' : 'negative'" :label="group.type === 'income' ? 'Ingreso' : 'Gasto'" />
                  <span class="concepto-name">{{ group.concepto }}</span>
                </div>
                <div class="concepto-meta">
                  <span>{{ group.count }} mov.</span>
                  <span>·</span>
                  <span>{{ formatCurrency(group.totalAmount) }} total</span>
                  <span v-if="group.count > 1">·</span>
                  <span v-if="group.count > 1">{{ formatCurrency(group.avgAmount) }} media</span>
                </div>
              </div>
            </div>

            <div class="concepto-mapping">
              <q-select
                :model-value="group.categoryId"
                :options="getCategoryOptions(group.type)"
                label="Categoría"
                emit-value
                map-options
                dense
                outlined
                class="category-select"
                @update:model-value="(val: string | null) => setGroupCategory(idx, val)"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon :name="scope.opt.icon || 'circle'" :style="{ color: scope.opt.color }" size="20px" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template #after>
                  <q-btn flat round icon="add" color="primary" size="sm" @click.stop="openCreateCategory(group)">
                    <q-tooltip>Crear categoría nueva</q-tooltip>
                  </q-btn>
                </template>
              </q-select>

              <q-select
                v-if="group.categoryId"
                :model-value="group.teamId"
                :options="[{ label: '— Sin equipo —', value: null }, ...teamOptions]"
                label="Equipo"
                emit-value
                map-options
                dense
                outlined
                clearable
                class="team-select"
                @update:model-value="(val: string | null) => setGroupTeam(idx, val)"
              />
            </div>
          </div>
        </div>

        <div class="action-bar">
          <q-btn flat label="Atrás" icon="arrow_back" @click="step = 2" />
          <q-btn
            label="Revisar importación"
            color="primary"
            icon-right="arrow_forward"
            @click="goToReview"
          />
          <div v-if="unmappedCount > 0" class="unmapped-notice">
            <q-icon name="info" color="amber" size="18px" />
            <span>{{ unmappedCount }} conceptos sin categoría se importarán como "Sin categorizar"</span>
          </div>
        </div>
      </section>

      <!-- ===== STEP 4: Review & Import ===== -->
      <section v-if="step === 4" class="step-section">
        <div class="step-intro">
          <h2>Revisión final — Temporada {{ seasonStartYear }}/{{ seasonEndYear }}</h2>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <q-icon name="receipt_long" size="28px" color="primary" />
            <div class="summary-value">{{ validation.totalRows }}</div>
            <div class="summary-label">Transacciones</div>
          </div>
          <div class="summary-card income-bg">
            <q-icon name="arrow_upward" size="28px" color="positive" />
            <div class="summary-value">{{ incomeMonthCount }}</div>
            <div class="summary-label">Meses ingresos</div>
          </div>
          <div class="summary-card expense-bg">
            <q-icon name="arrow_downward" size="28px" color="negative" />
            <div class="summary-value">{{ expenseMonthCount }}</div>
            <div class="summary-label">Meses gastos</div>
          </div>
          <div class="summary-card">
            <q-icon name="check_circle" size="28px" color="positive" />
            <div class="summary-value">{{ validation.validRows }}</div>
            <div class="summary-label">Válidas</div>
          </div>
        </div>

        <!-- Month breakdown -->
        <div class="config-card">
          <h3><q-icon name="calendar_month" class="q-mr-sm" />Desglose por mes</h3>
          <div class="months-table">
            <div v-for="(pm, idx) in parsedMonths" :key="idx" class="month-row">
              <div class="month-info">
                <q-badge
                  :color="pm.type === 'income' ? 'positive' : 'negative'"
                  :label="pm.type === 'income' ? 'I' : 'G'"
                  class="q-mr-sm"
                />
                <span class="month-name">{{ pm.monthName }}</span>
              </div>
              <span class="month-count">{{ pm.rows.length }} mov.</span>
              <q-toggle :model-value="pm.enabled" dense @update:model-value="(val: boolean) => toggleMonth(idx, val)" />
            </div>
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="validation.errors.length > 0" class="config-card">
          <q-expansion-item
            icon="warning"
            :label="`${validation.errors.length} filas sin categoría (se omitirán)`"
            header-class="text-warning"
            default-closed
          >
            <div class="errors-list">
              <div v-for="(err, idx) in validation.errors.slice(0, 30)" :key="idx" class="error-row">
                <span class="error-source">{{ err.source }}</span>
                <span class="error-msg">{{ err.message }}</span>
              </div>
              <div v-if="validation.errors.length > 30" class="more-errors">
                ... y {{ validation.errors.length - 30 }} más
              </div>
            </div>
          </q-expansion-item>
        </div>

        <!-- Progress -->
        <div v-if="importing" class="import-progress">
          <p>Importando... {{ importedCount }} / {{ validation.validRows }}</p>
          <q-linear-progress :value="importedCount / Math.max(validation.validRows, 1)" color="primary" size="8px" rounded />
        </div>

        <div class="action-bar">
          <q-btn flat label="Atrás" icon="arrow_back" :disable="importing" @click="step = 3" />
          <q-btn
            :label="`Importar ${validation.validRows} transacciones`"
            color="positive"
            icon="cloud_upload"
            :loading="importing"
            :disable="validation.validRows === 0"
            @click="importData"
          />
        </div>
      </section>

      <!-- Create Category Dialog -->
      <q-dialog v-model="showCreateCategory">
        <q-card class="create-category-dialog">
          <q-card-section>
            <h3>Nueva categoría</h3>
            <p class="text-caption text-grey">Para: "{{ newCategoryForConcepto }}"</p>
          </q-card-section>
          <q-card-section>
            <q-input v-model="newCategoryName" label="Nombre" outlined dense class="q-mb-md" />
            <div class="type-toggle q-mb-md">
              <button :class="['type-btn income', { active: newCategoryType === 'income' }]" @click="newCategoryType = 'income'">Ingreso</button>
              <button :class="['type-btn expense', { active: newCategoryType === 'expense' }]" @click="newCategoryType = 'expense'">Gasto</button>
            </div>
            <q-input v-model="newCategoryIcon" label="Icono (Material)" outlined dense class="q-mb-md" hint="Ej: sports_soccer, receipt_long" />
            <q-input v-model="newCategoryColor" label="Color" outlined dense type="color" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn v-close-popup flat label="Cancelar" />
            <q-btn label="Crear" color="primary" :disable="!newCategoryName" :loading="creatingCategory" @click="createNewCategory" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Success Dialog -->
      <q-dialog v-model="showSuccess" persistent>
        <q-card class="success-dialog">
          <q-card-section class="text-center">
            <q-icon name="check_circle" color="positive" size="80px" />
            <h3>¡Temporada {{ seasonStartYear }}/{{ seasonEndYear }} importada!</h3>
            <p><strong>{{ importedCount }}</strong> transacciones cargadas.</p>
          </q-card-section>
          <q-card-actions align="center">
            <q-btn label="Ver transacciones" color="primary" to="/transactions" />
            <q-btn label="Importar otra temporada" flat @click="reset" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import {
  ExcelImporter,
  createEmptyMapping,
  type SheetAnalysis,
  type ConceptoGroup,
  type ColumnMapping,
  type ImportValidation,
  type ParsedMonth
} from 'src/services/excelImporter'
import { useCategoriesStore } from 'src/stores/categories'
import { useTeamsStore } from 'src/stores/teams'
import { useTransactionsStore } from 'src/stores/transactions'
import { logger } from 'src/utils/logger'
import { formatCurrency } from 'src/utils/formatters'

const $q = useQuasar()
const categoriesStore = useCategoriesStore()
const teamsStore = useTeamsStore()
const transactionsStore = useTransactionsStore()

const importer = new ExcelImporter()

// Ensure categories and teams are loaded
onMounted(async () => {
  if (categoriesStore.categories.length === 0) {
    await categoriesStore.fetchCategories()
  }
  if (teamsStore.teams.length === 0) {
    await teamsStore.fetchTeams()
  }
})

// === State ===
const step = ref(1)
const steps = [
  { num: 1, label: 'Archivo' },
  { num: 2, label: 'Configurar' },
  { num: 3, label: 'Categorías' },
  { num: 4, label: 'Importar' }
]

// Step 1
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const parsing = ref(false)
const fileInput = ref<HTMLInputElement>()
const sheetAnalysis = ref<SheetAnalysis[]>([])

const sheetTypeOptions = [
  { label: '📅 Pestaña de gastos (mes)', value: 'expense_month' },
  { label: '💰 Pestaña de ingresos', value: 'income' },
  { label: '⏭️ Omitir', value: 'skip' },
  { label: '❓ Sin clasificar', value: 'unknown' }
]

// Step 2
const seasonStartYear = ref(2024)
const seasonEndYear = ref(2025)
const columnMapping = ref<ColumnMapping>(createEmptyMapping())
const incomeColumnMapping = ref<ColumnMapping>(createEmptyMapping())
const expenseHeaders = ref<string[]>([])
const incomeHeaders = ref<string[]>([])
const processing = ref(false)
const hasIncomeTab = computed(() => sheetAnalysis.value.some(s => s.detectedAs === 'income'))

// All possible transaction fields for mapping
const expenseColumnFields = [
  { key: 'date', label: 'Fecha', required: false, group: 'basic' },
  { key: 'concepto', label: 'Concepto / Descripción', required: true, group: 'basic' },
  { key: 'amount', label: 'Importe total', required: true, group: 'basic' },
  { key: 'base', label: 'Base imponible', required: false, group: 'fiscal' },
  { key: 'taxRate', label: 'Tipo IVA/IVE (%)', required: false, group: 'fiscal' },
  { key: 'taxAmount', label: 'Importe IVA/IVE', required: false, group: 'fiscal' },
  { key: 'paymentMethod', label: 'Forma de cobro / pago', required: false, group: 'payment' },
  { key: 'paidDate', label: 'Fecha de pago / cobro', required: false, group: 'payment' },
  { key: 'dueDate', label: 'Fecha de vencimiento', required: false, group: 'payment' },
  { key: 'reference', label: 'Referencia', required: false, group: 'extra' },
  { key: 'invoiceNumber', label: 'Nº Factura', required: false, group: 'extra' },
  { key: 'notes', label: 'Notas / Observaciones', required: false, group: 'extra' }
]

const incomeColumnFields = [
  { key: 'date', label: 'Fecha', required: false, group: 'basic' },
  { key: 'concepto', label: 'Concepto / Descripción', required: true, group: 'basic' },
  { key: 'amount', label: 'Importe total', required: true, group: 'basic' },
  { key: 'base', label: 'Base imponible', required: false, group: 'fiscal' },
  { key: 'taxRate', label: 'Tipo IVA/IVE (%)', required: false, group: 'fiscal' },
  { key: 'taxAmount', label: 'Importe IVA/IVE', required: false, group: 'fiscal' },
  { key: 'paymentMethod', label: 'Forma de cobro', required: false, group: 'payment' },
  { key: 'paidDate', label: 'Fecha de cobro', required: false, group: 'payment' },
  { key: 'dueDate', label: 'Fecha de vencimiento', required: false, group: 'payment' },
  { key: 'reference', label: 'Referencia', required: false, group: 'extra' },
  { key: 'invoiceNumber', label: 'Nº Factura', required: false, group: 'extra' },
  { key: 'notes', label: 'Notas / Observaciones', required: false, group: 'extra' }
]

const yearOptions = Array.from({ length: 10 }, (_, i) => {
  const y = 2018 + i
  return { label: String(y), value: y }
})

// Step 3
const conceptoGroups = ref<ConceptoGroup[]>([])
const conceptoFilter = ref<'all' | 'unmapped' | 'income' | 'expense'>('all')
const totalRows = ref(0)
const parsedMonths = ref<ParsedMonth[]>([])

// Step 4
const validation = ref<ImportValidation>({ totalRows: 0, validRows: 0, unmappedConceptos: [], errors: [] })
const importing = ref(false)
const importedCount = ref(0)
const showSuccess = ref(false)

// Create category
const showCreateCategory = ref(false)
const newCategoryForConcepto = ref('')
const newCategoryForGroupIdx = ref(-1)
const newCategoryName = ref('')
const newCategoryType = ref<'income' | 'expense'>('expense')
const newCategoryIcon = ref('receipt_long')
const newCategoryColor = ref('#2196F3')
const creatingCategory = ref(false)

// === Computed ===
const filteredGroups = computed(() => {
  if (conceptoFilter.value === 'all') return conceptoGroups.value
  if (conceptoFilter.value === 'unmapped') return conceptoGroups.value.filter(g => !g.categoryId)
  return conceptoGroups.value.filter(g => g.type === conceptoFilter.value)
})

const unmappedCount = computed(() => conceptoGroups.value.filter(g => !g.categoryId).length)
const incomeCount = computed(() => conceptoGroups.value.filter(g => g.type === 'income').length)
const expenseCount = computed(() => conceptoGroups.value.filter(g => g.type === 'expense').length)
const incomeMonthCount = computed(() => parsedMonths.value.filter(m => m.type === 'income' && m.enabled).length)
const expenseMonthCount = computed(() => parsedMonths.value.filter(m => m.type === 'expense' && m.enabled).length)

function buildColumnOptions(headers: string[], mapping: ColumnMapping) {
  const options: { label: string; value: string | null }[] = [{ label: '— No mapear —', value: null }]
  const seen = new Set<string>()

  for (const h of headers) {
    if (!seen.has(h)) {
      options.push({ label: h, value: h })
      seen.add(h)
    }
  }

  for (const val of Object.values(mapping)) {
    if (val && !seen.has(val)) {
      options.push({ label: val, value: val })
      seen.add(val)
    }
  }

  return options
}

const expenseColumnOptions = computed(() => buildColumnOptions(expenseHeaders.value, columnMapping.value))
const incomeColumnOptions = computed(() => buildColumnOptions(incomeHeaders.value, incomeColumnMapping.value))

const teamOptions = computed(() =>
  teamsStore.activeTeams.map(t => ({ label: t.name, value: t.id }))
)

// === Methods ===
function triggerFileInput() { fileInput.value?.click() }

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    selectedFile.value = input.files[0]
    sheetAnalysis.value = [] // reset on new file
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files?.length && files[0].name.match(/\.(xlsx|xls|csv)$/i)) {
    selectedFile.value = files[0]
    sheetAnalysis.value = []
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function parseFile() {
  if (!selectedFile.value) return
  parsing.value = true
  try {
    sheetAnalysis.value = await importer.parseFile(selectedFile.value)

    const mapping = importer.getColumnMapping()
    columnMapping.value = mapping
    expenseHeaders.value = importer.getExpenseHeaders()

    const incMapping = importer.getIncomeColumnMapping()
    incomeColumnMapping.value = incMapping
    incomeHeaders.value = importer.getIncomeHeaders()

    const season = importer.getSeasonConfig()
    seasonStartYear.value = season.startYear
    seasonEndYear.value = season.endYear

    logger.debug('[Import] Sheets:', sheetAnalysis.value)
    logger.debug('[Import] Expense mapping:', mapping)
    logger.debug('[Import] Expense headers:', expenseHeaders.value)
    logger.debug('[Import] Income mapping:', incMapping)
    logger.debug('[Import] Income headers:', incomeHeaders.value)
    logger.debug('[Import] Season:', season)
  } catch (e) {
    logger.error('Error parsing:', e)
    $q.notify({ type: 'negative', message: 'Error al leer el archivo' })
  } finally {
    parsing.value = false
  }
}

function updateSheetType(idx: number, type: string) {
  importer.setSheetType(idx, type as SheetAnalysis['detectedAs'])
  sheetAnalysis.value = importer.getSheetAnalysis()
}

async function processSheets() {
  processing.value = true
  try {
    importer.setColumnMapping(columnMapping.value)
    importer.setIncomeColumnMapping(incomeColumnMapping.value)
    importer.setSeasonConfig({ startYear: seasonStartYear.value, endYear: seasonEndYear.value })

    parsedMonths.value = importer.processSheets()
    conceptoGroups.value = importer.getConceptoGroups()
    totalRows.value = importer.getTotalRows()

    step.value = 3
  } catch (e) {
    logger.error('Error processing:', e)
    $q.notify({ type: 'negative', message: 'Error al procesar los datos' })
  } finally {
    processing.value = false
  }
}

function setGroupCategory(filteredIdx: number, categoryId: string | null) {
  const realIdx = getRealIndex(filteredIdx)
  conceptoGroups.value[realIdx].categoryId = categoryId
  importer.setConceptoGroup(realIdx, { categoryId })
}

function setGroupTeam(filteredIdx: number, teamId: string | null) {
  const realIdx = getRealIndex(filteredIdx)
  conceptoGroups.value[realIdx].teamId = teamId
  importer.setConceptoGroup(realIdx, { teamId })
}

function getRealIndex(filteredIdx: number): number {
  const item = filteredGroups.value[filteredIdx]
  return conceptoGroups.value.indexOf(item)
}

function getCategoryOptions(type: 'income' | 'expense') {
  const categories = type === 'income'
    ? categoriesStore.incomeCategories
    : categoriesStore.expenseCategories
  return categories.map(c => ({
    label: c.parentId ? `  ↳ ${c.name}` : c.name,
    value: c.id,
    icon: c.icon,
    color: c.color
  }))
}

function openCreateCategory(group: ConceptoGroup) {
  newCategoryForGroupIdx.value = conceptoGroups.value.indexOf(group)
  newCategoryForConcepto.value = group.concepto
  newCategoryName.value = group.concepto
  newCategoryType.value = group.type
  newCategoryIcon.value = group.type === 'income' ? 'payments' : 'receipt_long'
  newCategoryColor.value = group.type === 'income' ? '#4CAF50' : '#F44336'
  showCreateCategory.value = true
}

async function createNewCategory() {
  creatingCategory.value = true
  try {
    const newCat = await categoriesStore.createCategory({
      name: newCategoryName.value,
      type: newCategoryType.value,
      icon: newCategoryIcon.value,
      color: newCategoryColor.value,
      isActive: true
    })
    if (newCat) {
      const idx = newCategoryForGroupIdx.value
      conceptoGroups.value[idx].categoryId = newCat.id
      importer.setConceptoGroup(idx, { categoryId: newCat.id })
      showCreateCategory.value = false
      $q.notify({ type: 'positive', message: `Categoría "${newCat.name}" creada` })
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al crear categoría' })
  } finally {
    creatingCategory.value = false
  }
}

function toggleMonth(idx: number, enabled: boolean) {
  importer.toggleMonth(idx, enabled)
  parsedMonths.value = importer.getParsedMonths()
  conceptoGroups.value = importer.getConceptoGroups()
  validation.value = importer.validate()
}

function goToReview() {
  importer.applyConceptoMappings()
  validation.value = importer.validate()
  step.value = 4
}

async function importData() {
  importing.value = true
  importedCount.value = 0

  try {
    const transactions = importer.getTransactionsToImport()

    for (const txn of transactions) {
      const category = categoriesStore.getCategoryById(txn.categoryId)
      const team = txn.teamId ? teamsStore.getTeamById(txn.teamId) : null

      await transactionsStore.createTransaction({
        type: txn.type,
        amount: txn.amount,
        description: txn.description,
        categoryId: txn.categoryId,
        categoryName: txn.categoryName || category?.name || 'Sin categorizar',
        season: txn.season,
        date: txn.date,
        paidDate: txn.paidDate,
        paymentMethod: txn.paymentMethod as 'bank_transfer' | 'cash' | 'card' | 'check' | 'direct_debit' | 'other',
        baseAmount: txn.baseAmount,
        taxAmount: txn.taxAmount,
        teamId: txn.teamId,
        teamName: team?.name
      })

      importedCount.value++
    }

    showSuccess.value = true
  } catch (e) {
    logger.error('Import error:', e)
    $q.notify({ type: 'negative', message: 'Error durante la importación' })
  } finally {
    importing.value = false
  }
}

function reset() {
  step.value = 1
  selectedFile.value = null
  sheetAnalysis.value = []
  conceptoGroups.value = []
  parsedMonths.value = []
  showSuccess.value = false
  importedCount.value = 0
}
</script>

<style lang="scss" scoped>
.import-page {
  background: var(--color-bg-primary) !important;
  background-image: none !important;
  color: var(--color-text-primary);
  min-height: 100vh;
  padding-bottom: var(--space-16);
  position: relative;
  z-index: 1;

  // Block any pseudo-element overlays from parent elements
  &::before,
  &::after {
    display: none !important;
  }
}

.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-6);
  position: relative;
  z-index: 2;
}

// === HEADER (renamed to avoid global .page-header conflict) ===
.import-header {
  margin-bottom: var(--space-6);

  .import-header-content {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .back-btn {
    color: var(--color-text-tertiary);
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .subtitle {
    margin: 2px 0 0;
    color: var(--color-text-tertiary);
    font-size: 0.875rem;
  }
}

// === STEPS BAR ===
.steps-bar {
  display: flex;
  gap: 4px;
  margin-bottom: var(--space-8);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 12px 16px;

  .step-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    opacity: 0.4;
    transition: opacity 0.3s;

    &.active { opacity: 1; }
    &.current .step-num {
      background: var(--color-accent);
      color: #fff;
    }

    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    span {
      font-size: 13px;
      color: var(--color-text-secondary);
      font-weight: 500;
    }
  }
}

.step-section {
  position: relative;
  z-index: 10;
  opacity: 1 !important;
  isolation: isolate;

  // Ensure no overlays from parent pseudo-elements
  &::before,
  &::after {
    display: none !important;
    content: none !important;
  }
}

// === DROP ZONE ===
.drop-zone {
  border: 2px dashed #30363d;
  border-radius: var(--radius-xl);
  padding: 48px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #1c2128 !important;
  position: relative;
  z-index: 8;
  isolation: isolate;

  // Block any pseudo-element overlays
  &::before,
  &::after {
    display: none !important;
    content: none !important;
  }

  &:hover, &.dragging {
    border-color: var(--color-accent);
    background: #252d38 !important;
  }

  &.hasFile {
    border-style: solid;
    border-color: var(--color-accent);
  }

  h3 {
    margin: 12px 0 4px;
    color: #f0f6fc !important;
    font-size: 1.125rem;
  }

  p {
    margin: 0;
    color: #8898aa !important;
    font-size: 0.875rem;
  }

  .formats {
    margin-top: 12px;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
}

// === ACTION BAR ===
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-light);
  gap: 12px;
}

// === CONFIG CARD ===
.config-card {
  background: #1c2128 !important;
  border: 1px solid #30363d !important;
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 8;
  isolation: isolate;

  // Block any pseudo-element overlays
  &::before,
  &::after {
    display: none !important;
    content: none !important;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 1rem;
    color: #f0f6fc !important;
    font-weight: 600;
    display: flex;
    align-items: center;
  }

  .config-hint {
    margin: 0 0 16px;
    font-size: 0.8125rem;
    color: #8898aa !important;
  }
}

// === SHEET DETECTION ===
.sheets-detected {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 5;

  .sheet-detected-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: #1e2633 !important;
    border-radius: var(--radius-md);
    border: 1px solid #3d4f5f !important;
    position: relative;
    z-index: 6;

    // Block any inherited pseudo-elements
    &::before,
    &::after {
      display: none !important;
      content: none !important;
    }

    .sheet-name {
      font-weight: 600;
      color: #f0f6fc !important;
      min-width: 140px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
    }

    .sheet-type-select {
      flex: 1;
      position: relative;
      z-index: 7;
    }

    .sheet-rows {
      font-size: 0.75rem;
      color: #8898aa !important;
      min-width: 70px;
      text-align: right;
      font-weight: 500;

      &.dimmed { color: #5a6a7a !important; }
    }
  }
}

// === SEASON SELECTOR ===
.season-selector {
  display: flex;
  align-items: center;
  gap: 12px;

  .year-select { max-width: 120px; }
  .season-slash { font-size: 1.5rem; color: var(--color-text-muted); }
  .season-end { font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary); }
}

// === COLUMN MAPPING ===
.column-mapping-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mapping-group {
  .mapping-group-title {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--color-border-light);
  }
}

.mapping-group-expansion {
  color: var(--color-text-tertiary) !important;
  font-size: 0.8125rem;
}

.column-mapping-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  .mapping-item {
    .field-label {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }
  }
}

// === STEP 3: CATEGORY MAPPING ===
.step-intro {
  margin-bottom: var(--space-6);

  h2 {
    margin: 0 0 8px;
    font-size: 1.25rem;
    color: var(--color-text-primary);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }
}

.mapping-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .filter-pill {
    padding: 6px 14px;
    border-radius: var(--radius-full);
    font-size: 0.8125rem;
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 500;

    &.active {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
      border-color: var(--color-border);
    }

    &.income.active {
      background: var(--color-success-bg);
      color: var(--color-success);
      border-color: var(--color-success);
    }

    &.expense.active {
      background: var(--color-danger-bg);
      color: var(--color-danger);
      border-color: var(--color-danger);
    }

    &:hover:not(.active) {
      background: var(--color-bg-tertiary);
    }
  }
}

.concepto-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}

.concepto-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  border-left: 3px solid var(--color-border);
  transition: all 0.3s;

  &.income { border-left-color: var(--color-success); }
  &.expense { border-left-color: var(--color-danger); }
  &.mapped { background: var(--color-bg-elevated); }

  .concepto-header { margin-bottom: 10px; }

  .concepto-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    .concepto-name { font-weight: 600; color: var(--color-text-primary); }
  }

  .concepto-meta {
    display: flex;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    margin-top: 4px;
  }

  .concepto-mapping {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    flex-wrap: wrap;
    .category-select { flex: 2; min-width: 220px; }
    .team-select { flex: 1; min-width: 150px; }
  }
}

// === STEP 4: REVIEW ===
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: var(--space-6);

  .summary-card {
    text-align: center;
    padding: var(--space-4);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);

    .summary-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 6px 0 2px;
    }

    .summary-label {
      font-size: 0.75rem;
      color: var(--color-text-tertiary);
    }

    &.income-bg { background: var(--color-success-bg); }
    &.expense-bg { background: var(--color-danger-bg); }
  }
}

.months-table {
  .month-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border-light);

    &:last-child { border-bottom: none; }
    .month-info { display: flex; align-items: center; flex: 1; }
    .month-name { color: var(--color-text-primary); font-weight: 500; }
    .month-count {
      color: var(--color-text-tertiary);
      font-size: 0.8125rem;
      min-width: 80px;
      text-align: right;
      margin-right: 12px;
    }
  }
}

.errors-list {
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;

  .error-row {
    display: flex;
    gap: 12px;
    padding: 4px 0;
    font-size: 0.8125rem;
    .error-source { color: var(--color-text-tertiary); min-width: 120px; }
    .error-msg { color: var(--color-text-secondary); }
  }

  .more-errors {
    text-align: center;
    color: var(--color-text-muted);
    padding: 8px;
    font-size: 0.8125rem;
  }
}

.import-progress {
  padding: var(--space-5);
  text-align: center;
  p { margin: 0 0 12px; color: var(--color-text-secondary); }
}

.type-toggle {
  display: flex;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);

  .type-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    padding: 8px 14px;
    font-size: 0.8125rem;
    cursor: pointer;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--color-text-tertiary);
    transition: all 0.2s;
    font-weight: 500;

    &.income.active { background: var(--color-success-bg); color: var(--color-success); }
    &.expense.active { background: var(--color-danger-bg); color: var(--color-danger); }
    &:hover:not(.active) { background: var(--color-bg-tertiary); }
  }
}

.create-category-dialog {
  min-width: 400px;
  h3 { margin: 0; font-size: 1.125rem; }
}

.success-dialog {
  min-width: 400px;
  h3 { margin: 16px 0 8px; }
}

.unmapped-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  padding: 8px 12px;
  background: var(--color-warning-bg);
  border-radius: var(--radius-md);
}

.no-headers-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: var(--color-warning-bg);
  border: 1px solid rgba(255, 181, 69, 0.2);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
}
</style>
