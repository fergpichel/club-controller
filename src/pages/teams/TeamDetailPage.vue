<template>
  <q-page v-if="team" class="team-detail-page">
    <!-- Header -->
    <div class="page-header" :style="{ background: `linear-gradient(135deg, ${team.color} 0%, ${lightenColor(team.color, 20)} 100%)` }">
      <div class="row items-center">
        <q-btn flat round icon="arrow_back" color="white" @click="$router.back()" />
        <q-avatar :style="{ backgroundColor: 'rgba(255,255,255,0.2)' }" text-color="white" size="48px" class="q-ml-md">
          {{ team.name.charAt(0) }}
        </q-avatar>
        <div class="q-ml-md">
          <h1>{{ team.name }}</h1>
          <p class="header-subtitle">{{ team.sport }} {{ team.ageGroup ? `· ${team.ageGroup}` : '' }}</p>
        </div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <!-- Stats -->
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
        <div class="stat-card">
          <div class="stat-value">{{ transactions.length }}</div>
          <div class="stat-label">Transacciones</div>
        </div>
      </div>

      <!-- Transactions -->
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between q-mb-md">
            <h3 class="section-title">Transacciones del equipo</h3>
            <q-btn
              flat
              dense
              color="primary"
              label="Nueva transacción"
              icon="add"
              @click="newTransaction"
            />
          </div>

          <div v-if="transactions.length > 0">
            <TransactionItem
              v-for="transaction in transactions"
              :key="transaction.id"
              :transaction="transaction"
            />
          </div>

          <div v-else class="empty-state q-py-lg">
            <q-icon name="receipt_long" class="empty-icon" />
            <p class="empty-title">Sin transacciones</p>
            <p class="empty-description">Este equipo no tiene transacciones asignadas</p>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTeamsStore } from 'src/stores/teams';
import { useTransactionsStore } from 'src/stores/transactions';
import TransactionItem from 'src/components/TransactionItem.vue';

const props = defineProps<{ id?: string }>();

const route = useRoute();
const router = useRouter();
const teamsStore = useTeamsStore();
const transactionsStore = useTransactionsStore();

const teamId = computed(() => props.id || route.params.id as string);
const team = computed(() => teamsStore.getTeamById(teamId.value));

const transactions = computed(() =>
  transactionsStore.transactions.filter(t => t.teamId === teamId.value)
);

const totalIncome = computed(() =>
  transactions.value.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
);

const totalExpenses = computed(() =>
  transactions.value.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
);

const balance = computed(() => totalIncome.value - totalExpenses.value);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0
  }).format(value);
}

function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)}`;
}

function newTransaction() {
  router.push({ name: 'new-transaction', params: { type: 'expense' }, query: { teamId: teamId.value } });
}

onMounted(() => {
  if (!team.value) {
    teamsStore.fetchTeams();
  }
  transactionsStore.fetchTransactions({ teamId: teamId.value });
});
</script>

<style lang="scss" scoped>
.team-detail-page {
  background: var(--color-background);
}

.page-content {
  max-width: 800px;
  margin: 0 auto;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}
</style>
