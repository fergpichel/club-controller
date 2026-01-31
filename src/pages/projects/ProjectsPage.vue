<template>
  <q-page class="projects-page">
    <!-- Header -->
    <div class="page-header projects-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Proyectos</h1>
          <p class="header-subtitle">{{ projects.length }} proyectos</p>
        </div>
        <q-btn
          v-if="authStore.isManager"
          color="white"
          text-color="secondary"
          icon="add"
          label="Nuevo proyecto"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Filter tabs -->
      <q-tabs v-model="statusFilter" dense class="q-mb-md" align="left">
        <q-tab name="all" label="Todos" />
        <q-tab name="active" label="Activos" />
        <q-tab name="completed" label="Completados" />
      </q-tabs>

      <!-- Projects list -->
      <div v-if="filteredProjects.length > 0">
        <q-card
          v-for="project in filteredProjects"
          :key="project.id"
          class="project-card q-mb-md animate-stagger"
          clickable
          @click="$router.push({ name: 'project-detail', params: { id: project.id } })"
        >
          <q-card-section>
            <div class="row items-start">
              <q-icon name="folder" color="secondary" size="32px" class="q-mr-md" />
              <div class="col">
                <div class="project-name">{{ project.name }}</div>
                <div class="project-description">{{ project.description || 'Sin descripción' }}</div>
                <div class="project-meta">
                  <q-badge :color="getStatusColor(project.status)" :label="getStatusLabel(project.status)" />
                  <span v-if="project.budget" class="budget-info">
                    Presupuesto: {{ formatCurrency(project.budget) }}
                  </span>
                </div>
              </div>
              <div class="project-amounts">
                <span class="text-positive">+{{ formatCurrency(getProjectIncome(project.id)) }}</span>
                <span class="text-negative">-{{ formatCurrency(getProjectExpenses(project.id)) }}</span>
              </div>
            </div>
          </q-card-section>
          <q-linear-progress
            v-if="project.budget"
            :value="getProjectExpenses(project.id) / project.budget"
            :color="getProjectExpenses(project.id) > project.budget ? 'negative' : 'positive'"
            class="project-progress"
          />
        </q-card>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <q-icon name="folder_open" class="empty-icon" />
        <p class="empty-title">Sin proyectos</p>
        <p class="empty-description">Crea proyectos para organizar actividades específicas</p>
        <q-btn
          v-if="authStore.isManager"
          color="primary"
          label="Crear proyecto"
          icon="add"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- Create dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 450px">
        <q-card-section class="row items-center">
          <q-avatar icon="folder" color="secondary" text-color="white" />
          <span class="q-ml-sm text-h6">Nuevo proyecto</span>
        </q-card-section>

        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model="projectForm.name" label="Nombre" outlined :rules="[val => !!val || 'Requerido']" />
            <q-input v-model="projectForm.description" label="Descripción" outlined type="textarea" rows="2" />
            <q-input v-model.number="projectForm.budget" label="Presupuesto (opcional)" outlined type="number" prefix="€" />
            <q-input v-model="projectForm.startDate" label="Fecha inicio" outlined type="date" />
            <q-input v-model="projectForm.endDate" label="Fecha fin (opcional)" outlined type="date" />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" />
          <q-btn label="Crear" color="primary" :loading="saving" @click="createProject" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { format } from 'date-fns';
import { useAuthStore } from 'src/stores/auth';
import { useTeamsStore } from 'src/stores/teams';
import { useTransactionsStore } from 'src/stores/transactions';

const $q = useQuasar();
const authStore = useAuthStore();
const teamsStore = useTeamsStore();
const transactionsStore = useTransactionsStore();

const showCreateDialog = ref(false);
const saving = ref(false);
const statusFilter = ref('all');
const projectForm = ref({
  name: '',
  description: '',
  budget: null as number | null,
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: ''
});

const projects = computed(() => teamsStore.projects);

const filteredProjects = computed(() => {
  if (statusFilter.value === 'all') return projects.value;
  return projects.value.filter(p => p.status === statusFilter.value);
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value);
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = { active: 'positive', completed: 'info', cancelled: 'negative' };
  return colors[status] || 'grey';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = { active: 'Activo', completed: 'Completado', cancelled: 'Cancelado' };
  return labels[status] || status;
}

function getProjectIncome(projectId: string): number {
  return transactionsStore.transactions.filter(t => t.projectId === projectId && t.type === 'income').reduce((s, t) => s + t.amount, 0);
}

function getProjectExpenses(projectId: string): number {
  return transactionsStore.transactions.filter(t => t.projectId === projectId && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
}

async function createProject() {
  if (!projectForm.value.name) return;
  saving.value = true;
  try {
    await teamsStore.createProject({
      name: projectForm.value.name,
      description: projectForm.value.description,
      budget: projectForm.value.budget || undefined,
      startDate: new Date(projectForm.value.startDate),
      endDate: projectForm.value.endDate ? new Date(projectForm.value.endDate) : undefined,
      status: 'active'
    });
    $q.notify({ type: 'positive', message: 'Proyecto creado' });
    showCreateDialog.value = false;
    projectForm.value = { name: '', description: '', budget: null, startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '' };
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  teamsStore.fetchProjects();
});
</script>

<style lang="scss" scoped>
.projects-page { background: var(--color-background); }
.projects-header { background: linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%); }
.page-content { max-width: 900px; margin: 0 auto; }

.project-card {
  transition: all 0.2s ease;
  &:hover { box-shadow: var(--shadow-lg); }

  .project-name { font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; font-weight: 600; }
  .project-description { font-size: 0.85rem; color: var(--color-on-surface-variant); margin: 4px 0; }
  .project-meta { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
  .budget-info { font-size: 0.8rem; color: var(--color-on-surface-variant); }
  .project-amounts {
    display: flex; flex-direction: column; align-items: flex-end;
    font-family: 'Space Grotesk', sans-serif; font-size: 0.9rem; font-weight: 600;
  }
  .project-progress { height: 4px; }
}
</style>
