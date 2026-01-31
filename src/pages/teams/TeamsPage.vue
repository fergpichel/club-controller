<template>
  <q-page class="teams-page">
    <!-- Header -->
    <div class="page-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Equipos</h1>
          <p class="header-subtitle">{{ teams.length }} equipos registrados</p>
        </div>
        <q-btn
          v-if="authStore.isManager"
          color="white"
          text-color="primary"
          icon="add"
          label="Nuevo equipo"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Teams grid -->
      <div v-if="teams.length > 0" class="teams-grid">
        <q-card
          v-for="team in teams"
          :key="team.id"
          class="team-card animate-stagger"
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
                <div class="team-sport">{{ team.sport }}</div>
              </div>
            </div>
            <div v-if="team.ageGroup" class="team-age">
              <q-chip dense size="sm" color="grey-3">
                {{ team.ageGroup }}
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
            <q-btn
              flat
              color="primary"
              label="Ver detalle"
              :to="{ name: 'team-detail', params: { id: team.id } }"
            />
            <q-space />
            <q-btn
              v-if="authStore.isManager"
              flat
              round
              icon="edit"
              @click.stop="editTeam(team)"
            />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <q-icon name="groups" class="empty-icon" />
        <p class="empty-title">Sin equipos</p>
        <p class="empty-description">Añade equipos para organizar las finanzas</p>
        <q-btn
          v-if="authStore.isManager"
          color="primary"
          label="Crear equipo"
          icon="add"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- Create/Edit dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <q-avatar icon="groups" color="primary" text-color="white" />
          <span class="q-ml-sm text-h6">{{ editingTeam ? 'Editar' : 'Nuevo' }} equipo</span>
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
              v-model="teamForm.sport"
              label="Deporte"
              outlined
              :rules="[val => !!val || 'Deporte requerido']"
            />
            <q-input
              v-model="teamForm.ageGroup"
              label="Categoría de edad (opcional)"
              outlined
              hint="Ej: Cadete, Juvenil, Senior"
            />
            <div class="row items-center">
              <span class="q-mr-md">Color:</span>
              <q-btn
                :style="{ backgroundColor: teamForm.color }"
                round
                size="md"
              >
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-color v-model="teamForm.color" />
                </q-popup-proxy>
              </q-btn>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" color="grey" @click="resetForm" />
          <q-btn
            label="Guardar"
            color="primary"
            :loading="saving"
            @click="saveTeam"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { useTeamsStore } from 'src/stores/teams';
import { useTransactionsStore } from 'src/stores/transactions';
import type { Team } from 'src/types';

const $q = useQuasar();
const authStore = useAuthStore();
const teamsStore = useTeamsStore();
const transactionsStore = useTransactionsStore();

// State
const showCreateDialog = ref(false);
const editingTeam = ref<Team | null>(null);
const saving = ref(false);
const teamForm = ref({
  name: '',
  sport: '',
  ageGroup: '',
  color: '#2196F3'
});

const teams = computed(() => teamsStore.teams);

// Methods
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0
  }).format(value);
}

function getTeamIncome(teamId: string): number {
  return transactionsStore.transactions
    .filter(t => t.teamId === teamId && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

function getTeamExpenses(teamId: string): number {
  return transactionsStore.transactions
    .filter(t => t.teamId === teamId && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

function editTeam(team: Team) {
  editingTeam.value = team;
  teamForm.value = {
    name: team.name,
    sport: team.sport,
    ageGroup: team.ageGroup || '',
    color: team.color
  };
  showCreateDialog.value = true;
}

function resetForm() {
  editingTeam.value = null;
  teamForm.value = {
    name: '',
    sport: '',
    ageGroup: '',
    color: '#2196F3'
  };
}

async function saveTeam() {
  if (!teamForm.value.name || !teamForm.value.sport) return;

  saving.value = true;

  try {
    if (editingTeam.value) {
      await teamsStore.updateTeam(editingTeam.value.id, {
        name: teamForm.value.name,
        sport: teamForm.value.sport,
        ageGroup: teamForm.value.ageGroup || undefined,
        color: teamForm.value.color
      });
      $q.notify({ type: 'positive', message: 'Equipo actualizado' });
    } else {
      await teamsStore.createTeam({
        name: teamForm.value.name,
        sport: teamForm.value.sport,
        ageGroup: teamForm.value.ageGroup || undefined,
        color: teamForm.value.color,
        isActive: true
      });
      $q.notify({ type: 'positive', message: 'Equipo creado' });
    }

    showCreateDialog.value = false;
    resetForm();
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error al guardar equipo' });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await teamsStore.fetchTeams();
  // Also fetch transactions to show team finances
  await transactionsStore.fetchTransactions({});
});
</script>

<style lang="scss" scoped>
.teams-page {
  background: var(--color-background);
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

  .team-sport {
    font-size: 0.85rem;
    color: var(--color-on-surface-variant);
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
        color: var(--color-on-surface-variant);
      }
    }
  }
}
</style>
