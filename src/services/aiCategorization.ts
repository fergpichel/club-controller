/**
 * AI Categorization Service
 *
 * Uses Google Gemini (via @google/generative-ai) to automatically suggest
 * categories for transaction descriptions. Works in three modes:
 *
 * 1. Batch — for Excel import (multiple concepts at once)
 * 2. Bulk  — for existing uncategorized transactions
 * 3. Single — for real-time suggestion in the transaction form
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
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

// ─── Batch categorization (for import) ──────────────────────────────

/**
 * Suggest categories for multiple concepts in a single API call.
 * Used during Excel import to categorize all concept groups at once.
 *
 * @param concepts Array of { concept, type } to categorize
 * @param categories All available categories in the club
 * @returns Array of suggestions in the same order as the input
 */
export async function suggestCategoriesBatch(
  concepts: { concept: string; type: 'income' | 'expense' }[],
  categories: CategoryInfo[]
): Promise<CategorizationSuggestion[]> {
  if (concepts.length === 0) return []

  const model = getModel()
  const categoryContext = buildCategoryContext(categories)

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
  categories: CategoryInfo[]
): Promise<CategorizationSuggestion | null> {
  if (!description || description.trim().length < 3) return null

  const model = getModel()
  const relevantCategories = categories.filter(c => c.type === type)
  const categoryContext = buildCategoryContext(relevantCategories)

  const prompt = `Eres un asistente contable de un club deportivo español. Clasifica esta transacción en la categoría más adecuada.

CATEGORÍAS DE ${type === 'income' ? 'INGRESOS' : 'GASTOS'}:
${categoryContext}

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
