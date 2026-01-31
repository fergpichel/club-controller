<template>
  <q-page v-if="event" class="event-detail-page">
    <div class="page-header events-header">
      <div class="row items-center">
        <q-btn flat round icon="arrow_back" color="white" @click="$router.back()" />
        <q-icon name="event" size="32px" color="white" class="q-ml-md" />
        <div class="q-ml-md">
          <h1>{{ event.name }}</h1>
          <p class="header-subtitle">{{ formatDate(event.date) }} {{ event.location ? `· ${event.location}` : '' }}</p>
        </div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <div class="stats-grid q-mb-lg">
        <div class="stat-card stat-positive"><div class="stat-value text-positive">{{ formatCurrency(totalIncome) }}</div><div class="stat-label">Ingresos</div></div>
        <div class="stat-card stat-negative"><div class="stat-value text-negative">{{ formatCurrency(totalExpenses) }}</div><div class="stat-label">Gastos</div></div>
        <div class="stat-card stat-neutral"><div class="stat-value" :class="balance >= 0 ? 'text-positive' : 'text-negative'">{{ formatCurrency(balance) }}</div><div class="stat-label">Balance</div></div>
        <div class="stat-card"><div class="stat-value">{{ transactions.length }}</div><div class="stat-label">Transacciones</div></div>
      </div>

      <q-card>
        <q-card-section>
          <h3 class="section-title q-mb-md">Transacciones</h3>
          <div v-if="transactions.length > 0"><TransactionItem v-for="t in transactions" :key="t.id" :transaction="t" /></div>
          <div v-else class="empty-state q-py-lg"><p class="empty-title">Sin transacciones</p></div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTeamsStore } from 'src/stores/teams';
import { useTransactionsStore } from 'src/stores/transactions';
import TransactionItem from 'src/components/TransactionItem.vue';

const props = defineProps<{ id?: string }>();
const route = useRoute();
const teamsStore = useTeamsStore();
const transactionsStore = useTransactionsStore();

const eventId = computed(() => props.id || route.params.id as string);
const event = computed(() => teamsStore.getEventById(eventId.value));
const transactions = computed(() => transactionsStore.transactions.filter(t => t.eventId === eventId.value));
const totalIncome = computed(() => transactions.value.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
const totalExpenses = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
const balance = computed(() => totalIncome.value - totalExpenses.value);

function formatCurrency(value: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value); }
function formatDate(date: Date) { return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es }); }

onMounted(() => { if (!event.value) teamsStore.fetchEvents(); transactionsStore.fetchTransactions({ eventId: eventId.value }); });
</script>

<style lang="scss" scoped>
.event-detail-page { background: var(--color-background); }
.events-header { background: linear-gradient(135deg, #E65100 0%, #FF9800 100%); }
.page-content { max-width: 800px; margin: 0 auto; }
.section-title { font-size: 1rem; font-weight: 600; margin: 0; }
</style>
