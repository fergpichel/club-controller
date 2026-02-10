import { computed, ref, reactive } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useCategoriesStore } from 'src/stores/categories'
import type { Transaction } from 'src/types'

/**
 * Privacy mode key in localStorage.
 * When active, descriptions of sensitive-category transactions are hidden
 * behind a blur/mask. Users with `canViewSensitive` can toggle the mode
 * on/off and temporarily reveal individual descriptions (auto-hides after 5 s).
 */
const PRIVACY_MODE_KEY = 'privacyMode'

/**
 * Shared reactive state so every component using this composable
 * sees the same privacyMode toggle and the same reveal timers.
 * Default true = hide concepts for sensitive categories for everyone (including admins).
 * User can turn off in Settings to always show, or use the eye to reveal temporarily.
 */
const privacyModeEnabled = ref<boolean>(
  localStorage.getItem(PRIVACY_MODE_KEY) !== 'false'
)
const revealedIds = reactive(new Map<string, ReturnType<typeof setTimeout>>())

/**
 * Composable to handle sensitive data visibility.
 *
 * Categories marked as `isSensitive` have their amounts hidden for
 * users without the `canViewSensitive` permission (editor, employee, viewer).
 *
 * When **privacy mode** is active (only available for canViewSensitive users),
 * the transaction description is masked too, even though the user *can* see it.
 * A per-transaction eye-toggle reveals it for 5 seconds.
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

  // ─── Privacy mode (anti-curious) ───────────────────────────────────

  /** Toggle privacy mode and persist to localStorage */
  function setPrivacyMode(enabled: boolean) {
    privacyModeEnabled.value = enabled
    localStorage.setItem(PRIVACY_MODE_KEY, String(enabled))
    // When disabling, clear all pending reveals
    if (!enabled) {
      for (const [id, timer] of revealedIds) {
        clearTimeout(timer)
        revealedIds.delete(id)
      }
    }
  }

  /**
   * Whether a transaction's description (concept) should be masked right now.
   * True when:
   *   - the transaction belongs to a sensitive category, AND
   *   - either:
   *     a) the user CANNOT view sensitive data (editor/viewer) → always mask, no reveal, OR
   *     b) the user CAN view sensitive data AND privacy mode is ON AND not temporarily revealed
   */
  function isDescriptionMasked(transaction: Transaction): boolean {
    if (!isSensitiveTransaction(transaction)) return false
    // Users without permission: always hide description for sensitive categories
    if (!canViewSensitive.value) return true
    // Users with permission: hide only when privacy mode is on and not revealed
    if (!privacyModeEnabled.value) return false
    return !revealedIds.has(transaction.id)
  }

  /**
   * Temporarily reveal a masked description for `duration` ms (default 5 000).
   * After the timer expires the description auto-hides.
   */
  function revealDescription(transactionId: string, duration = 5000) {
    // Clear any existing timer for this id
    if (revealedIds.has(transactionId)) {
      clearTimeout(revealedIds.get(transactionId)!)
    }

    const timer = setTimeout(() => {
      revealedIds.delete(transactionId)
    }, duration)

    revealedIds.set(transactionId, timer)
  }

  /** Hide a previously revealed description immediately */
  function hideDescription(transactionId: string) {
    if (revealedIds.has(transactionId)) {
      clearTimeout(revealedIds.get(transactionId)!)
      revealedIds.delete(transactionId)
    }
  }

  /** Whether this transaction's description is currently revealed (temporary) */
  function isRevealed(transactionId: string): boolean {
    return revealedIds.has(transactionId)
  }

  return {
    canViewSensitive,
    sensitiveCategoryIds,
    isSensitiveTransaction,
    getDisplayAmount,
    formatSensitiveAmount,
    getVisibleTotal,
    // Privacy mode
    privacyModeEnabled,
    setPrivacyMode,
    isDescriptionMasked,
    revealDescription,
    hideDescription,
    isRevealed
  }
}
