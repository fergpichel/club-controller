<template>
  <q-page class="events-page">
    <div class="page-header">
      <div class="row items-center justify-between">
        <div>
          <h1>Eventos</h1>
          <p class="header-subtitle">{{ seasonEvents.length }} eventos en {{ selectedSeason }}</p>
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
          <q-btn
            v-if="authStore.isManager"
            color="primary"
            text-color="white"
            icon="add"
            label="Nuevo evento"
            no-caps
            @click="showCreateDialog = true"
          />
        </div>
      </div>
    </div>

    <div class="page-content q-pa-md">
      <q-tabs v-model="statusFilter" dense class="q-mb-md" align="left">
        <q-tab name="all" label="Todos" />
        <q-tab name="upcoming" label="Próximos" />
        <q-tab name="completed" label="Completados" />
      </q-tabs>

      <div v-if="filteredEvents.length > 0">
        <q-card
          v-for="event in filteredEvents"
          :key="event.id"
          class="event-card q-mb-md"
          clickable
          @click="$router.push({ name: 'event-detail', params: { id: event.id } })"
        >
          <q-card-section>
            <div class="row items-start">
              <div class="event-date-box">
                <span class="date-day">{{ formatDay(event.date) }}</span>
                <span class="date-month">{{ formatMonth(event.date) }}</span>
              </div>
              <div class="col q-ml-md">
                <div class="event-name">{{ event.name }}</div>
                <div class="event-description">{{ event.description || 'Sin descripción' }}</div>
                <div class="event-meta">
                  <q-badge :color="getStatusColor(event.status)" :label="getStatusLabel(event.status)" />
                  <span v-if="event.location" class="meta-item">
                    <q-icon name="location_on" size="14px" /> {{ event.location }}
                  </span>
                </div>
              </div>
              <div class="event-amounts">
                <span class="text-positive">+{{ formatCurrency(getEventIncome(event.id)) }}</span>
                <span class="text-negative">-{{ formatCurrency(getEventExpenses(event.id)) }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-else class="empty-state text-center q-pa-xl">
        <q-icon name="event" size="64px" color="grey-5" />
        <p class="text-h6 text-grey-5 q-mt-md">Sin eventos en {{ selectedSeason }}</p>
        <p class="text-grey-6">Crea eventos para organizar actividades puntuales</p>
        <q-btn
          v-if="authStore.isManager"
          color="primary"
          label="Crear evento"
          icon="add"
          no-caps
          class="q-mt-md"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 450px">
        <q-card-section class="row items-center">
          <q-avatar icon="event" color="accent" text-color="white" />
          <span class="q-ml-sm text-h6">Nuevo evento</span>
          <q-space />
          <q-badge color="primary" :label="selectedSeason" />
        </q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md">
            <q-input v-model="eventForm.name" label="Nombre" outlined :rules="[val => !!val || 'Requerido']" />
            <q-input v-model="eventForm.description" label="Descripción" outlined type="textarea" rows="2" />
            <q-input v-model="eventForm.date" label="Fecha" outlined type="date" />
            <q-input v-model="eventForm.location" label="Ubicación" outlined />
            <q-input v-model.number="eventForm.budget" label="Presupuesto (opcional)" outlined type="number" prefix="€" />
          </q-form>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancelar" />
          <q-btn label="Crear" color="primary" :loading="saving" @click="createEvent" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { format, isAfter } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from 'src/stores/auth'
import { useTeamsStore } from 'src/stores/teams'
import { useTransactionsStore } from 'src/stores/transactions'
import { computeSeason, getSeasonOptions } from 'src/types'
import type { Season } from 'src/types'
import { formatCurrency } from 'src/utils/formatters'

const $q = useQuasar()
const authStore = useAuthStore()
const teamsStore = useTeamsStore()
const transactionsStore = useTransactionsStore()

// Season
const currentSeason = computeSeason(new Date())
const selectedSeason = ref<Season>(currentSeason)
const seasonOptions = computed(() => getSeasonOptions(5))

const showCreateDialog = ref(false)
const saving = ref(false)
const statusFilter = ref('all')
const eventForm = ref({
  name: '',
  description: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  location: '',
  budget: null as number | null
})

const seasonEvents = computed(() => teamsStore.getEventsBySeason(selectedSeason.value))

const filteredEvents = computed(() => {
  const now = new Date()
  if (statusFilter.value === 'upcoming') {
    return seasonEvents.value.filter(e => isAfter(new Date(e.date), now) || e.status === 'planned')
  }
  if (statusFilter.value === 'completed') {
    return seasonEvents.value.filter(e => e.status === 'completed')
  }
  return seasonEvents.value
})

function formatDay(date: Date) { return format(new Date(date), 'd') }
function formatMonth(date: Date) { return format(new Date(date), 'MMM', { locale: es }) }
function getStatusColor(status: string) {
  return { planned: 'info', ongoing: 'warning', completed: 'positive', cancelled: 'negative' }[status] || 'grey'
}
function getStatusLabel(status: string) {
  return { planned: 'Planificado', ongoing: 'En curso', completed: 'Completado', cancelled: 'Cancelado' }[status] || status
}
function getEventIncome(eventId: string) {
  return transactionsStore.transactions.filter(t => t.eventId === eventId && t.type === 'income').reduce((s, t) => s + t.amount, 0)
}
function getEventExpenses(eventId: string) {
  return transactionsStore.transactions.filter(t => t.eventId === eventId && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
}

async function createEvent() {
  if (!eventForm.value.name) return
  saving.value = true
  try {
    await teamsStore.createEvent({
      name: eventForm.value.name,
      description: eventForm.value.description,
      date: new Date(eventForm.value.date),
      location: eventForm.value.location,
      budget: eventForm.value.budget || undefined,
      status: 'planned',
      season: selectedSeason.value
    })
    $q.notify({ type: 'positive', message: 'Evento creado' })
    showCreateDialog.value = false
    eventForm.value = { name: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), location: '', budget: null }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  teamsStore.fetchEvents()
})
</script>

<style lang="scss" scoped>
.events-page { background: var(--color-bg-primary); }
.page-content { max-width: 900px; margin: 0 auto; }

.event-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
  &:hover { box-shadow: var(--shadow-lg); }

  .event-date-box {
    background: var(--color-bg-secondary);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    min-width: 60px;

    .date-day { display: block; font-size: 1.5rem; font-weight: 700; line-height: 1; }
    .date-month { display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--color-text-secondary); }
  }

  .event-name { font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; font-weight: 600; }
  .event-description { font-size: 0.85rem; color: var(--color-text-secondary); margin: 4px 0; }
  .event-meta {
    display: flex; align-items: center; gap: 12px; margin-top: 8px;
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: var(--color-text-secondary); }
  }
  .event-amounts {
    display: flex; flex-direction: column; align-items: flex-end;
    font-family: 'Space Grotesk', sans-serif; font-size: 0.9rem; font-weight: 600;
  }
}
</style>
