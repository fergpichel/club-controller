import { computed } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useCategoriesStore } from 'src/stores/categories'
import type { Transaction } from 'src/types'

/**
 * Composable to handle sensitive data visibility.
 *
 * Categories marked as `isSensitive` have their amounts hidden for
 * users without the `canViewSensitive` permission (editor, employee, viewer).
 *
 * - Amounts are replaced with `null` → the UI should show "***" or "Restringido"
 * - The transaction itself is still visible (description, date, etc.)
 * - Totals in stats exclude sensitive amounts for those users
 */
export function useSensitiveData() {
  const authStore = useAuthStore()
  const categoriesStore = useCategoriesStore()

  const canViewSensitive = computed(() => authStore.canViewSensitive)

  /**
   * Set of category IDs that are considered sensitive.
   * A category is sensitive if:
   *   1. It has `isSensitive: true` directly, OR
   *   2. Its parent category has `isSensitive: true` (inheritance)
   */
  const sensitiveCategoryIds = computed(() => {
    const ids = new Set<string>()
    for (const cat of categoriesStore.categories) {
      if (cat.isSensitive) {
        // The category itself is sensitive
        ids.add(cat.id)
        // All its subcategories inherit the flag
        const subs = categoriesStore.getSubcategories(cat.id)
        for (const sub of subs) {
          ids.add(sub.id)
        }
      } else if (cat.parentId) {
        // Check if the parent is sensitive (redundant with above but covers edge cases)
        const parent = categoriesStore.getCategoryById(cat.parentId)
        if (parent?.isSensitive) {
          ids.add(cat.id)
        }
      }
    }
    return ids
  })

  /** Check if a specific transaction belongs to a sensitive category */
  function isSensitiveTransaction(transaction: Transaction): boolean {
    if (!transaction.categoryId) return false
    return sensitiveCategoryIds.value.has(transaction.categoryId)
  }

  /**
   * Get the display amount for a transaction.
   * Returns the real amount if the user can view sensitive data,
   * or null if the transaction is in a sensitive category.
   */
  function getDisplayAmount(transaction: Transaction): number | null {
    if (canViewSensitive.value) return transaction.amount
    if (isSensitiveTransaction(transaction)) return null
    return transaction.amount
  }

  /**
   * Format currency for display, respecting sensitive data visibility.
   * Returns "***,** €" if the amount should be hidden.
   */
  function formatSensitiveAmount(transaction: Transaction, formatter?: (amount: number) => string): string {
    const amount = getDisplayAmount(transaction)
    if (amount === null) return '***,** €'
    if (formatter) return formatter(amount)
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  /**
   * Filter out sensitive amounts from a list of transactions for totals.
   * Returns only the amounts that the current user is allowed to see.
   */
  function getVisibleTotal(transactions: Transaction[]): number {
    if (canViewSensitive.value) {
      return transactions.reduce((sum, t) => sum + t.amount, 0)
    }
    return transactions
      .filter(t => !isSensitiveTransaction(t))
      .reduce((sum, t) => sum + t.amount, 0)
  }

  return {
    canViewSensitive,
    sensitiveCategoryIds,
    isSensitiveTransaction,
    getDisplayAmount,
    formatSensitiveAmount,
    getVisibleTotal
  }
}
