<template>
  <q-page class="categories-page">
    <div class="page-header">
      <div class="row items-center justify-between">
        <div class="row items-center">
          <q-btn flat round icon="arrow_back" color="white" @click="$router.back()" />
          <div class="q-ml-sm"><h1>Categorías</h1></div>
        </div>
        <q-btn color="white" text-color="primary" icon="add" label="Nueva" @click="showCreateDialog = true" />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <q-tabs v-model="activeTab" dense class="q-mb-md">
        <q-tab name="expense" label="Gastos" />
        <q-tab name="income" label="Ingresos" />
      </q-tabs>

      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="expense">
          <q-list separator>
            <q-item v-for="cat in expenseCategories" :key="cat.id">
              <q-item-section avatar><q-icon :name="cat.icon" :style="{ color: cat.color }" size="28px" /></q-item-section>
              <q-item-section><q-item-label>{{ cat.name }}</q-item-label></q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat round icon="edit" size="sm" @click="editCategory(cat)" />
                  <q-btn flat round icon="delete" size="sm" color="negative" @click="deleteCategory(cat.id)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>
        <q-tab-panel name="income">
          <q-list separator>
            <q-item v-for="cat in incomeCategories" :key="cat.id">
              <q-item-section avatar><q-icon :name="cat.icon" :style="{ color: cat.color }" size="28px" /></q-item-section>
              <q-item-section><q-item-label>{{ cat.name }}</q-item-label></q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat round icon="edit" size="sm" @click="editCategory(cat)" />
                  <q-btn flat round icon="delete" size="sm" color="negative" @click="deleteCategory(cat.id)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section><span class="text-h6">{{ editingCategory ? 'Editar' : 'Nueva' }} categoría</span></q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model="categoryForm.name" label="Nombre" outlined />
            <q-select v-model="categoryForm.type" :options="[{label:'Gasto',value:'expense'},{label:'Ingreso',value:'income'}]" label="Tipo" outlined emit-value map-options />
            <q-input v-model="categoryForm.icon" label="Icono (Material Icons)" outlined hint="Ej: sports_soccer, receipt" />
            <div class="row items-center">
              <span class="q-mr-md">Color:</span>
              <q-btn :style="{ backgroundColor: categoryForm.color }" round size="md"><q-popup-proxy><q-color v-model="categoryForm.color" /></q-popup-proxy></q-btn>
            </div>
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" @click="resetForm" />
          <q-btn label="Guardar" color="primary" :loading="saving" @click="saveCategory" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useCategoriesStore } from 'src/stores/categories';
import type { Category, CategoryType } from 'src/types';

const $q = useQuasar();
const categoriesStore = useCategoriesStore();

const activeTab = ref<CategoryType>('expense');
const showCreateDialog = ref(false);
const editingCategory = ref<Category | null>(null);
const saving = ref(false);
const categoryForm = ref({ name: '', type: 'expense' as CategoryType, icon: 'category', color: '#2196F3' });

const expenseCategories = computed(() => categoriesStore.expenseCategories);
const incomeCategories = computed(() => categoriesStore.incomeCategories);

function editCategory(cat: Category) {
  editingCategory.value = cat;
  categoryForm.value = { name: cat.name, type: cat.type, icon: cat.icon, color: cat.color };
  showCreateDialog.value = true;
}

function resetForm() {
  editingCategory.value = null;
  categoryForm.value = { name: '', type: activeTab.value, icon: 'category', color: '#2196F3' };
}

async function saveCategory() {
  if (!categoryForm.value.name) return;
  saving.value = true;
  try {
    if (editingCategory.value) {
      await categoriesStore.updateCategory(editingCategory.value.id, categoryForm.value);
    } else {
      await categoriesStore.createCategory({ ...categoryForm.value, isActive: true });
    }
    $q.notify({ type: 'positive', message: 'Categoría guardada' });
    showCreateDialog.value = false;
    resetForm();
  } finally { saving.value = false; }
}

async function deleteCategory(id: string) {
  $q.dialog({ title: 'Eliminar', message: '¿Eliminar esta categoría?', cancel: true }).onOk(async () => {
    await categoriesStore.deleteCategory(id);
    $q.notify({ type: 'positive', message: 'Categoría eliminada' });
  });
}

onMounted(() => { categoriesStore.fetchCategories(); });
</script>

<style lang="scss" scoped>
.categories-page { background: var(--color-background); }
.page-content { max-width: 600px; margin: 0 auto; }
</style>
