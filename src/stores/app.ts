import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { computeSeason, getSeasonOptions, getSeasonDates, type Season } from 'src/types'

export const useAppStore = defineStore('app', () => {
  // Current season based on today's date
  const currentSeason = computeSeason(new Date())
  
  // Selected season (defaults to current)
  const selectedSeason = ref<Season>(currentSeason)
  
  // Available seasons for selection
  const seasonOptions = getSeasonOptions(5)
  
  // Computed dates for the selected season
  const seasonDates = computed(() => getSeasonDates(selectedSeason.value))
  
  // Is viewing the current season?
  const isCurrentSeason = computed(() => selectedSeason.value === currentSeason)
  
  // Season label for display
  const seasonLabel = computed(() => `Temporada ${selectedSeason.value}`)
  
  // Actions
  function setSeason(season: Season) {
    selectedSeason.value = season
    // Persist to localStorage
    localStorage.setItem('selectedSeason', season)
  }
  
  function loadSavedSeason() {
    const saved = localStorage.getItem('selectedSeason')
    if (saved && seasonOptions.some(s => s.value === saved)) {
      selectedSeason.value = saved
    }
  }
  
  function resetToCurrentSeason() {
    selectedSeason.value = currentSeason
    localStorage.removeItem('selectedSeason')
  }
  
  return {
    // State
    currentSeason,
    selectedSeason,
    seasonOptions,
    
    // Computed
    seasonDates,
    isCurrentSeason,
    seasonLabel,
    
    // Actions
    setSeason,
    loadSavedSeason,
    resetToCurrentSeason
  }
})
