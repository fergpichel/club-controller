<template>
  <q-page class="settings-page">
    <div class="page-header">
      <h1>Configuración</h1>
      <p class="header-subtitle">Ajustes de la aplicación y del club</p>
    </div>

    <div class="page-content q-pa-md">
      <!-- Tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        class="settings-tabs q-mb-lg"
        active-color="primary"
        indicator-color="primary"
        align="left"
        no-caps
      >
        <q-tab name="account" icon="person" label="Mi cuenta" />
        <q-tab v-if="authStore.canManageSettings" name="club" icon="sports_soccer" label="Club" />
      </q-tabs>

      <q-tab-panels v-model="activeTab" animated class="settings-panels">
        <!-- ==================== TAB: MI CUENTA ==================== -->
        <q-tab-panel name="account" class="q-pa-none">
          <q-list class="settings-list">
            <!-- Profile -->
            <q-item-label header class="settings-section-title">Perfil</q-item-label>
            <q-item clickable :to="{ name: 'profile' }" class="settings-item">
              <q-item-section avatar><q-avatar size="36px" color="primary" text-color="white" icon="person" /></q-item-section>
              <q-item-section>
                <q-item-label>Mi perfil</q-item-label>
                <q-item-label caption>Editar nombre, email y foto</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="chevron_right" /></q-item-section>
            </q-item>

            <q-separator spaced />

            <!-- Appearance -->
            <q-item-label header class="settings-section-title">Apariencia</q-item-label>
            <q-item class="settings-item">
              <q-item-section avatar><q-avatar size="36px" color="grey-8" text-color="white" icon="dark_mode" /></q-item-section>
              <q-item-section><q-item-label>Modo oscuro</q-item-label></q-item-section>
              <q-item-section side><q-toggle v-model="darkMode" color="primary" /></q-item-section>
            </q-item>

            <!-- Privacy (only for roles that can see sensitive data) -->
            <template v-if="canViewSensitive">
              <q-separator spaced />
              <q-item-label header class="settings-section-title">Privacidad</q-item-label>
              <q-item class="settings-item">
                <q-item-section avatar>
                  <q-avatar size="36px" color="red-8" text-color="white" icon="visibility_off" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Modo anticuriosos</q-item-label>
                  <q-item-label caption>
                    Oculta el concepto de transacciones sensibles. Pulsa el icono del ojo para revelar durante 5 segundos.
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-toggle v-model="privacyMode" color="red" />
                </q-item-section>
              </q-item>
            </template>

            <q-separator spaced />

            <!-- About -->
            <q-item-label header class="settings-section-title">Acerca de</q-item-label>
            <q-item class="settings-item">
              <q-item-section avatar><q-avatar size="36px" color="grey-6" text-color="white" icon="info" /></q-item-section>
              <q-item-section>
                <q-item-label>Teempad Funds</q-item-label>
                <q-item-label caption>Versión 1.0.0</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <!-- ==================== TAB: CLUB ==================== -->
        <q-tab-panel v-if="authStore.canManageSettings" name="club" class="q-pa-none">
          <q-list class="settings-list">

            <!-- Members -->
            <q-item-label header class="settings-section-title">
              <q-icon name="people" class="q-mr-xs" /> Miembros
            </q-item-label>
            <q-item clickable :to="{ name: 'members' }" class="settings-item">
              <q-item-section avatar><q-avatar size="36px" color="blue" text-color="white" icon="people" /></q-item-section>
              <q-item-section>
                <q-item-label>Miembros y roles</q-item-label>
                <q-item-label caption>Invitar usuarios, gestionar permisos</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="chevron_right" /></q-item-section>
            </q-item>

            <q-separator spaced />

            <!-- Budget -->
            <q-item-label header class="settings-section-title">
              <q-icon name="account_balance_wallet" class="q-mr-xs" /> Presupuesto
            </q-item-label>
            <q-item clickable :to="{ name: 'budget' }" class="settings-item">
              <q-item-section avatar><q-avatar size="36px" color="green-8" text-color="white" icon="account_balance_wallet" /></q-item-section>
              <q-item-section>
                <q-item-label>Presupuesto de temporada</q-item-label>
                <q-item-label caption>Definir ingresos y gastos previstos por categoría</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="chevron_right" /></q-item-section>
            </q-item>

            <q-separator spaced />

            <!-- Financial Categories -->
            <q-item-label header class="settings-section-title">
              <q-icon name="category" class="q-mr-xs" /> Categorías financieras
            </q-item-label>
            <q-item clickable :to="{ name: 'categories' }" class="settings-item">
              <q-item-section avatar><q-avatar size="36px" color="deep-purple" text-color="white" icon="category" /></q-item-section>
              <q-item-section>
                <q-item-label>Categorías contables</q-item-label>
                <q-item-label caption>Gestionar categorías de ingresos y gastos</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="chevron_right" /></q-item-section>
            </q-item>

            <q-separator spaced />

            <!-- Sports Catalogs -->
            <q-item-label header class="settings-section-title">
              <q-icon name="sports" class="q-mr-xs" /> Catálogos deportivos
            </q-item-label>
            <q-item clickable class="settings-item" @click="openCatalogEditor('ageCategory')">
              <q-item-section avatar><q-avatar size="36px" color="teal" text-color="white" icon="school" /></q-item-section>
              <q-item-section>
                <q-item-label>Categorías de edad</q-item-label>
                <q-item-label caption>{{ catalogsStore.activeAgeCategories.length }} categorías</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="edit" size="18px" /></q-item-section>
            </q-item>
            <q-item clickable class="settings-item" @click="openCatalogEditor('gender')">
              <q-item-section avatar><q-avatar size="36px" color="purple" text-color="white" icon="wc" /></q-item-section>
              <q-item-section>
                <q-item-label>Género</q-item-label>
                <q-item-label caption>{{ catalogsStore.activeGenderOptions.length }} opciones</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="edit" size="18px" /></q-item-section>
            </q-item>

            <q-separator spaced />

            <!-- Commercial Relationships -->
            <q-item-label header class="settings-section-title">
              <q-icon name="business" class="q-mr-xs" /> Relaciones comerciales
            </q-item-label>
            <q-item clickable class="settings-item" @click="openCatalogEditor('sponsor')">
              <q-item-section avatar><q-avatar size="36px" color="amber-8" text-color="white" icon="handshake" /></q-item-section>
              <q-item-section>
                <q-item-label>Patrocinadores</q-item-label>
                <q-item-label caption>{{ catalogsStore.activeSponsors.length }} patrocinadores</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="edit" size="18px" /></q-item-section>
            </q-item>
            <q-item clickable class="settings-item" @click="openCatalogEditor('supplier')">
              <q-item-section avatar><q-avatar size="36px" color="blue-grey" text-color="white" icon="local_shipping" /></q-item-section>
              <q-item-section>
                <q-item-label>Proveedores</q-item-label>
                <q-item-label caption>{{ catalogsStore.activeSuppliers.length }} proveedores</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="edit" size="18px" /></q-item-section>
            </q-item>

            <q-separator spaced />

            <!-- Teams, Events, Projects & Structure -->
            <q-item-label header class="settings-section-title">
              <q-icon name="groups" class="q-mr-xs" /> Equipos, eventos y estructura
            </q-item-label>
            <q-item clickable :to="{ name: 'teams' }" class="settings-item">
              <q-item-section avatar><q-avatar size="36px" color="indigo" text-color="white" icon="groups" /></q-item-section>
              <q-item-section>
                <q-item-label>Equipos</q-item-label>
                <q-item-label caption>Gestionar equipos del club</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="chevron_right" /></q-item-section>
            </q-item>
            <q-item clickable :to="{ name: 'events' }" class="settings-item">
              <q-item-section avatar><q-avatar size="36px" color="pink" text-color="white" icon="event" /></q-item-section>
              <q-item-section>
                <q-item-label>Eventos</q-item-label>
                <q-item-label caption>Gestionar eventos y actividades</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="chevron_right" /></q-item-section>
            </q-item>
            <q-item clickable :to="{ name: 'projects' }" class="settings-item">
              <q-item-section avatar><q-avatar size="36px" color="cyan-8" text-color="white" icon="folder" /></q-item-section>
              <q-item-section>
                <q-item-label>Proyectos</q-item-label>
                <q-item-label caption>Gestionar proyectos del club</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="chevron_right" /></q-item-section>
            </q-item>

            <q-separator spaced />

            <!-- Data Tools -->
            <q-item-label header class="settings-section-title">
              <q-icon name="storage" class="q-mr-xs" /> Herramientas de datos
            </q-item-label>
            <q-item clickable :to="{ name: 'import-data' }" class="settings-item">
              <q-item-section avatar><q-avatar size="36px" color="primary" text-color="white" icon="upload_file" /></q-item-section>
              <q-item-section>
                <q-item-label>Importar datos</q-item-label>
                <q-item-label caption>Cargar transacciones desde Excel</q-item-label>
              </q-item-section>
              <q-item-section side><q-icon name="chevron_right" /></q-item-section>
            </q-item>
            <q-item clickable class="settings-item" @click="runKeywordsMigration">
              <q-item-section avatar><q-avatar size="36px" color="orange" text-color="white" icon="manage_search" /></q-item-section>
              <q-item-section>
                <q-item-label>Indexar búsqueda</q-item-label>
                <q-item-label caption>
                  {{ migrationStatus || 'Generar índice de búsqueda para transacciones existentes' }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-spinner v-if="migrating" color="primary" size="20px" />
                <q-icon v-else name="play_arrow" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <!-- Catalog Editor Dialog -->
    <q-dialog v-model="showCatalogDialog" persistent>
      <q-card style="min-width: 450px; max-width: 550px;">
        <q-card-section class="row items-center q-pb-none">
          <q-icon :name="catalogDialogConfig.icon" :color="catalogDialogConfig.color" size="28px" class="q-mr-sm" />
          <span class="text-h6">{{ catalogDialogConfig.title }}</span>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>

        <q-card-section>
          <!-- Add new -->
          <div class="row q-gutter-sm q-mb-md">
            <q-input
              v-model="newItemName"
              :label="catalogDialogConfig.addLabel"
              outlined
              dense
              class="col"
              @keyup.enter="addCatalogItem"
            />
            <q-btn icon="add" color="primary" dense :disable="!newItemName.trim()" @click="addCatalogItem" />
          </div>

          <!-- List -->
          <q-list separator bordered class="rounded-borders">
            <q-item v-for="item in catalogDialogItems" :key="item.id">
              <q-item-section>
                <q-item-label v-if="editingItemId !== item.id">{{ item.name }}</q-item-label>
                <q-input
                  v-else
                  v-model="editingItemName"
                  dense
                  outlined
                  autofocus
                  @keyup.enter="saveEditItem"
                  @keyup.escape="cancelEdit"
                />
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn
                    v-if="editingItemId !== item.id"
                    flat round dense icon="edit" size="sm"
                    @click="startEdit(item)"
                  />
                  <q-btn
                    v-if="editingItemId === item.id"
                    flat round dense icon="check" color="positive" size="sm"
                    @click="saveEditItem"
                  />
                  <q-btn
                    v-if="editingItemId === item.id"
                    flat round dense icon="close" color="grey" size="sm"
                    @click="cancelEdit"
                  />
                  <q-btn
                    v-if="editingItemId !== item.id"
                    flat round dense icon="delete" color="negative" size="sm"
                    @click="deleteCatalogItem(item.id)"
                  />
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="catalogDialogItems.length === 0">
              <q-item-section class="text-grey text-center">
                No hay elementos. Añade uno arriba.
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useTransactionsStore } from 'src/stores/transactions'
import { useCatalogsStore } from 'src/stores/catalogs'
import { useSensitiveData } from 'src/composables/useSensitiveData'
import { logger } from 'src/utils/logger'

const $q = useQuasar()
const authStore = useAuthStore()
const transactionsStore = useTransactionsStore()
const catalogsStore = useCatalogsStore()
const { canViewSensitive, privacyModeEnabled, setPrivacyMode } = useSensitiveData()

// Tab state — default to 'club' for admins, 'account' for others
const activeTab = ref(authStore.canManageSettings ? 'club' : 'account')
const darkMode = ref($q.dark.isActive)

// Privacy mode (anti-curious) — two-way binding with composable
const privacyMode = computed({
  get: () => privacyModeEnabled.value,
  set: (val: boolean) => setPrivacyMode(val)
})

// Migration state
const migrating = ref(false)
const migrationStatus = ref('')

watch(darkMode, (val) => {
  $q.dark.set(val)
  localStorage.setItem('darkMode', val.toString())
})

async function runKeywordsMigration() {
  if (migrating.value) return
  migrating.value = true
  migrationStatus.value = 'Iniciando...'

  try {
    const count = await transactionsStore.migrateSearchKeywords((done: number, total: number) => {
      migrationStatus.value = `Procesando ${done} de ${total}...`
    })
    migrationStatus.value = `✓ ${count} transacciones indexadas`
    $q.notify({ type: 'positive', message: `Búsqueda indexada: ${count} transacciones` })
  } catch (e) {
    logger.error('Migration error:', e)
    migrationStatus.value = 'Error al migrar'
    $q.notify({ type: 'negative', message: 'Error al indexar búsqueda' })
  } finally {
    migrating.value = false
  }
}

// === Catalog Editor ===
type CatalogType = 'ageCategory' | 'gender' | 'sponsor' | 'supplier'
const showCatalogDialog = ref(false)
const activeCatalog = ref<CatalogType>('ageCategory')
const newItemName = ref('')
const editingItemId = ref<string | null>(null)
const editingItemName = ref('')

const catalogConfigs: Record<CatalogType, { title: string; icon: string; color: string; addLabel: string }> = {
  ageCategory: { title: 'Categorías de edad', icon: 'school', color: 'teal', addLabel: 'Nueva categoría (ej: Juvenil)' },
  gender: { title: 'Opciones de género', icon: 'wc', color: 'purple', addLabel: 'Nuevo género (ej: Masculino)' },
  sponsor: { title: 'Patrocinadores', icon: 'handshake', color: 'amber-8', addLabel: 'Nuevo patrocinador' },
  supplier: { title: 'Proveedores', icon: 'local_shipping', color: 'blue-grey', addLabel: 'Nuevo proveedor' }
}

const catalogDialogConfig = computed(() => catalogConfigs[activeCatalog.value])

const catalogDialogItems = computed(() => {
  switch (activeCatalog.value) {
    case 'ageCategory': return catalogsStore.activeAgeCategories
    case 'gender': return catalogsStore.activeGenderOptions
    case 'sponsor': return catalogsStore.activeSponsors
    case 'supplier': return catalogsStore.activeSuppliers
    default: return []
  }
})

function openCatalogEditor(type: CatalogType) {
  activeCatalog.value = type
  newItemName.value = ''
  editingItemId.value = null
  showCatalogDialog.value = true
}

async function addCatalogItem() {
  const name = newItemName.value.trim()
  if (!name) return

  switch (activeCatalog.value) {
    case 'ageCategory':
      await catalogsStore.createAgeCategory({ name })
      break
    case 'gender':
      await catalogsStore.createGenderOption({ name })
      break
    case 'sponsor':
      await catalogsStore.createSponsor({ name, type: 'official', isActive: true })
      break
    case 'supplier':
      await catalogsStore.createSupplier({ name, isActive: true })
      break
  }

  newItemName.value = ''
  $q.notify({ type: 'positive', message: `"${name}" añadido` })
}

function startEdit(item: { id: string; name: string }) {
  editingItemId.value = item.id
  editingItemName.value = item.name
}

function cancelEdit() {
  editingItemId.value = null
  editingItemName.value = ''
}

async function saveEditItem() {
  if (!editingItemId.value || !editingItemName.value.trim()) return
  const name = editingItemName.value.trim()

  switch (activeCatalog.value) {
    case 'ageCategory':
      await catalogsStore.updateAgeCategory(editingItemId.value, { name })
      break
    case 'gender':
      await catalogsStore.updateGenderOption(editingItemId.value, { name })
      break
    case 'sponsor':
      await catalogsStore.updateSponsor(editingItemId.value, { name })
      break
    case 'supplier':
      await catalogsStore.updateSupplier(editingItemId.value, { name })
      break
  }

  cancelEdit()
  $q.notify({ type: 'positive', message: 'Actualizado' })
}

async function deleteCatalogItem(id: string) {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: '¿Seguro que quieres eliminar este elemento?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    switch (activeCatalog.value) {
      case 'ageCategory':
        await catalogsStore.deleteAgeCategory(id)
        break
      case 'gender':
        await catalogsStore.deleteGenderOption(id)
        break
      case 'sponsor':
        await catalogsStore.deleteSponsor(id)
        break
      case 'supplier':
        await catalogsStore.deleteSupplier(id)
        break
    }
    $q.notify({ type: 'info', message: 'Eliminado' })
  })
}

onMounted(() => {
  catalogsStore.fetchAll()
})
</script>

<style lang="scss" scoped>
.settings-page {
  background: var(--color-bg-primary);
}

.page-content {
  max-width: 640px;
  margin: 0 auto;
}

.settings-tabs {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: 4px;
}

.settings-panels {
  background: transparent;
}

.settings-list {
  background: transparent;
}

.settings-section-title {
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  padding-bottom: 4px;
}

.settings-item {
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-tertiary);
  }
}
</style>
