<template>
  <q-page class="profitability-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <p class="header-eyebrow">Análisis financiero</p>
          <h1>Rentabilidad por equipo</h1>
          <p class="header-subtitle">
            ¿Son sostenibles las cuotas? ¿Qué equipos necesitan atención?
          </p>
        </div>
        <div class="header-right row items-center q-gutter-sm">
          <q-select
            v-model="selectedSeason"
            :options="seasonOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            label="Temporada"
            outlined
            dense
            style="min-width: 140px"
          />
          <q-btn
            color="primary"
            text-color="white"
            icon="refresh"
            label="Actualizar"
            no-caps
            @click="refreshData"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="page-content">
      <TeamProfitabilityDashboard :season="selectedSeason" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import TeamProfitabilityDashboard from 'src/components/TeamProfitabilityDashboard.vue'
import { useTransactionsStore } from 'src/stores/transactions'
import { useTeamsStore } from 'src/stores/teams'
import { useCategoriesStore } from 'src/stores/categories'
import { computeSeason, getSeasonDates, getSeasonOptions } from 'src/types'
import type { Season } from 'src/types'

const transactionsStore = useTransactionsStore()
const teamsStore = useTeamsStore()
const categoriesStore = useCategoriesStore()

const currentSeason = computeSeason(new Date())
const selectedSeason = ref<Season>(currentSeason)
const seasonOptions = computed(() => getSeasonOptions(5))

async function refreshData() {
  const { start, end } = getSeasonDates(selectedSeason.value)
  await Promise.all([
    transactionsStore.fetchAllInDateRange(start, end),
    teamsStore.teams.length === 0 ? teamsStore.fetchTeams() : Promise.resolve(),
    categoriesStore.categories.length === 0 ? categoriesStore.fetchCategories() : Promise.resolve()
  ])
}

watch(selectedSeason, () => {
  refreshData()
})

onMounted(() => {
  refreshData()
})
</script>

<style lang="scss" scoped>
.profitability-page {
  background: var(--color-bg-primary);
  min-height: 100vh;
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.header-left {
  h1 {
    font-size: 2rem;
    margin-bottom: var(--space-2);
  }
}

.header-right {
  flex-shrink: 0;
}
</style>
