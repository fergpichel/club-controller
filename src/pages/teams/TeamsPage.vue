<template>
  <q-page class="teams-page">
    <!-- Header -->
    <div class="page-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Equipos</h1>
          <p class="header-subtitle">{{ seasonTeams.length }} equipos en {{ selectedSeason }}</p>
        </div>
        <div class="row items-center q-gutter-sm">
          <q-select
            v-model="selectedSeason"
            :options="seasonOptions"
            label="Temporada"
            outlined
            dense
            emit-value
            map-options
            style="min-width: 170px"
          />
          <q-btn-dropdown
            v-if="authStore.isManager"
            color="primary"
            text-color="white"
            icon="add"
            label="Nuevo"
            no-caps
          >
            <q-list>
              <q-item v-close-popup clickable @click="showCreateDialog = true">
                <q-item-section avatar><q-icon name="group_add" /></q-item-section>
                <q-item-section>Crear equipo</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="copyFromPrevious">
                <q-item-section avatar><q-icon name="content_copy" /></q-item-section>
                <q-item-section>
                  <q-item-label>Copiar de temporada anterior</q-item-label>
                  <q-item-label caption>Duplicar equipos de {{ previousSeason }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Teams grid -->
      <div v-if="seasonTeams.length > 0" class="teams-grid">
        <q-card
          v-for="team in seasonTeams"
          :key="team.id"
          class="team-card"
          clickable
          @click="$router.push({ name: 'team-detail', params: { id: team.id } })"
        >
          <div class="team-color-bar" :style="{ backgroundColor: team.color }"></div>
          <q-card-section>
            <div class="row items-center q-mb-sm">
              <q-avatar :style="{ backgroundColor: team.color }" text-color="white" size="48px">
                {{ team.name.charAt(0) }}
              </q-avatar>
              <div class="q-ml-md">
                <div class="team-name">{{ team.name }}</div>
                <div v-if="team.description" class="team-description">{{ team.description }}</div>
              </div>
            </div>
            <div class="row q-gutter-xs q-mt-xs">
              <q-chip v-if="getAgeCategoryName(team)" dense size="sm" color="grey-8" text-color="white">
                {{ getAgeCategoryName(team) }}
              </q-chip>
              <q-chip v-if="getGenderName(team)" dense size="sm" outline>
                {{ getGenderName(team) }}
              </q-chip>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="team-stats">
            <div class="stat">
              <span class="stat-value text-positive">{{ formatCurrency(getTeamIncome(team.id)) }}</span>
              <span class="stat-label">Ingresos</span>
            </div>
            <div class="stat">
              <span class="stat-value text-negative">{{ formatCurrency(getTeamExpenses(team.id)) }}</span>
              <span class="stat-label">Gastos</span>
            </div>
          </q-card-section>
          <q-card-actions>
            <q-btn flat color="primary" label="Ver detalle" :to="{ name: 'team-detail', params: { id: team.id } }" />
            <q-space />
            <q-btn v-if="authStore.isManager" flat round icon="edit" @click.stop="editTeam(team)" />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state text-center q-pa-xl">
        <q-icon name="groups" size="64px" color="grey-5" />
        <p class="text-h6 text-grey-5 q-mt-md">Sin equipos en {{ selectedSeason }}</p>
        <p class="text-grey-6">Crea equipos o copia los de la temporada anterior</p>
        <div v-if="authStore.isManager" class="row justify-center q-gutter-sm q-mt-md">
          <q-btn color="primary" label="Crear equipo" icon="add" no-caps @click="showCreateDialog = true" />
          <q-btn outline color="primary" label="Copiar de anterior" icon="content_copy" no-caps @click="copyFromPrevious" />
        </div>
      </div>
    </div>

    <!-- Create/Edit dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 450px">
        <q-card-section class="row items-center">
          <q-avatar icon="groups" color="primary" text-color="white" />
          <span class="q-ml-sm text-h6">{{ editingTeam ? 'Editar' : 'Nuevo' }} equipo</span>
          <q-space />
          <q-badge color="primary" :label="selectedSeason" />
        </q-card-section>

        <q-card-section>
          <q-form class="q-gutter-md" @submit.prevent="saveTeam">
            <q-input
              v-model="teamForm.name"
              label="Nombre del equipo"
              outlined
              :rules="[val => !!val || 'Nombre requerido']"
            />
            <q-input
              v-model="teamForm.description"
              label="Descripción (opcional)"
              outlined
            />
            <div class="row q-gutter-sm">
              <q-select
                v-model="teamForm.ageCategoryId"
                :options="ageCategoryFilter.options.value"
                label="Categoría de edad"
                outlined
                emit-value
                map-options
                clearable
                use-input
                input-debounce="0"
                class="col"
                @filter="ageCategoryFilter.filter"
              />
              <q-select
                v-model="teamForm.genderOptionId"
                :options="genderFilter.options.value"
                label="Género"
                outlined
                emit-value
                map-options
                clearable
                use-input
                input-debounce="0"
                class="col"
                @filter="genderFilter.filter"
              />
            </div>
            <q-input
              v-model.number="teamForm.playersCount"
              label="Nº jugadores"
              outlined
              type="number"
            />
            <div class="row items-center">
              <span class="q-mr-md">Color:</span>
              <q-btn :style="{ backgroundColor: teamForm.color }" round size="md">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-color v-model="teamForm.color" />
                </q-popup-proxy>
              </q-btn>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" color="grey" @click="resetForm" />
          <q-btn label="Guardar" color="primary" :loading="saving" @click="saveTeam" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useTeamsStore } from 'src/stores/teams'
import { useTransactionsStore } from 'src/stores/transactions'
import { useCatalogsStore } from 'src/stores/catalogs'
import { computeSeason, getSeasonOptions } from 'src/types'
import type { Team, Season } from 'src/types'
import { useSelectFilter } from 'src/composables/useSelectFilter'
import { formatCurrency } from 'src/utils/formatters'

const $q = useQuasar()
const authStore = useAuthStore()
const teamsStore = useTeamsStore()
const transactionsStore = useTransactionsStore()
const catalogsStore = useCatalogsStore()

// Season management
const currentSeason = computeSeason(new Date())
const selectedSeason = ref<Season>(currentSeason)
const seasonOptions = computed(() => getSeasonOptions(5))

const previousSeason = computed(() => {
  const startYear = parseInt(selectedSeason.value.split('/')[0])
  const prevYear = startYear - 1
  return `${prevYear}/${String(prevYear + 1).slice(-2)}`
})

// State
const showCreateDialog = ref(false)
const editingTeam = ref<Team | null>(null)
const saving = ref(false)
const teamForm = ref({
  name: '',
  description: '',
  ageCategoryId: null as string | null,
  genderOptionId: null as string | null,
  playersCount: null as number | null,
  color: '#2196F3'
})

// Computed
const seasonTeams = computed(() => teamsStore.getTeamsBySeason(selectedSeason.value))

const ageCategoryOptions = computed(() =>
  catalogsStore.activeAgeCategories.map(a => ({ label: a.name, value: a.id }))
)
const ageCategoryFilter = useSelectFilter(ageCategoryOptions)

const genderOptionsList = computed(() =>
  catalogsStore.activeGenderOptions.map(g => ({ label: g.name, value: g.id }))
)
const genderFilter = useSelectFilter(genderOptionsList)

// Helpers

function getTeamIncome(teamId: string): number {
  return transactionsStore.transactions
    .filter(t => t.teamId === teamId && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
}

function getTeamExpenses(teamId: string): number {
  return transactionsStore.transactions
    .filter(t => t.teamId === teamId && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
}

function getAgeCategoryName(team: Team): string {
  if (team.ageCategoryId) {
    const cat = catalogsStore.ageCategories.find(a => a.id === team.ageCategoryId)
    if (cat) return cat.name
  }
  return team.ageGroup || ''
}

function getGenderName(team: Team): string {
  if (team.genderOptionId) {
    const g = catalogsStore.genderOptions.find(o => o.id === team.genderOptionId)
    if (g) return g.name
  }
  const genderLabels: Record<string, string> = { male: 'Masculino', female: 'Femenino', mixed: 'Mixto' }
  return genderLabels[team.gender] || ''
}

function editTeam(team: Team) {
  editingTeam.value = team
  teamForm.value = {
    name: team.name,
    description: team.description || '',
    ageCategoryId: team.ageCategoryId || null,
    genderOptionId: team.genderOptionId || null,
    playersCount: team.playersCount || null,
    color: team.color
  }
  showCreateDialog.value = true
}

function resetForm() {
  editingTeam.value = null
  teamForm.value = { name: '', description: '', ageCategoryId: null, genderOptionId: null, playersCount: null, color: '#2196F3' }
}

async function saveTeam() {
  if (!teamForm.value.name) return
  saving.value = true

  try {
    const data = {
      name: teamForm.value.name,
      description: teamForm.value.description || undefined,
      ageCategoryId: teamForm.value.ageCategoryId || undefined,
      genderOptionId: teamForm.value.genderOptionId || undefined,
      playersCount: teamForm.value.playersCount || undefined,
      color: teamForm.value.color
    }

    if (editingTeam.value) {
      await teamsStore.updateTeam(editingTeam.value.id, data)
      $q.notify({ type: 'positive', message: 'Equipo actualizado' })
    } else {
      await teamsStore.createTeam({
        ...data,
        season: selectedSeason.value,
        ageGroup: '' as Team['ageGroup'],
        gender: 'mixed' as Team['gender'],
        isActive: true
      })
      $q.notify({ type: 'positive', message: 'Equipo creado' })
    }

    showCreateDialog.value = false
    resetForm()
  } catch {
    $q.notify({ type: 'negative', message: 'Error al guardar equipo' })
  } finally {
    saving.value = false
  }
}

async function copyFromPrevious() {
  $q.dialog({
    title: 'Copiar equipos',
    message: `¿Copiar los equipos de ${previousSeason.value} a ${selectedSeason.value}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    $q.loading.show({ message: 'Copiando equipos...' })
    try {
      const count = await teamsStore.copyTeamsFromSeason(previousSeason.value, selectedSeason.value)
      $q.loading.hide()
      if (count > 0) {
        $q.notify({ type: 'positive', message: `${count} equipos copiados` })
      } else {
        $q.notify({ type: 'info', message: 'No se encontraron equipos nuevos para copiar' })
      }
    } catch {
      $q.loading.hide()
      $q.notify({ type: 'negative', message: 'Error al copiar equipos' })
    }
  })
}

onMounted(async () => {
  await Promise.all([
    teamsStore.fetchTeams(),
    transactionsStore.fetchTransactions({}),
    catalogsStore.fetchAgeCategories(),
    catalogsStore.fetchGenderOptions()
  ])
})
</script>

<style lang="scss" scoped>
.teams-page {
  background: var(--color-bg-primary);
}

.page-content {
  max-width: 1000px;
  margin: 0 auto;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.team-card {
  position: relative;
  overflow: hidden;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .team-color-bar {
    height: 4px;
    width: 100%;
  }

  .team-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .team-description {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .team-stats {
    display: flex;
    justify-content: space-around;

    .stat {
      text-align: center;

      .stat-value {
        display: block;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 600;
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--color-text-secondary);
      }
    }
  }
}
</style>
