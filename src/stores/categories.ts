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
import type { Category, CategoryType } from 'src/types'
import { UNCATEGORIZED_CATEGORY_ID } from 'src/types'
import { ALL_DEFAULT_CATEGORIES, type CategoryTemplate } from 'src/config/defaultCategories'
import { logger } from 'src/utils/logger'

// Special "uncategorized" categories — always present
const UNCATEGORIZED_EXPENSE: Category = {
  id: UNCATEGORIZED_CATEGORY_ID,
  name: 'Sin categorizar',
  type: 'expense',
  icon: 'help_outline',
  color: '#9E9E9E',
  isActive: true
}

const UNCATEGORIZED_INCOME: Category = {
  id: `${UNCATEGORIZED_CATEGORY_ID}_income`,
  name: 'Sin categorizar',
  type: 'income',
  icon: 'help_outline',
  color: '#9E9E9E',
  isActive: true
}

export const useCategoriesStore = defineStore('categories', () => {
  // State
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let _fetchPromise: Promise<void> | null = null // concurrency guard

  // Getters - Basic
  const incomeCategories = computed(() =>
    categories.value.filter(c => c.type === 'income' && c.isActive)
  )

  const expenseCategories = computed(() =>
    categories.value.filter(c => c.type === 'expense' && c.isActive)
  )

  const allActiveCategories = computed(() =>
    categories.value.filter(c => c.isActive)
  )

  // Getters - Hierarchy
  // Categorías padre (sin parentId)
  const parentCategories = computed(() =>
    categories.value.filter(c => !c.parentId && c.isActive)
  )

  const incomeParentCategories = computed(() =>
    categories.value.filter(c => c.type === 'income' && !c.parentId && c.isActive)
  )

  const expenseParentCategories = computed(() =>
    categories.value.filter(c => c.type === 'expense' && !c.parentId && c.isActive)
  )

  // Subcategorías (con parentId)
  const subcategories = computed(() =>
    categories.value.filter(c => c.parentId && c.isActive)
  )

  // Actions
  async function fetchCategories() {
    // Prevent concurrent calls — if one fetch is already in-flight, reuse it.
    // This avoids the race where two callers both see 0 categories and
    // both trigger seedDefaultCategories, creating duplicates in Firestore.
    if (_fetchPromise) return _fetchPromise

    _fetchPromise = _doFetchCategories()
    try {
      await _fetchPromise
    } finally {
      _fetchPromise = null
    }
  }

  async function _doFetchCategories() {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return

      const q = query(
        collection(db, 'categories'),
        where('clubId', '==', authStore.clubId)
      )

      const snapshot = await getDocs(q)
      const raw = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Category[]

      // Deduplicate by name + type + parentId (guard against past double-seeding)
      const seen = new Set<string>()
      categories.value = raw.filter(c => {
        const key = `${c.name}|${c.type}|${c.parentId || ''}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      // If no categories exist, create defaults
      if (categories.value.length === 0) {
        await initializeDefaultCategories()
      }

      // Ensure uncategorized categories always present
      ensureUncategorized()
    } catch (e) {
      logger.error('Error fetching categories:', e)
      error.value = 'Error al cargar categorías'
    } finally {
      loading.value = false
    }
  }

  function ensureUncategorized() {
    if (!categories.value.find(c => c.id === UNCATEGORIZED_EXPENSE.id)) {
      categories.value.push({ ...UNCATEGORIZED_EXPENSE })
    }
    if (!categories.value.find(c => c.id === UNCATEGORIZED_INCOME.id)) {
      categories.value.push({ ...UNCATEGORIZED_INCOME })
    }
  }

  /**
   * Create the full hierarchy of default categories (parents + subcategories)
   * from the template defined in src/config/defaultCategories.ts.
   *
   * @param template - Category templates to seed. Defaults to ALL_DEFAULT_CATEGORIES.
   * @returns The number of categories created.
   */
  async function seedDefaultCategories(template: CategoryTemplate[] = ALL_DEFAULT_CATEGORIES): Promise<number> {
    const authStore = useAuthStore()
    if (!authStore.clubId) return 0

    let created = 0

    for (const tpl of template) {
      try {
        // Create parent category
        const parentData: Record<string, unknown> = {
          name: tpl.name,
          type: tpl.type,
          icon: tpl.icon,
          color: tpl.color,
          isActive: true,
          clubId: authStore.clubId,
          createdAt: serverTimestamp()
        }
        if (tpl.isSensitive) parentData.isSensitive = true

        const parentRef = await addDoc(collection(db, 'categories'), parentData)
        const parentCategory: Category = {
          id: parentRef.id,
          name: tpl.name,
          type: tpl.type,
          icon: tpl.icon,
          color: tpl.color,
          isActive: true,
          ...(tpl.isSensitive ? { isSensitive: true } : {})
        }
        categories.value.push(parentCategory)
        created++

        // Create subcategories
        if (tpl.children?.length) {
          for (const child of tpl.children) {
            const childData: Record<string, unknown> = {
              name: child.name,
              type: tpl.type,
              icon: child.icon,
              color: child.color || tpl.color,
              parentId: parentRef.id,
              isActive: true,
              clubId: authStore.clubId,
              createdAt: serverTimestamp()
            }
            if (child.isSensitive) childData.isSensitive = true

            const childRef = await addDoc(collection(db, 'categories'), childData)
            categories.value.push({
              id: childRef.id,
              name: child.name,
              type: tpl.type,
              icon: child.icon,
              color: child.color || tpl.color,
              parentId: parentRef.id,
              isActive: true,
              ...(child.isSensitive ? { isSensitive: true } : {})
            })
            created++
          }
        }
      } catch (e) {
        logger.error(`Error seeding category "${tpl.name}":`, e)
      }
    }

    return created
  }

  /** Alias kept for backward compat — called on first fetch when no categories exist */
  async function initializeDefaultCategories() {
    await seedDefaultCategories()
  }

  async function createCategory(data: Omit<Category, 'id'>) {
    loading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return null
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para crear categorías'
        return null
      }

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
      logger.error('Error creating category:', e)
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
      const authStore = useAuthStore()
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para editar categorías'
        return false
      }

      // Strip undefined values — Firestore rejects them
      const cleanData: Record<string, unknown> = { updatedAt: serverTimestamp() }
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) cleanData[key] = value
      }

      await updateDoc(doc(db, 'categories', id), cleanData)

      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = { ...categories.value[index], ...data }
      }

      return true
    } catch (e) {
      logger.error('Error updating category:', e)
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
      const authStore = useAuthStore()
      if (!authStore.canManageSettings) {
        error.value = 'Sin permisos para eliminar categorías'
        return false
      }

      await deleteDoc(doc(db, 'categories', id))
      categories.value = categories.value.filter(c => c.id !== id)
      return true
    } catch (e) {
      logger.error('Error deleting category:', e)
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

  // Hierarchy helpers
  function getSubcategories(parentId: string) {
    return categories.value.filter(c => c.parentId === parentId && c.isActive)
  }

  function hasSubcategories(categoryId: string) {
    return categories.value.some(c => c.parentId === categoryId && c.isActive)
  }

  function getParentCategory(categoryId: string) {
    const category = getCategoryById(categoryId)
    if (!category?.parentId) return null
    return getCategoryById(category.parentId)
  }

  function isSubcategory(categoryId: string) {
    const category = getCategoryById(categoryId)
    return !!category?.parentId
  }

  // Obtener categoría con información del padre
  function getCategoryWithParent(categoryId: string) {
    const category = getCategoryById(categoryId)
    if (!category) return null
    
    const parent = category.parentId ? getCategoryById(category.parentId) : null
    
    return {
      ...category,
      parent,
      fullName: parent ? `${parent.name} > ${category.name}` : category.name
    }
  }

  // Obtener todas las categorías padre con sus subcategorías agrupadas
  function getCategoriesTree(type?: CategoryType) {
    const parents = type 
      ? parentCategories.value.filter(c => c.type === type)
      : parentCategories.value

    return parents.map(parent => ({
      ...parent,
      subcategories: getSubcategories(parent.id)
    }))
  }

  // Para estadísticas: obtener el total de una categoría padre (suma de sus subcategorías)
  function getAllCategoryIds(categoryId: string): string[] {
    const ids = [categoryId]
    const subs = getSubcategories(categoryId)
    subs.forEach(sub => ids.push(sub.id))
    return ids
  }

  /** IDs of all categories that should be treated as "uncategorized" */
  const uncategorizedIds = computed(() => {
    const ids = new Set<string>([UNCATEGORIZED_EXPENSE.id, UNCATEGORIZED_INCOME.id])
    // Also include any real Firestore category named "Sin categorizar"
    for (const c of categories.value) {
      if (c.name.toLowerCase().trim() === 'sin categorizar') {
        ids.add(c.id)
      }
    }
    return ids
  })

  function isUncategorized(categoryId: string): boolean {
    return uncategorizedIds.value.has(categoryId)
  }

  function getUncategorizedId(type: 'income' | 'expense'): string {
    return type === 'income' ? UNCATEGORIZED_INCOME.id : UNCATEGORIZED_EXPENSE.id
  }

  return {
    // State
    categories,
    loading,
    error,

    // Getters - Basic
    incomeCategories,
    expenseCategories,
    allActiveCategories,

    // Getters - Hierarchy
    parentCategories,
    incomeParentCategories,
    expenseParentCategories,
    subcategories,

    // Actions
    fetchCategories,
    seedDefaultCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesByType,

    // Hierarchy helpers
    getSubcategories,
    hasSubcategories,
    getParentCategory,
    isSubcategory,
    getCategoryWithParent,
    getCategoriesTree,
    getAllCategoryIds,

    // Uncategorized helpers
    uncategorizedIds,
    isUncategorized,
    getUncategorizedId
  }
})
