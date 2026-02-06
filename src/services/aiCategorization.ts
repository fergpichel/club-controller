/**
 * AI Service for financial intelligence
 *
 * Uses Google Gemini (via @google/generative-ai) for:
 *
 * 1. Batch categorization — Excel import (multiple concepts at once)
 * 2. Bulk categorization  — existing uncategorized transactions
 * 3. Single categorization — real-time suggestion in the transaction form
 * 4. Budget suggestions — propose allocations based on historical data
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from 'src/boot/firebase'
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

// ─── Singleton model ─────────────────────────────────────────────────
let _model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null

function getModel() {
  if (_model) return _model

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY no está configurada. Añádela a tu archivo .env')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  _model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.1, // Very low for deterministic classification
      maxOutputTokens: 4096,
      responseMimeType: 'application/json'
    }
  })
  return _model
}

/** Check if the API key is configured */
export function isAIAvailable(): boolean {
  return !!import.meta.env.VITE_GEMINI_API_KEY
}

// ─── Prompt builders ─────────────────────────────────────────────────

function buildCategoryContext(categories: CategoryInfo[]): string {
  const grouped: Record<string, CategoryInfo[]> = { income: [], expense: [] }
  for (const cat of categories) {
    grouped[cat.type].push(cat)
  }

  let ctx = ''
  for (const type of ['expense', 'income'] as const) {
    ctx += `\n--- ${type === 'expense' ? 'GASTOS' : 'INGRESOS'} ---\n`
    for (const cat of grouped[type]) {
      const parent = cat.parentName ? ` (subcategoría de "${cat.parentName}")` : ''
      ctx += `  ID: "${cat.id}" → ${cat.name}${parent}\n`
    }
  }
  return ctx
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

function buildCorrectionsContext(corrections: AICorrection[]): string {
  if (corrections.length === 0) return ''

  let ctx = '\n--- CORRECCIONES PREVIAS DEL USUARIO (usa como referencia) ---\n'
  ctx += 'Estas son categorías que el usuario corrigió manualmente. Prioriza estas asociaciones:\n'
  for (const c of corrections) {
    ctx += `  "${c.concept}" → "${c.categoryName}" (${c.type === 'income' ? 'INGRESO' : 'GASTO'})\n`
  }
  return ctx
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

  const model = getModel()
  const categoryContext = buildCategoryContext(categories)
  const correctionsContext = corrections ? buildCorrectionsContext(corrections) : ''

  // Process in chunks of 30 to avoid token limits
  const CHUNK_SIZE = 30
  const allSuggestions: CategorizationSuggestion[] = []

  for (let i = 0; i < concepts.length; i += CHUNK_SIZE) {
    const chunk = concepts.slice(i, i + CHUNK_SIZE)

    const conceptList = chunk
      .map((c, idx) => `  ${idx}. [${c.type === 'income' ? 'INGRESO' : 'GASTO'}] "${c.concept}"`)
      .join('\n')

    const prompt = `Eres un asistente contable de un club deportivo español. Tu tarea es clasificar conceptos de transacciones financieras en las categorías disponibles.

CATEGORÍAS DISPONIBLES:
${categoryContext}
${correctionsContext}

CONCEPTOS A CLASIFICAR:
${conceptList}

INSTRUCCIONES:
- Para cada concepto, elige la categoría que mejor encaje.
- El tipo (INGRESO/GASTO) del concepto debe coincidir con el tipo de la categoría.
- Si un concepto encaja en una subcategoría, usa la subcategoría (más específica).
- Si no hay ninguna categoría adecuada, pon categoryId como null.
- La confianza (confidence) debe ser 0.0 a 1.0: alta (>0.8) si es claro, media (0.5-0.8) si es razonable, baja (<0.5) si es incierto.

Responde SOLO con un JSON array. Cada elemento:
{ "index": <número>, "categoryId": "<id o null>", "categoryName": "<nombre>", "confidence": <0.0-1.0> }
`

    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const parsed = JSON.parse(text) as Array<{
        index: number
        categoryId: string | null
        categoryName: string | null
        confidence: number
      }>

      // Map results back to suggestions
      for (const item of parsed) {
        const concept = chunk[item.index]
        if (concept) {
          allSuggestions.push({
            concept: concept.concept,
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            confidence: item.confidence
          })
        }
      }

      // Fill any missing entries
      for (let j = 0; j < chunk.length; j++) {
        if (!parsed.find(p => p.index === j)) {
          allSuggestions.push({
            concept: chunk[j].concept,
            categoryId: null,
            categoryName: null,
            confidence: 0
          })
        }
      }
    } catch (err) {
      logger.error('[AI] Batch categorization error for chunk:', err)
      // Fill this chunk with empty suggestions
      for (const c of chunk) {
        allSuggestions.push({
          concept: c.concept,
          categoryId: null,
          categoryName: null,
          confidence: 0
        })
      }
    }
  }

  return allSuggestions
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

  const model = getModel()
  const relevantCategories = categories.filter(c => c.type === type)
  const categoryContext = buildCategoryContext(relevantCategories)
  const correctionsContext = corrections ? buildCorrectionsContext(corrections.filter(c => c.type === type)) : ''

  const prompt = `Eres un asistente contable de un club deportivo español. Clasifica esta transacción en la categoría más adecuada.

CATEGORÍAS DE ${type === 'income' ? 'INGRESOS' : 'GASTOS'}:
${categoryContext}
${correctionsContext}

TRANSACCIÓN: "${description}"

INSTRUCCIONES:
- Elige la categoría que mejor encaje. Prefiere subcategorías si son más específicas.
- Si ninguna categoría encaja bien, pon categoryId como null.
- Confidence: 0.0-1.0 (alta >0.8, media 0.5-0.8, baja <0.5).

Responde SOLO con un JSON:
{ "categoryId": "<id o null>", "categoryName": "<nombre>", "confidence": <0.0-1.0> }
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = JSON.parse(text) as {
      categoryId: string | null
      categoryName: string | null
      confidence: number
    }

    return {
      concept: description,
      ...parsed
    }
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
  const model = getModel()

  // Build historical context
  let histCtx = ''
  const incomeHist = historicalData.filter(h => h.type === 'income')
  const expenseHist = historicalData.filter(h => h.type === 'expense')

  if (incomeHist.length > 0) {
    histCtx += '\n--- INGRESOS REALES (temporada anterior) ---\n'
    for (const h of incomeHist) {
      histCtx += `  "${h.categoryName}" (ID: ${h.categoryId}): ${h.totalAmount.toFixed(2)}€ (${h.transactionCount} movimientos)\n`
    }
    histCtx += `  TOTAL INGRESOS: ${incomeHist.reduce((s, h) => s + h.totalAmount, 0).toFixed(2)}€\n`
  }

  if (expenseHist.length > 0) {
    histCtx += '\n--- GASTOS REALES (temporada anterior) ---\n'
    for (const h of expenseHist) {
      histCtx += `  "${h.categoryName}" (ID: ${h.categoryId}): ${h.totalAmount.toFixed(2)}€ (${h.transactionCount} movimientos)\n`
    }
    histCtx += `  TOTAL GASTOS: ${expenseHist.reduce((s, h) => s + h.totalAmount, 0).toFixed(2)}€\n`
  }

  // Build previous budget context if available
  let budgetCtx = ''
  if (previousBudget && previousBudget.length > 0) {
    budgetCtx = '\n--- PRESUPUESTO DE LA TEMPORADA ANTERIOR ---\n'
    for (const b of previousBudget) {
      const cat = categories.find(c => c.id === b.categoryId)
      budgetCtx += `  "${cat?.name || b.categoryId}" (${b.type}): ${b.amount.toFixed(2)}€ presupuestado\n`
    }
  }

  // Build available categories context
  const categoryContext = buildCategoryContext(
    categories.filter(c => !c.parentName) // Only parent categories for budget
  )

  const prompt = `Eres un asesor financiero experto en clubes deportivos españoles. Tu tarea es proponer un presupuesto para la temporada ${targetSeason} basándote en los datos reales de la temporada ${previousSeason}.

DATOS HISTÓRICOS DE LA TEMPORADA ${previousSeason}:
${histCtx}
${budgetCtx}

CATEGORÍAS DISPONIBLES PARA EL PRESUPUESTO:
${categoryContext}

INSTRUCCIONES:
1. Para CADA categoría padre (no subcategorías) que tenga datos históricos o sea relevante, sugiere un importe presupuestado para ${targetSeason}.
2. Ten en cuenta la inflación en España (~3%), subidas salariales, y tendencias del sector deportivo.
3. Si una categoría gastó mucho más o menos que lo presupuestado, ajusta la sugerencia.
4. Si hay categorías activas sin datos históricos, puedes sugerirlas con importe 0 o una estimación conservadora.
5. Sugiere un objetivo de superávit razonable.
6. Proporciona un razonamiento breve pero útil para cada partida.
7. Las categorías que son de tipo "income" deben tener sugerencias de ingreso, y las de "expense" de gasto. No mezcles.

Responde SOLO con un JSON:
{
  "suggestions": [
    {
      "categoryId": "<id>",
      "categoryName": "<nombre>",
      "type": "income|expense",
      "suggestedAmount": <número>,
      "previousAmount": <número real de la temporada anterior, 0 si no hay>,
      "changePercent": <% de cambio respecto al anterior>,
      "reasoning": "<explicación breve en español>"
    }
  ],
  "targetSurplus": <objetivo de superávit sugerido>,
  "generalNotes": "<notas generales sobre el presupuesto en español>"
}
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = JSON.parse(text) as BudgetSuggestionResult

    return parsed
  } catch (err) {
    logger.error('[AI] Budget suggestion error:', err)
    throw new Error('Error al generar sugerencias de presupuesto')
  }
}
