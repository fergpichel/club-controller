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
import { isMockEnabled } from 'src/mocks'
import { categoriesApi } from 'src/services/api'
import type { Category, CategoryType } from 'src/types'

// Default categories for new clubs
const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Material deportivo', type: 'expense', icon: 'sports_soccer', color: '#2196F3', isActive: true },
  { name: 'Equipamiento', type: 'expense', icon: 'checkroom', color: '#4CAF50', isActive: true },
  { name: 'Transporte', type: 'expense', icon: 'directions_bus', color: '#FF9800', isActive: true },
  { name: 'Instalaciones', type: 'expense', icon: 'stadium', color: '#9C27B0', isActive: true },
  { name: 'Alimentación', type: 'expense', icon: 'restaurant', color: '#F44336', isActive: true },
  { name: 'Seguros', type: 'expense', icon: 'security', color: '#607D8B', isActive: true },
  { name: 'Licencias y federación', type: 'expense', icon: 'card_membership', color: '#795548', isActive: true },
  { name: 'Personal técnico', type: 'expense', icon: 'person', color: '#3F51B5', isActive: true },
  { name: 'Marketing', type: 'expense', icon: 'campaign', color: '#E91E63', isActive: true },
  { name: 'Administración', type: 'expense', icon: 'business', color: '#00BCD4', isActive: true },
  { name: 'Otros gastos', type: 'expense', icon: 'more_horiz', color: '#9E9E9E', isActive: true }
]

const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Cuotas socios', type: 'income', icon: 'groups', color: '#4CAF50', isActive: true },
  { name: 'Inscripciones', type: 'income', icon: 'how_to_reg', color: '#2196F3', isActive: true },
  { name: 'Subvenciones', type: 'income', icon: 'account_balance', color: '#9C27B0', isActive: true },
  { name: 'Patrocinios', type: 'income', icon: 'handshake', color: '#FF9800', isActive: true },
  { name: 'Eventos', type: 'income', icon: 'event', color: '#E91E63', isActive: true },
  { name: 'Merchandising', type: 'income', icon: 'store', color: '#00BCD4', isActive: true },
  { name: 'Alquiler instalaciones', type: 'income', icon: 'home', color: '#795548', isActive: true },
  { name: 'Donaciones', type: 'income', icon: 'volunteer_activism', color: '#F44336', isActive: true },
  { name: 'Premios y trofeos', type: 'income', icon: 'emoji_events', color: '#FFC107', isActive: true },
  { name: 'Otros ingresos', type: 'income', icon: 'more_horiz', color: '#9E9E9E', isActive: true }
]

export const useCategoriesStore = defineStore('categories', () => {
  // State
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const incomeCategories = computed(() =>
    categories.value.filter(c => c.type === 'income' && c.isActive)
  )

  const expenseCategories = computed(() =>
    categories.value.filter(c => c.type === 'expense' && c.isActive)
  )

  const allActiveCategories = computed(() =>
    categories.value.filter(c => c.isActive)
  )

  // Actions
  async function fetchCategories() {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        categories.value = await categoriesApi.getAll()
        loading.value = false
        return
      }

      const authStore = useAuthStore()
      if (!authStore.clubId) return

      const q = query(
        collection(db, 'categories'),
        where('clubId', '==', authStore.clubId)
      )

      const snapshot = await getDocs(q)
      categories.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[]

      // If no categories exist, create defaults
      if (categories.value.length === 0) {
        await initializeDefaultCategories()
      }
    } catch (e) {
      console.error('Error fetching categories:', e)
      error.value = 'Error al cargar categorías'
    } finally {
      loading.value = false
    }
  }

  async function initializeDefaultCategories() {
    const authStore = useAuthStore()
    if (!authStore.clubId && !isMockEnabled()) return

    const allDefaults = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]

    for (const category of allDefaults) {
      try {
        if (isMockEnabled()) {
          const newCategory = await categoriesApi.create(category)
          categories.value.push(newCategory)
        } else {
          const docRef = await addDoc(collection(db, 'categories'), {
            ...category,
            clubId: authStore.clubId,
            createdAt: serverTimestamp()
          })

          categories.value.push({
            ...category,
            id: docRef.id
          })
        }
      } catch (e) {
        console.error('Error creating default category:', e)
      }
    }
  }

  async function createCategory(data: Omit<Category, 'id'>) {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        const newCategory = await categoriesApi.create(data)
        categories.value.push(newCategory)
        loading.value = false
        return newCategory
      }

      const authStore = useAuthStore()
      if (!authStore.clubId) return null

      const docRef = await addDoc(collection(db, 'categories'), {
        ...data,
        clubId: authStore.clubId,
        createdAt: serverTimestamp()
      })

      const newCategory: Category = {
        ...data,
        id: docRef.id
      }

      categories.value.push(newCategory)
      return newCategory
    } catch (e) {
      console.error('Error creating category:', e)
      error.value = 'Error al crear categoría'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateCategory(id: string, data: Partial<Category>) {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        await categoriesApi.update(id, data)
        const index = categories.value.findIndex(c => c.id === id)
        if (index !== -1) {
          categories.value[index] = { ...categories.value[index], ...data }
        }
        loading.value = false
        return true
      }

      await updateDoc(doc(db, 'categories', id), {
        ...data,
        updatedAt: serverTimestamp()
      })

      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = { ...categories.value[index], ...data }
      }

      return true
    } catch (e) {
      console.error('Error updating category:', e)
      error.value = 'Error al actualizar categoría'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteCategory(id: string) {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        await categoriesApi.delete(id)
        categories.value = categories.value.filter(c => c.id !== id)
        loading.value = false
        return true
      }

      await deleteDoc(doc(db, 'categories', id))
      categories.value = categories.value.filter(c => c.id !== id)
      return true
    } catch (e) {
      console.error('Error deleting category:', e)
      error.value = 'Error al eliminar categoría'
      return false
    } finally {
      loading.value = false
    }
  }

  function getCategoryById(id: string) {
    return categories.value.find(c => c.id === id)
  }

  function getCategoriesByType(type: CategoryType) {
    return categories.value.filter(c => c.type === type && c.isActive)
  }

  return {
    // State
    categories,
    loading,
    error,

    // Getters
    incomeCategories,
    expenseCategories,
    allActiveCategories,

    // Actions
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesByType
  }
})
