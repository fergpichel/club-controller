import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from 'src/boot/firebase'
import { useAuthStore } from './auth'
import type { Team, Project, Event, Season } from 'src/types'
import { logger } from 'src/utils/logger'

// Strip undefined values — Firebase rejects them
function cleanData<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T
}

export const useTeamsStore = defineStore('teams', () => {
  // State
  const teams = ref<Team[]>([])
  const projects = ref<Project[]>([])
  const events = ref<Event[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeTeams = computed(() => teams.value.filter(t => t.isActive))
  const activeProjects = computed(() => projects.value.filter(p => p.status === 'active'))
  const upcomingEvents = computed(() =>
    events.value
      .filter(e => e.status === 'planned' || e.status === 'ongoing')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  )

  // Teams by category
  const teamsByAgeGroup = computed(() => {
    const groups: Record<string, Team[]> = {}
    teams.value.forEach(team => {
      const key = team.ageGroup || 'other'
      if (!groups[key]) groups[key] = []
      groups[key].push(team)
    })
    return groups
  })

  // Season-filtered getters
  function getTeamsBySeason(season: Season) {
    return teams.value.filter(t => t.season === season)
  }

  function getProjectsBySeason(season: Season) {
    return projects.value.filter(p => p.season === season)
  }

  function getEventsBySeason(season: Season) {
    return events.value.filter(e => e.season === season)
  }

  // Teams Actions
  async function fetchTeams() {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return

      const q = query(
        collection(db, 'teams'),
        where('clubId', '==', authStore.clubId)
      )

      const snapshot = await getDocs(q)
      teams.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Team[]
    } catch (e) {
      logger.error('Error fetching teams:', e)
      error.value = 'Error al cargar equipos'
    } finally {
      loading.value = false
    }
  }

  async function createTeam(data: Omit<Team, 'id' | 'clubId' | 'createdAt'>) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return null
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para crear equipos'
        return null
      }

      const docRef = await addDoc(collection(db, 'teams'), cleanData({
        ...data,
        clubId: authStore.clubId,
        createdAt: serverTimestamp()
      }))

      const newTeam: Team = {
        ...data,
        id: docRef.id,
        clubId: authStore.clubId,
        createdAt: new Date()
      }

      teams.value.push(newTeam)
      return newTeam
    } catch (e) {
      logger.error('Error creating team:', e)
      error.value = 'Error al crear equipo'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateTeam(id: string, data: Partial<Team>) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para editar equipos'
        return false
      }

      await updateDoc(doc(db, 'teams', id), {
        ...data,
        updatedAt: serverTimestamp()
      })

      const index = teams.value.findIndex(t => t.id === id)
      if (index !== -1) {
        teams.value[index] = { ...teams.value[index], ...data }
      }

      return true
    } catch (e) {
      logger.error('Error updating team:', e)
      error.value = 'Error al actualizar equipo'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteTeam(id: string) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para eliminar equipos'
        return false
      }

      await deleteDoc(doc(db, 'teams', id))
      teams.value = teams.value.filter(t => t.id !== id)
      return true
    } catch (e) {
      logger.error('Error deleting team:', e)
      error.value = 'Error al eliminar equipo'
      return false
    } finally {
      loading.value = false
    }
  }

  // Projects Actions
  async function fetchProjects() {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return

      const q = query(
        collection(db, 'projects'),
        where('clubId', '==', authStore.clubId)
      )

      const snapshot = await getDocs(q)
      projects.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Project[]
    } catch (e) {
      logger.error('Error fetching projects:', e)
      error.value = 'Error al cargar proyectos'
    } finally {
      loading.value = false
    }
  }

  async function createProject(data: Omit<Project, 'id' | 'clubId' | 'createdAt'>) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return null
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para crear proyectos'
        return null
      }

      const docRef = await addDoc(collection(db, 'projects'), cleanData({
        ...data,
        clubId: authStore.clubId,
        startDate: data.startDate,
        endDate: data.endDate || null,
        createdAt: serverTimestamp()
      }))

      const newProject: Project = {
        ...data,
        id: docRef.id,
        clubId: authStore.clubId,
        createdAt: new Date()
      }

      projects.value.push(newProject)
      return newProject
    } catch (e) {
      logger.error('Error creating project:', e)
      error.value = 'Error al crear proyecto'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateProject(id: string, data: Partial<Project>) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para editar proyectos'
        return false
      }

      await updateDoc(doc(db, 'projects', id), {
        ...data,
        updatedAt: serverTimestamp()
      })

      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = { ...projects.value[index], ...data }
      }

      return true
    } catch (e) {
      logger.error('Error updating project:', e)
      error.value = 'Error al actualizar proyecto'
      return false
    } finally {
      loading.value = false
    }
  }

  // Events Actions
  async function fetchEvents() {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return

      const q = query(
        collection(db, 'events'),
        where('clubId', '==', authStore.clubId)
      )

      const snapshot = await getDocs(q)
      events.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Event[]
    } catch (e) {
      logger.error('Error fetching events:', e)
      error.value = 'Error al cargar eventos'
    } finally {
      loading.value = false
    }
  }

  async function createEvent(data: Omit<Event, 'id' | 'clubId' | 'createdAt'>) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return null
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para crear eventos'
        return null
      }

      const docRef = await addDoc(collection(db, 'events'), cleanData({
        ...data,
        clubId: authStore.clubId,
        createdAt: serverTimestamp()
      }))

      const newEvent: Event = {
        ...data,
        id: docRef.id,
        clubId: authStore.clubId,
        createdAt: new Date()
      }

      events.value.push(newEvent)
      return newEvent
    } catch (e) {
      logger.error('Error creating event:', e)
      error.value = 'Error al crear evento'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateEvent(id: string, data: Partial<Event>) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para editar eventos'
        return false
      }

      await updateDoc(doc(db, 'events', id), {
        ...data,
        updatedAt: serverTimestamp()
      })

      const index = events.value.findIndex(e => e.id === id)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...data }
      }

      return true
    } catch (e) {
      logger.error('Error updating event:', e)
      error.value = 'Error al actualizar evento'
      return false
    } finally {
      loading.value = false
    }
  }

  // Copy teams from one season to another
  async function copyTeamsFromSeason(fromSeason: Season, toSeason: Season): Promise<number> {
    const authStore = useAuthStore()
    if (!authStore.clubId) return 0

    const sourceTeams = teams.value.filter(t => t.season === fromSeason && t.isActive)
    let copied = 0

    for (const team of sourceTeams) {
      // Check if team with same name already exists in target season
      const exists = teams.value.some(
        t => t.season === toSeason && t.name === team.name
      )
      if (exists) continue

      const newTeamData: Omit<Team, 'id' | 'clubId' | 'createdAt'> = {
        season: toSeason,
        name: team.name,
        description: team.description,
        ageCategoryId: team.ageCategoryId,
        genderOptionId: team.genderOptionId,
        ageGroup: team.ageGroup,
        gender: team.gender,
        color: team.color,
        coachId: team.coachId,
        playersCount: 0,
        isActive: true
      }

      await createTeam(newTeamData)
      copied++
    }

    return copied
  }

  // Getters by ID
  function getTeamById(id: string) {
    return teams.value.find(t => t.id === id)
  }

  function getProjectById(id: string) {
    return projects.value.find(p => p.id === id)
  }

  function getEventById(id: string) {
    return events.value.find(e => e.id === id)
  }

  // Fetch all
  async function fetchAll() {
    await Promise.all([
      fetchTeams(),
      fetchProjects(),
      fetchEvents()
    ])
  }

  return {
    // State
    teams,
    projects,
    events,
    loading,
    error,

    // Getters
    activeTeams,
    activeProjects,
    upcomingEvents,
    teamsByAgeGroup,

    // Season helpers
    getTeamsBySeason,
    getProjectsBySeason,
    getEventsBySeason,
    copyTeamsFromSeason,

    // Team Actions
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    getTeamById,

    // Project Actions
    fetchProjects,
    createProject,
    updateProject,
    getProjectById,

    // Event Actions
    fetchEvents,
    createEvent,
    updateEvent,
    getEventById,

    // Utility
    fetchAll
  }
})
