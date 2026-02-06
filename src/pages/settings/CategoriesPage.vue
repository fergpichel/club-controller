<template>
  <q-page class="categories-page">
    <div class="page-header">
      <div class="row items-center justify-between">
        <div class="row items-center">
          <q-btn flat round icon="arrow_back" color="white" @click="$router.back()" />
          <div class="q-ml-sm"><h1>Categorías</h1></div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn outline color="white" icon="download" label="Plantilla" @click="confirmLoadTemplate">
            <q-tooltip>Cargar categorías por defecto con subcategorías</q-tooltip>
          </q-btn>
          <q-btn color="primary" text-color="white" icon="add" label="Nueva" @click="openCreate()" />
        </div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <q-tabs v-model="activeTab" dense class="category-tabs q-mb-lg" active-color="primary" indicator-color="primary" no-caps>
        <q-tab name="expense" icon="trending_down" label="Gastos" />
        <q-tab name="income" icon="trending_up" label="Ingresos" />
      </q-tabs>

      <q-tab-panels v-model="activeTab" animated class="category-panels">
        <!-- EXPENSES -->
        <q-tab-panel name="expense" class="q-pa-none">
          <div v-if="expenseTree.length === 0" class="empty-state">
            <q-icon name="category" size="48px" class="q-mb-md text-grey-5" />
            <p class="text-grey-6">Sin categorías de gasto</p>
            <q-btn outline color="primary" label="Crear categoría" icon="add" @click="openCreate('expense')" />
          </div>
          <div v-else class="category-tree">
            <div v-for="parent in expenseTree" :key="parent.id" class="category-group">
              <!-- Parent category -->
              <div class="category-row parent-row">
                <div class="category-icon" :style="{ backgroundColor: parent.color + '20', color: parent.color }">
                  <q-icon :name="parent.icon" size="22px" />
                </div>
                <div class="category-info">
                  <div class="category-name">
                    {{ parent.name }}
                    <q-badge v-if="parent.isSensitive" color="red-4" text-color="white" class="q-ml-xs" dense>
                      <q-icon name="lock" size="10px" class="q-mr-xs" />Sensible
                    </q-badge>
                  </div>
                  <div class="category-meta">
                    {{ parent.subcategories.length }} subcategoría{{ parent.subcategories.length !== 1 ? 's' : '' }}
                  </div>
                </div>
                <div class="category-actions">
                  <q-btn flat round dense icon="add" size="sm" color="primary" @click="openCreate('expense', parent.id)">
                    <q-tooltip>Añadir subcategoría</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="edit" size="sm" @click="editCategory(parent)" />
                  <q-btn flat round dense icon="delete" size="sm" color="negative" @click="deleteCategory(parent)" />
                </div>
              </div>

              <!-- Subcategories -->
              <transition-group name="list">
                <div
                  v-for="sub in parent.subcategories"
                  :key="sub.id"
                  class="category-row sub-row"
                >
                  <div class="sub-connector">
                    <div class="connector-line" />
                  </div>
                  <div class="category-icon sub-icon" :style="{ backgroundColor: (sub.color || parent.color) + '15', color: sub.color || parent.color }">
                    <q-icon :name="sub.icon || parent.icon" size="18px" />
                  </div>
                  <div class="category-info">
                    <div class="category-name sub-name">
                      {{ sub.name }}
                      <q-badge v-if="sub.isSensitive && !parent.isSensitive" color="red-4" text-color="white" class="q-ml-xs" dense>
                        <q-icon name="lock" size="10px" />
                      </q-badge>
                      <q-badge v-else-if="parent.isSensitive" color="red-2" text-color="red-8" class="q-ml-xs" dense>
                        <q-icon name="lock" size="10px" class="q-mr-xs" />Heredado
                      </q-badge>
                    </div>
                  </div>
                  <div class="category-actions">
                    <q-btn flat round dense icon="edit" size="sm" @click="editCategory(sub)" />
                    <q-btn flat round dense icon="delete" size="sm" color="negative" @click="deleteCategory(sub)" />
                  </div>
                </div>
              </transition-group>
            </div>
          </div>
        </q-tab-panel>

        <!-- INCOME -->
        <q-tab-panel name="income" class="q-pa-none">
          <div v-if="incomeTree.length === 0" class="empty-state">
            <q-icon name="category" size="48px" class="q-mb-md text-grey-5" />
            <p class="text-grey-6">Sin categorías de ingreso</p>
            <q-btn outline color="primary" label="Crear categoría" icon="add" @click="openCreate('income')" />
          </div>
          <div v-else class="category-tree">
            <div v-for="parent in incomeTree" :key="parent.id" class="category-group">
              <!-- Parent category -->
              <div class="category-row parent-row">
                <div class="category-icon" :style="{ backgroundColor: parent.color + '20', color: parent.color }">
                  <q-icon :name="parent.icon" size="22px" />
                </div>
                <div class="category-info">
                  <div class="category-name">
                    {{ parent.name }}
                    <q-badge v-if="parent.isSensitive" color="red-4" text-color="white" class="q-ml-xs" dense>
                      <q-icon name="lock" size="10px" class="q-mr-xs" />Sensible
                    </q-badge>
                  </div>
                  <div class="category-meta">
                    {{ parent.subcategories.length }} subcategoría{{ parent.subcategories.length !== 1 ? 's' : '' }}
                  </div>
                </div>
                <div class="category-actions">
                  <q-btn flat round dense icon="add" size="sm" color="primary" @click="openCreate('income', parent.id)">
                    <q-tooltip>Añadir subcategoría</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="edit" size="sm" @click="editCategory(parent)" />
                  <q-btn flat round dense icon="delete" size="sm" color="negative" @click="deleteCategory(parent)" />
                </div>
              </div>

              <!-- Subcategories -->
              <transition-group name="list">
                <div
                  v-for="sub in parent.subcategories"
                  :key="sub.id"
                  class="category-row sub-row"
                >
                  <div class="sub-connector">
                    <div class="connector-line" />
                  </div>
                  <div class="category-icon sub-icon" :style="{ backgroundColor: (sub.color || parent.color) + '15', color: sub.color || parent.color }">
                    <q-icon :name="sub.icon || parent.icon" size="18px" />
                  </div>
                  <div class="category-info">
                    <div class="category-name sub-name">
                      {{ sub.name }}
                      <q-badge v-if="sub.isSensitive && !parent.isSensitive" color="red-4" text-color="white" class="q-ml-xs" dense>
                        <q-icon name="lock" size="10px" />
                      </q-badge>
                      <q-badge v-else-if="parent.isSensitive" color="red-2" text-color="red-8" class="q-ml-xs" dense>
                        <q-icon name="lock" size="10px" class="q-mr-xs" />Heredado
                      </q-badge>
                    </div>
                  </div>
                  <div class="category-actions">
                    <q-btn flat round dense icon="edit" size="sm" @click="editCategory(sub)" />
                    <q-btn flat round dense icon="delete" size="sm" color="negative" @click="deleteCategory(sub)" />
                  </div>
                </div>
              </transition-group>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <!-- Create / Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="dialog-card">
        <q-card-section class="row items-center q-pb-sm">
          <q-avatar
            :style="{ backgroundColor: categoryForm.color + '20', color: categoryForm.color }"
            size="40px"
          >
            <q-icon :name="categoryForm.icon || 'category'" />
          </q-avatar>
          <span class="text-h6 q-ml-sm">
            {{ editingCategory ? 'Editar' : 'Nueva' }}
            {{ categoryForm.parentId ? 'subcategoría' : 'categoría' }}
          </span>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense @click="resetForm" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form class="q-gutter-md" @submit.prevent="saveCategory">
            <q-input
              v-model="categoryForm.name"
              label="Nombre"
              outlined
              autofocus
              :rules="[val => !!val || 'Nombre requerido']"
            />

            <q-select
              v-model="categoryForm.type"
              :options="typeOptions"
              label="Tipo"
              outlined
              emit-value
              map-options
              :disable="!!categoryForm.parentId"
            >
              <template #prepend>
                <q-icon :name="categoryForm.type === 'income' ? 'trending_up' : 'trending_down'" />
              </template>
            </q-select>

            <!-- Parent selector — only when creating a new category (not a subcategory forced by button) -->
            <q-select
              v-if="!editingCategory || !editingCategory.parentId"
              v-model="categoryForm.parentId"
              :options="parentFilter.options.value"
              label="Categoría padre (opcional)"
              outlined
              emit-value
              map-options
              clearable
              use-input
              input-debounce="0"
              hint="Dejar vacío para crear una categoría principal"
              @filter="parentFilter.filter"
            >
              <template #prepend>
                <q-icon name="account_tree" />
              </template>
            </q-select>

            <div>
              <label class="field-label-text">Icono</label>
              <IconPicker v-model="categoryForm.icon" :color="categoryForm.color" />
            </div>

            <div class="row items-center q-gutter-md">
              <span>Color:</span>
              <q-btn
                :style="{ backgroundColor: categoryForm.color, width: '40px', height: '40px' }"
                round
              >
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-color v-model="categoryForm.color" />
                </q-popup-proxy>
              </q-btn>
              <span class="text-caption text-grey">{{ categoryForm.color }}</span>
            </div>

            <q-separator />

            <!-- Sensitive toggle -->
            <div v-if="authStore.canMarkSensitive" class="sensitive-section">
              <q-toggle
                v-model="categoryForm.isSensitive"
                color="red"
                :disable="isParentSensitive"
              >
                <template #default>
                  <div>
                    <div class="text-body2">
                      <q-icon name="lock" size="16px" class="q-mr-xs" />
                      Categoría sensible
                    </div>
                    <div class="text-caption text-grey">
                      {{ isParentSensitive
                        ? 'Heredado de la categoría padre — no se puede desactivar aquí'
                        : 'Los importes se ocultarán para coordinadores, colaboradores y observadores'
                      }}
                    </div>
                    <div v-if="!categoryForm.parentId && categoryForm.isSensitive" class="text-caption text-red q-mt-xs">
                      <q-icon name="info" size="14px" class="q-mr-xs" />
                      Todas las subcategorías heredarán esta restricción
                    </div>
                  </div>
                </template>
              </q-toggle>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn v-close-popup flat label="Cancelar" @click="resetForm" />
          <q-btn
            label="Guardar"
            color="primary"
            unelevated
            :loading="saving"
            @click="saveCategory"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useCategoriesStore } from 'src/stores/categories'
import { useAuthStore } from 'src/stores/auth'
import type { Category, CategoryType } from 'src/types'
import { getDefaultCategoryCount } from 'src/config/defaultCategories'
import { logger } from 'src/utils/logger'
import { useSelectFilter } from 'src/composables/useSelectFilter'
import IconPicker from 'src/components/IconPicker.vue'

const $q = useQuasar()
const categoriesStore = useCategoriesStore()
const authStore = useAuthStore()

const activeTab = ref<CategoryType>('expense')
const showDialog = ref(false)
const editingCategory = ref<Category | null>(null)
const saving = ref(false)

const categoryForm = ref({
  name: '',
  type: 'expense' as CategoryType,
  icon: 'category',
  color: '#2196F3',
  parentId: null as string | null,
  isSensitive: false
})

const typeOptions = [
  { label: 'Gasto', value: 'expense' },
  { label: 'Ingreso', value: 'income' }
]

// === Tree views ===
const expenseTree = computed(() => categoriesStore.getCategoriesTree('expense'))
const incomeTree = computed(() => categoriesStore.getCategoriesTree('income'))

// === Parent options for the form ===
const parentOptionsAll = computed(() => {
  const type = categoryForm.value.type
  const parents = type === 'expense'
    ? categoriesStore.expenseParentCategories
    : categoriesStore.incomeParentCategories

  return parents
    .filter(p => p.id !== editingCategory.value?.id) // Can't be parent of itself
    .map(p => ({
      label: p.name,
      value: p.id
    }))
})
const parentFilter = useSelectFilter(parentOptionsAll)

// Check if the parent category is sensitive (for inherited badge)
const isParentSensitive = computed(() => {
  if (!categoryForm.value.parentId) return false
  const parent = categoriesStore.getCategoryById(categoryForm.value.parentId)
  return parent?.isSensitive || false
})

// === Actions ===
function openCreate(type?: CategoryType, parentId?: string) {
  resetForm()
  if (type) categoryForm.value.type = type
  else categoryForm.value.type = activeTab.value

  if (parentId) {
    categoryForm.value.parentId = parentId
    // Inherit type from parent
    const parent = categoriesStore.getCategoryById(parentId)
    if (parent) {
      categoryForm.value.type = parent.type
      categoryForm.value.color = parent.color
      categoryForm.value.icon = parent.icon
      // If parent is sensitive, subcategory is too
      if (parent.isSensitive) {
        categoryForm.value.isSensitive = true
      }
    }
  }

  showDialog.value = true
}

function editCategory(cat: Category) {
  editingCategory.value = cat
  categoryForm.value = {
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color,
    parentId: cat.parentId || null,
    isSensitive: cat.isSensitive || false
  }

  // If parent is sensitive, force sensitive on
  if (isParentSensitive.value) {
    categoryForm.value.isSensitive = true
  }

  showDialog.value = true
}

function resetForm() {
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    type: activeTab.value,
    icon: 'category',
    color: '#2196F3',
    parentId: null,
    isSensitive: false
  }
}

async function saveCategory() {
  if (!categoryForm.value.name) return

  saving.value = true
  try {
    // Build the data object — never pass undefined to Firestore
    const data: Record<string, unknown> = {
      name: categoryForm.value.name,
      type: categoryForm.value.type,
      icon: categoryForm.value.icon,
      color: categoryForm.value.color,
      isSensitive: categoryForm.value.isSensitive,
      isActive: true
    }

    // Only include parentId when it has a value; omit it otherwise
    // (Firestore rejects undefined values)
    if (categoryForm.value.parentId) {
      data.parentId = categoryForm.value.parentId
    }

    if (editingCategory.value) {
      // When editing, if parentId was removed we need to explicitly clear it
      if (!categoryForm.value.parentId && editingCategory.value.parentId) {
        data.parentId = null  // Firestore accepts null to clear a field
      }
      await categoriesStore.updateCategory(editingCategory.value.id, data as Partial<Category>)
    } else {
      await categoriesStore.createCategory(data as Omit<Category, 'id'>)
    }

    $q.notify({ type: 'positive', message: 'Categoría guardada' })
    showDialog.value = false
    resetForm()
  } catch (e) {
    logger.error('Error saving category:', e)
    $q.notify({ type: 'negative', message: 'Error al guardar' })
  } finally {
    saving.value = false
  }
}

function deleteCategory(cat: Category) {
  const subs = categoriesStore.getSubcategories(cat.id)
  const hasChildren = subs.length > 0

  $q.dialog({
    title: 'Eliminar categoría',
    message: hasChildren
      ? `"${cat.name}" tiene ${subs.length} subcategoría(s). ¿Eliminar todo?`
      : `¿Eliminar "${cat.name}"?`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(async () => {
    // Delete subcategories first
    if (hasChildren) {
      for (const sub of subs) {
        await categoriesStore.deleteCategory(sub.id)
      }
    }
    await categoriesStore.deleteCategory(cat.id)
    $q.notify({ type: 'positive', message: 'Categoría eliminada' })
  })
}

// === Load default template ===
const seedingDefaults = ref(false)

function confirmLoadTemplate() {
  const counts = getDefaultCategoryCount()
  const existingCount = categoriesStore.categories.filter(c => !categoriesStore.isUncategorized(c.id)).length

  let message = `Se crearán <strong>${counts.parents} categorías padre</strong> y <strong>${counts.subcategories} subcategorías</strong> con la plantilla por defecto para clubs deportivos.`
  if (existingCount > 0) {
    message += `<br><br>Ya tienes <strong>${existingCount} categorías</strong>. Las nuevas se añadirán sin eliminar las existentes.`
  }

  $q.dialog({
    title: 'Cargar plantilla de categorías',
    message,
    html: true,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Cargar plantilla', color: 'primary', icon: 'download' },
    persistent: true
  }).onOk(async () => {
    seedingDefaults.value = true
    try {
      const count = await categoriesStore.seedDefaultCategories()
      $q.notify({
        type: 'positive',
        message: `Plantilla cargada: ${count} categorías creadas`,
        icon: 'check_circle'
      })
    } catch (e) {
      logger.error('Error seeding defaults:', e)
      $q.notify({ type: 'negative', message: 'Error al cargar la plantilla' })
    } finally {
      seedingDefaults.value = false
    }
  })
}

onMounted(() => {
  categoriesStore.fetchCategories()
})
</script>

<style lang="scss" scoped>
.categories-page {
  background: var(--color-bg-primary);
}

.page-content {
  max-width: 680px;
  margin: 0 auto;
}

.category-tabs {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: 4px;
}

.category-panels {
  background: transparent;
}

// Tree structure
.category-tree {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.category-group {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.category-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  transition: background var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-tertiary);
  }
}

.parent-row {
  padding: var(--space-4);
}

.sub-row {
  padding-left: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.sub-connector {
  width: 20px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.connector-line {
  width: 1px;
  height: 100%;
  min-height: 20px;
  background: var(--color-border);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 50%;
    left: 0;
    width: 10px;
    height: 1px;
    background: var(--color-border);
  }
}

.category-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sub-icon {
  width: 34px;
  height: 34px;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.sub-name {
  font-weight: 500;
  font-size: 0.875rem;
}

.category-meta {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.category-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0.5;
  transition: opacity var(--duration-fast) var(--ease-out);

  .category-row:hover & {
    opacity: 1;
  }
}

.field-label-text {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

// Dialog
.dialog-card {
  min-width: 440px;
  max-width: 520px;

  @media (max-width: 500px) {
    min-width: 95vw;
  }
}

.sensitive-section {
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
}

// Empty state
.empty-state {
  text-align: center;
  padding: var(--space-8) var(--space-4);
}

// Animations
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
