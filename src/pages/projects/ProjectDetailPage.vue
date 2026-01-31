<template>
  <q-page v-if="project" class="project-detail-page">
    <div class="page-header projects-header">
      <div class="row items-center">
        <q-btn flat round icon="arrow_back" color="white" @click="$router.back()" />
        <q-icon name="folder" size="32px" color="white" class="q-ml-md" />
        <div class="q-ml-md">
          <h1>{{ project.name }}</h1>
          <p class="header-subtitle">{{ project.description || 'Sin descripción' }}</p>
        </div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <div class="stats-grid q-mb-lg">
        <div class="stat-card stat-positive">
          <div class="stat-value text-positive">{{ formatCurrency(totalIncome) }}</div>
          <div class="stat-label">Ingresos</div>
        </div>
        <div class="stat-card stat-negative">
          <div class="stat-value text-negative">{{ formatCurrency(totalExpenses) }}</div>
          <div class="stat-label">Gastos</div>
        </div>
        <div class="stat-card stat-neutral">
          <div class="stat-value" :class="balance >= 0 ? 'text-positive' : 'text-negative'">
            {{ formatCurrency(balance) }}
          </div>
          <div class="stat-label">Balance</div>
        </div>
        <div v-if="project.budget" class="stat-card">
          <div class="stat-value">{{ budgetUsedPercent }}%</div>
          <div class="stat-label">Presupuesto usado</div>
        </div>
      </div>

      <q-card v-if="project.budget" class="q-mb-lg">
        <q-card-section>
          <h3 class="section-title q-mb-md">Presupuesto</h3>
          <div class="budget-bar">
            <q-linear-progress :value="budgetUsedPercent / 100" :color="budgetUsedPercent > 100 ? 'negative' : 'positive'" size="20px" />
            <div class="budget-labels">
              <span>{{ formatCurrency(totalExpenses) }} gastado</span>
              <span>{{ formatCurrency(project.budget) }} presupuesto</span>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <h3 class="section-title q-mb-md">Transacciones</h3>
          <div v-if="transactions.length > 0">
            <TransactionItem v-for="t in transactions" :key="t.id" :transaction="t" />
          </div>
          <div v-else class="empty-state q-py-lg">
            <p class="empty-title">Sin transacciones</p>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTeamsStore } from 'src/stores/teams';
import { useTransactionsStore } from 'src/stores/transactions';
import TransactionItem from 'src/components/TransactionItem.vue';

const props = defineProps<{ id?: string }>();
const route = useRoute();
const teamsStore = useTeamsStore();
const transactionsStore = useTransactionsStore();

const projectId = computed(() => props.id || route.params.id as string);
const project = computed(() => teamsStore.getProjectById(projectId.value));
const transactions = computed(() => transactionsStore.transactions.filter(t => t.projectId === projectId.value));
const totalIncome = computed(() => transactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
const totalExpenses = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
const balance = computed(() => totalIncome.value - totalExpenses.value);
const budgetUsedPercent = computed(() => project.value?.budget ? Math.round((totalExpenses.value / project.value.budget) * 100) : 0);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value);
}

onMounted(() => {
  if (!project.value) teamsStore.fetchProjects();
  transactionsStore.fetchTransactions({ projectId: projectId.value });
});
</script>

<style lang="scss" scoped>
.project-detail-page { background: var(--color-background); }
.projects-header { background: linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%); }
.page-content { max-width: 800px; margin: 0 auto; }
.section-title { font-size: 1rem; font-weight: 600; margin: 0; }
.budget-bar { .budget-labels { display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.85rem; color: var(--color-on-surface-variant); } }
</style>
