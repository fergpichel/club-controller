/**
 * AI Service for financial intelligence
 *
 * Calls Firebase Cloud Functions that securely interact with Google Gemini.
 * API keys are stored server-side via Firebase Secrets Manager — never exposed
 * to the client.
 *
 * 1. Batch categorization — Excel import (multiple concepts at once)
 * 2. Bulk categorization  — existing uncategorized transactions
 * 3. Single categorization — real-time suggestion in the transaction form
 * 4. Budget suggestions — propose allocations based on historical data
 */

import { httpsCallable } from 'firebase/functions'
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db, functions } from 'src/boot/firebase'
import { useAuthStore } from 'src/stores/auth'
import { logger } from 'src/utils/logger'

// ─── Types ───────────────────────────────────────────────────────────
export interface CategoryInfo {
  id: string
  name: string
  type: 'income' | 'expense'
  parentName?: string
}

export interface CategorizationSuggestion {
  /** The original concept/description text */
  concept: string
  /** Suggested category ID (null if no match found) */
  categoryId: string | null
  /** Suggested category name for display */
  categoryName: string | null
  /** Confidence 0–1 */
  confidence: number
}

// ─── AI availability ─────────────────────────────────────────────────

/**
 * AI is always available when Cloud Functions are deployed.
 * Kept for backwards compatibility with callers that check before using AI.
 */
export function isAIAvailable(): boolean {
  return true
}

// ─── Corrections / feedback ─────────────────────────────────────────

export interface AICorrection {
  concept: string
  categoryId: string
  categoryName: string
  type: 'income' | 'expense'
}

/**
 * Save user corrections to Firestore so they can be used as
 * few-shot examples in future AI calls.
 */
export async function saveCorrections(corrections: AICorrection[]): Promise<void> {
  try {
    const authStore = useAuthStore()
    const clubId = authStore.user?.clubId
    if (!clubId || corrections.length === 0) return

    const colRef = collection(db, 'clubs', clubId, 'ai_corrections')

    for (const c of corrections) {
      await addDoc(colRef, {
        concept: c.concept,
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        type: c.type,
        createdAt: serverTimestamp()
      })
    }

    // Also update localStorage cache
    const cacheKey = `ai_corrections_${clubId}`
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]') as AICorrection[]
    cached.push(...corrections)
    // Keep only the latest 100
    const trimmed = cached.slice(-100)
    localStorage.setItem(cacheKey, JSON.stringify(trimmed))

    logger.debug(`[AI] Saved ${corrections.length} corrections for club ${clubId}`)
  } catch (err) {
    logger.error('[AI] Error saving corrections:', err)
  }
}

/**
 * Load recent corrections from Firestore (or localStorage cache).
 * These are included as examples in AI prompts for better accuracy.
 */
export async function loadCorrections(): Promise<AICorrection[]> {
  try {
    const authStore = useAuthStore()
    const clubId = authStore.user?.clubId
    if (!clubId) return []

    // Try cache first
    const cacheKey = `ai_corrections_${clubId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached) as AICorrection[]
      if (parsed.length > 0) return parsed.slice(-50) // Return up to 50 recent corrections
    }

    // Fetch from Firestore
    const colRef = collection(db, 'clubs', clubId, 'ai_corrections')
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50))
    const snap = await getDocs(q)

    const corrections: AICorrection[] = snap.docs.map(d => ({
      concept: d.data().concept,
      categoryId: d.data().categoryId,
      categoryName: d.data().categoryName,
      type: d.data().type
    }))

    // Update cache
    localStorage.setItem(cacheKey, JSON.stringify(corrections))

    return corrections
  } catch (err) {
    logger.error('[AI] Error loading corrections:', err)
    return []
  }
}

// ─── Cloud Function helpers ─────────────────────────────────────────

function getClubId(): string | null {
  const authStore = useAuthStore()
  return authStore.user?.clubId || null
}

// ─── Batch categorization (for import) ──────────────────────────────

/**
 * Suggest categories for multiple concepts in a single API call.
 * Used during Excel import to categorize all concept groups at once.
 *
 * @param concepts Array of { concept, type } to categorize
 * @param categories All available categories in the club
 * @param corrections Optional — past user corrections for context
 * @returns Array of suggestions in the same order as the input
 */
export async function suggestCategoriesBatch(
  concepts: { concept: string; type: 'income' | 'expense' }[],
  categories: CategoryInfo[],
  corrections?: AICorrection[]
): Promise<CategorizationSuggestion[]> {
  if (concepts.length === 0) return []

  const clubId = getClubId()
  if (!clubId) {
    logger.error('[AI] No club ID found')
    return concepts.map(c => ({
      concept: c.concept,
      categoryId: null,
      categoryName: null,
      confidence: 0
    }))
  }

  try {
    const fn = httpsCallable<
      { concepts: typeof concepts; categories: CategoryInfo[]; corrections?: AICorrection[]; clubId: string },
      { suggestions: CategorizationSuggestion[] }
    >(functions, 'suggestCategoriesBatch')

    const result = await fn({ concepts, categories, corrections, clubId })
    return result.data.suggestions
  } catch (err) {
    logger.error('[AI] Batch categorization error:', err)
    return concepts.map(c => ({
      concept: c.concept,
      categoryId: null,
      categoryName: null,
      confidence: 0
    }))
  }
}

// ─── Single categorization (for form) ──────────────────────────────

/**
 * Suggest a category for a single transaction description.
 * Used in real-time in the transaction form (debounced).
 */
export async function suggestCategory(
  description: string,
  type: 'income' | 'expense',
  categories: CategoryInfo[],
  corrections?: AICorrection[]
): Promise<CategorizationSuggestion | null> {
  if (!description || description.trim().length < 3) return null

  const clubId = getClubId()
  if (!clubId) {
    logger.error('[AI] No club ID found')
    return null
  }

  try {
    const fn = httpsCallable<
      { description: string; type: string; categories: CategoryInfo[]; corrections?: AICorrection[]; clubId: string },
      CategorizationSuggestion
    >(functions, 'suggestCategory')

    const result = await fn({ description, type, categories, corrections, clubId })
    return result.data
  } catch (err) {
    logger.error('[AI] Single categorization error:', err)
    return null
  }
}

// ─── Budget suggestion ──────────────────────────────────────────────

export interface HistoricalCategorySpend {
  categoryId: string
  categoryName: string
  type: 'income' | 'expense'
  totalAmount: number
  transactionCount: number
}

export interface BudgetSuggestion {
  categoryId: string
  categoryName: string
  type: 'income' | 'expense'
  suggestedAmount: number
  previousAmount: number
  changePercent: number
  reasoning: string
}

export interface BudgetSuggestionResult {
  suggestions: BudgetSuggestion[]
  targetSurplus: number
  generalNotes: string
}

/**
 * Suggest budget allocations for a new season based on historical data.
 *
 * @param historicalData Actual spending/income per category from the previous season
 * @param categories All active categories in the club
 * @param previousSeason Label of the previous season (e.g. "2024/25")
 * @param targetSeason Label of the target season (e.g. "2025/26")
 * @param previousBudget Optional — the previous season's budget allocations for comparison
 */
export async function suggestBudgetAllocations(
  historicalData: HistoricalCategorySpend[],
  categories: CategoryInfo[],
  previousSeason: string,
  targetSeason: string,
  previousBudget?: { categoryId: string; amount: number; type: 'income' | 'expense' }[]
): Promise<BudgetSuggestionResult> {
  const clubId = getClubId()
  if (!clubId) {
    throw new Error('No club ID found')
  }

  const fn = httpsCallable<
    {
      historicalData: HistoricalCategorySpend[]
      categories: CategoryInfo[]
      previousSeason: string
      targetSeason: string
      previousBudget?: typeof previousBudget
      clubId: string
    },
    BudgetSuggestionResult
  >(functions, 'suggestBudgetAllocations')

  const result = await fn({
    historicalData,
    categories,
    previousSeason,
    targetSeason,
    previousBudget,
    clubId
  })

  return result.data
}
