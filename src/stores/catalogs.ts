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
import type { AgeCategory, GenderOption, Supplier, Sponsor } from 'src/types'
import { logger } from 'src/utils/logger'

export const useCatalogsStore = defineStore('catalogs', () => {
  // State
  const ageCategories = ref<AgeCategory[]>([])
  const genderOptions = ref<GenderOption[]>([])
  const suppliers = ref<Supplier[]>([])
  const sponsors = ref<Sponsor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeAgeCategories = computed(() =>
    ageCategories.value.filter(a => a.isActive).sort((a, b) => a.order - b.order)
  )

  const activeGenderOptions = computed(() =>
    genderOptions.value.filter(g => g.isActive).sort((a, b) => a.order - b.order)
  )

  const activeSuppliers = computed(() =>
    suppliers.value.filter(s => s.isActive).sort((a, b) => a.name.localeCompare(b.name))
  )

  const activeSponsors = computed(() =>
    sponsors.value.filter(s => s.isActive).sort((a, b) => a.name.localeCompare(b.name))
  )

  // === AGE CATEGORIES ===

  async function fetchAgeCategories() {
    const authStore = useAuthStore()
    if (!authStore.clubId) return

    try {
      const q = query(
        collection(db, 'ageCategories'),
        where('clubId', '==', authStore.clubId)
      )
      const snapshot = await getDocs(q)
      ageCategories.value = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as AgeCategory[]
    } catch (e) {
      logger.error('Error fetching age categories:', e)
    }
  }

  async function createAgeCategory(data: { name: string; order?: number }) {
    const authStore = useAuthStore()
    if (!authStore.clubId) return null

    try {
      const docRef = await addDoc(collection(db, 'ageCategories'), {
        clubId: authStore.clubId,
        name: data.name,
        order: data.order ?? ageCategories.value.length,
        isActive: true,
        createdAt: serverTimestamp()
      })

      const newItem: AgeCategory = {
        id: docRef.id,
        clubId: authStore.clubId,
        name: data.name,
        order: data.order ?? ageCategories.value.length,
        isActive: true,
        createdAt: new Date()
      }
      ageCategories.value.push(newItem)
      return newItem
    } catch (e) {
      logger.error('Error creating age category:', e)
      return null
    }
  }

  async function updateAgeCategory(id: string, data: Partial<AgeCategory>) {
    try {
      await updateDoc(doc(db, 'ageCategories', id), { ...data, updatedAt: serverTimestamp() })
      const idx = ageCategories.value.findIndex(a => a.id === id)
      if (idx !== -1) ageCategories.value[idx] = { ...ageCategories.value[idx], ...data }
      return true
    } catch (e) {
      logger.error('Error updating age category:', e)
      return false
    }
  }

  async function deleteAgeCategory(id: string) {
    try {
      await deleteDoc(doc(db, 'ageCategories', id))
      ageCategories.value = ageCategories.value.filter(a => a.id !== id)
      return true
    } catch (e) {
      logger.error('Error deleting age category:', e)
      return false
    }
  }

  // === GENDER OPTIONS ===

  async function fetchGenderOptions() {
    const authStore = useAuthStore()
    if (!authStore.clubId) return

    try {
      const q = query(
        collection(db, 'genderOptions'),
        where('clubId', '==', authStore.clubId)
      )
      const snapshot = await getDocs(q)
      genderOptions.value = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as GenderOption[]
    } catch (e) {
      logger.error('Error fetching gender options:', e)
    }
  }

  async function createGenderOption(data: { name: string; order?: number }) {
    const authStore = useAuthStore()
    if (!authStore.clubId) return null

    try {
      const docRef = await addDoc(collection(db, 'genderOptions'), {
        clubId: authStore.clubId,
        name: data.name,
        order: data.order ?? genderOptions.value.length,
        isActive: true,
        createdAt: serverTimestamp()
      })

      const newItem: GenderOption = {
        id: docRef.id,
        clubId: authStore.clubId,
        name: data.name,
        order: data.order ?? genderOptions.value.length,
        isActive: true,
        createdAt: new Date()
      }
      genderOptions.value.push(newItem)
      return newItem
    } catch (e) {
      logger.error('Error creating gender option:', e)
      return null
    }
  }

  async function updateGenderOption(id: string, data: Partial<GenderOption>) {
    try {
      await updateDoc(doc(db, 'genderOptions', id), { ...data, updatedAt: serverTimestamp() })
      const idx = genderOptions.value.findIndex(g => g.id === id)
      if (idx !== -1) genderOptions.value[idx] = { ...genderOptions.value[idx], ...data }
      return true
    } catch (e) {
      logger.error('Error updating gender option:', e)
      return false
    }
  }

  async function deleteGenderOption(id: string) {
    try {
      await deleteDoc(doc(db, 'genderOptions', id))
      genderOptions.value = genderOptions.value.filter(g => g.id !== id)
      return true
    } catch (e) {
      logger.error('Error deleting gender option:', e)
      return false
    }
  }

  // === SUPPLIERS ===

  async function fetchSuppliers() {
    const authStore = useAuthStore()
    if (!authStore.clubId) return

    try {
      const q = query(
        collection(db, 'suppliers'),
        where('clubId', '==', authStore.clubId)
      )
      const snapshot = await getDocs(q)
      suppliers.value = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        updatedAt: d.data().updatedAt?.toDate() || new Date()
      })) as Supplier[]
    } catch (e) {
      logger.error('Error fetching suppliers:', e)
    }
  }

  async function createSupplier(data: Omit<Supplier, 'id' | 'clubId' | 'createdAt' | 'updatedAt'>) {
    const authStore = useAuthStore()
    if (!authStore.clubId) return null

    try {
      const docRef = await addDoc(collection(db, 'suppliers'), {
        ...data,
        clubId: authStore.clubId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      const newItem: Supplier = {
        ...data,
        id: docRef.id,
        clubId: authStore.clubId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      suppliers.value.push(newItem)
      return newItem
    } catch (e) {
      logger.error('Error creating supplier:', e)
      return null
    }
  }

  async function updateSupplier(id: string, data: Partial<Supplier>) {
    try {
      await updateDoc(doc(db, 'suppliers', id), { ...data, updatedAt: serverTimestamp() })
      const idx = suppliers.value.findIndex(s => s.id === id)
      if (idx !== -1) suppliers.value[idx] = { ...suppliers.value[idx], ...data }
      return true
    } catch (e) {
      logger.error('Error updating supplier:', e)
      return false
    }
  }

  async function deleteSupplier(id: string) {
    try {
      await deleteDoc(doc(db, 'suppliers', id))
      suppliers.value = suppliers.value.filter(s => s.id !== id)
      return true
    } catch (e) {
      logger.error('Error deleting supplier:', e)
      return false
    }
  }

  function getSupplierById(id: string) {
    return suppliers.value.find(s => s.id === id)
  }

  // === SPONSORS ===

  async function fetchSponsors() {
    const authStore = useAuthStore()
    if (!authStore.clubId) return

    try {
      const q = query(
        collection(db, 'sponsors'),
        where('clubId', '==', authStore.clubId)
      )
      const snapshot = await getDocs(q)
      sponsors.value = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        updatedAt: d.data().updatedAt?.toDate() || new Date(),
        contractStart: d.data().contractStart?.toDate() || null,
        contractEnd: d.data().contractEnd?.toDate() || null
      })) as Sponsor[]
    } catch (e) {
      logger.error('Error fetching sponsors:', e)
    }
  }

  async function createSponsor(data: Omit<Sponsor, 'id' | 'clubId' | 'createdAt' | 'updatedAt'>) {
    const authStore = useAuthStore()
    if (!authStore.clubId) return null

    try {
      const docRef = await addDoc(collection(db, 'sponsors'), {
        ...data,
        clubId: authStore.clubId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      const newItem: Sponsor = {
        ...data,
        id: docRef.id,
        clubId: authStore.clubId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      sponsors.value.push(newItem)
      return newItem
    } catch (e) {
      logger.error('Error creating sponsor:', e)
      return null
    }
  }

  async function updateSponsor(id: string, data: Partial<Sponsor>) {
    try {
      await updateDoc(doc(db, 'sponsors', id), { ...data, updatedAt: serverTimestamp() })
      const idx = sponsors.value.findIndex(s => s.id === id)
      if (idx !== -1) sponsors.value[idx] = { ...sponsors.value[idx], ...data }
      return true
    } catch (e) {
      logger.error('Error updating sponsor:', e)
      return false
    }
  }

  async function deleteSponsor(id: string) {
    try {
      await deleteDoc(doc(db, 'sponsors', id))
      sponsors.value = sponsors.value.filter(s => s.id !== id)
      return true
    } catch (e) {
      logger.error('Error deleting sponsor:', e)
      return false
    }
  }

  function getSponsorById(id: string) {
    return sponsors.value.find(s => s.id === id)
  }

  // === FETCH ALL ===

  async function fetchAll() {
    loading.value = true
    try {
      await Promise.all([
        fetchAgeCategories(),
        fetchGenderOptions(),
        fetchSuppliers(),
        fetchSponsors()
      ])
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    ageCategories,
    genderOptions,
    suppliers,
    sponsors,
    loading,
    error,

    // Getters
    activeAgeCategories,
    activeGenderOptions,
    activeSuppliers,
    activeSponsors,

    // Age Categories
    fetchAgeCategories,
    createAgeCategory,
    updateAgeCategory,
    deleteAgeCategory,

    // Gender Options
    fetchGenderOptions,
    createGenderOption,
    updateGenderOption,
    deleteGenderOption,

    // Suppliers
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,

    // Sponsors
    fetchSponsors,
    createSponsor,
    updateSponsor,
    deleteSponsor,
    getSponsorById,

    // Utility
    fetchAll
  }
})
