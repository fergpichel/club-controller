/**
 * Firebase Cloud Functions for AI-powered financial intelligence.
 *
 * All Gemini API calls are made server-side. The API key is stored
 * securely in Firebase Secrets Manager and NEVER exposed to the client.
 *
 * Each function:
 *  - Validates authentication (request.auth)
 *  - Logs usage to Firestore (ai_usage_logs) for superadmin auditing
 *  - Returns structured results to the client
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─── Firebase Admin init ──────────────────────────────────────────────
initializeApp()
const db = getFirestore()

// ─── Secret (stored via: firebase functions:secrets:set GEMINI_API_KEY) ─
const geminiApiKey = defineSecret('GEMINI_API_KEY')

// ─── Shared types ─────────────────────────────────────────────────────
interface CategoryInfo {
  id: string
  name: string
  type: 'income' | 'expense'
  parentName?: string
}

interface AICorrection {
  concept: string
  categoryId: string
  categoryName: string
  type: 'income' | 'expense'
}

interface HistoricalCategorySpend {
  categoryId: string
  categoryName: string
  type: 'income' | 'expense'
  totalAmount: number
  transactionCount: number
}

// ─── Helpers ──────────────────────────────────────────────────────────

function getGeminiModel(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  })
}

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

function buildCorrectionsContext(corrections: AICorrection[]): string {
  if (corrections.length === 0) return ''

  let ctx = '\n--- CORRECCIONES PREVIAS DEL USUARIO (usa como referencia) ---\n'
  ctx += 'Estas son categorías que el usuario corrigió manualmente. Prioriza estas asociaciones:\n'
  for (const c of corrections) {
    ctx += `  "${c.concept}" → "${c.categoryName}" (${c.type === 'income' ? 'INGRESO' : 'GASTO'})\n`
  }
  return ctx
}

// ─── Usage logging (for superadmin backoffice) ────────────────────────

async function logAIUsage(params: {
  userId: string
  userEmail: string
  clubId: string
  functionName: string
  inputSize: number
  success: boolean
  error?: string
  durationMs: number
}): Promise<void> {
  try {
    await db.collection('ai_usage_logs').add({
      ...params,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    // Log errors should never bubble up to the caller
    console.error('[AI Usage Log] Error saving log:', err)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 1. BATCH CATEGORIZATION — used during Excel import
// ═══════════════════════════════════════════════════════════════════════

export const suggestCategoriesBatch = onCall(
  {
    secrets: [geminiApiKey],
    region: 'europe-west1',
    maxInstances: 10,
  },
  async (request) => {
    // ── Auth guard ──
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes estar autenticado.')
    }

    const { concepts, categories, corrections, clubId } = request.data as {
      concepts: { concept: string; type: 'income' | 'expense' }[]
      categories: CategoryInfo[]
      corrections?: AICorrection[]
      clubId: string
    }

    if (!concepts || !categories || !clubId) {
      throw new HttpsError('invalid-argument', 'Faltan datos requeridos (concepts, categories, clubId).')
    }

    const startTime = Date.now()
    const model = getGeminiModel(geminiApiKey.value())
    const categoryContext = buildCategoryContext(categories)
    const correctionsContext = corrections ? buildCorrectionsContext(corrections) : ''

    const CHUNK_SIZE = 30
    const allSuggestions: {
      concept: string
      categoryId: string | null
      categoryName: string | null
      confidence: number
    }[] = []

    let success = true

    try {
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

          for (const item of parsed) {
            const concept = chunk[item.index]
            if (concept) {
              allSuggestions.push({
                concept: concept.concept,
                categoryId: item.categoryId,
                categoryName: item.categoryName,
                confidence: item.confidence,
              })
            }
          }

          // Fill any missing entries
          for (let j = 0; j < chunk.length; j++) {
            if (!parsed.find((p) => p.index === j)) {
              allSuggestions.push({
                concept: chunk[j].concept,
                categoryId: null,
                categoryName: null,
                confidence: 0,
              })
            }
          }
        } catch (err) {
          console.error('[AI] Batch categorization error for chunk:', err)
          for (const c of chunk) {
            allSuggestions.push({
              concept: c.concept,
              categoryId: null,
              categoryName: null,
              confidence: 0,
            })
          }
        }
      }
    } catch (err) {
      success = false
      console.error('[AI] Batch categorization fatal error:', err)
      throw new HttpsError('internal', 'Error al categorizar en lote.')
    } finally {
      await logAIUsage({
        userId: request.auth.uid,
        userEmail: request.auth?.token?.email || '',
        clubId,
        functionName: 'suggestCategoriesBatch',
        inputSize: concepts.length,
        success,
        durationMs: Date.now() - startTime,
      })
    }

    return { suggestions: allSuggestions }
  }
)

// ═══════════════════════════════════════════════════════════════════════
// 2. SINGLE CATEGORIZATION — used in the transaction form
// ═══════════════════════════════════════════════════════════════════════

export const suggestCategory = onCall(
  {
    secrets: [geminiApiKey],
    region: 'europe-west1',
    maxInstances: 20,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes estar autenticado.')
    }

    const { description, type, categories, corrections, clubId } = request.data as {
      description: string
      type: 'income' | 'expense'
      categories: CategoryInfo[]
      corrections?: AICorrection[]
      clubId: string
    }

    if (!description || !type || !categories || !clubId) {
      throw new HttpsError('invalid-argument', 'Faltan datos requeridos.')
    }

    if (description.trim().length < 3) {
      throw new HttpsError('invalid-argument', 'La descripción es demasiado corta (mínimo 3 caracteres).')
    }

    const startTime = Date.now()
    const model = getGeminiModel(geminiApiKey.value())
    const relevantCategories = categories.filter((c) => c.type === type)
    const categoryContext = buildCategoryContext(relevantCategories)
    const correctionsContext = corrections
      ? buildCorrectionsContext(corrections.filter((c) => c.type === type))
      : ''

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

    let success = true
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
        ...parsed,
      }
    } catch (err) {
      success = false
      console.error('[AI] Single categorization error:', err)
      throw new HttpsError('internal', 'Error al categorizar la transacción.')
    } finally {
      await logAIUsage({
        userId: request.auth.uid,
        userEmail: request.auth?.token?.email || '',
        clubId,
        functionName: 'suggestCategory',
        inputSize: 1,
        success,
        durationMs: Date.now() - startTime,
      })
    }
  }
)

// ═══════════════════════════════════════════════════════════════════════
// 3. BUDGET SUGGESTIONS — used in the budget page
// ═══════════════════════════════════════════════════════════════════════

export const suggestBudgetAllocations = onCall(
  {
    secrets: [geminiApiKey],
    region: 'europe-west1',
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes estar autenticado.')
    }

    const {
      historicalData,
      categories,
      previousSeason,
      targetSeason,
      previousBudget,
      clubId,
    } = request.data as {
      historicalData: HistoricalCategorySpend[]
      categories: CategoryInfo[]
      previousSeason: string
      targetSeason: string
      previousBudget?: { categoryId: string; amount: number; type: 'income' | 'expense' }[]
      clubId: string
    }

    if (!historicalData || !categories || !previousSeason || !targetSeason || !clubId) {
      throw new HttpsError('invalid-argument', 'Faltan datos requeridos.')
    }

    const startTime = Date.now()
    const model = getGeminiModel(geminiApiKey.value())

    // Build historical context
    let histCtx = ''
    const incomeHist = historicalData.filter((h) => h.type === 'income')
    const expenseHist = historicalData.filter((h) => h.type === 'expense')

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

    let budgetCtx = ''
    if (previousBudget && previousBudget.length > 0) {
      budgetCtx = '\n--- PRESUPUESTO DE LA TEMPORADA ANTERIOR ---\n'
      for (const b of previousBudget) {
        const cat = categories.find((c) => c.id === b.categoryId)
        budgetCtx += `  "${cat?.name || b.categoryId}" (${b.type}): ${b.amount.toFixed(2)}€ presupuestado\n`
      }
    }

    const categoryContext = buildCategoryContext(
      categories.filter((c) => !c.parentName)
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

    let success = true
    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      return JSON.parse(text)
    } catch (err) {
      success = false
      console.error('[AI] Budget suggestion error:', err)
      throw new HttpsError('internal', 'Error al generar sugerencias de presupuesto.')
    } finally {
      await logAIUsage({
        userId: request.auth.uid,
        userEmail: request.auth?.token?.email || '',
        clubId,
        functionName: 'suggestBudgetAllocations',
        inputSize: historicalData.length,
        success,
        durationMs: Date.now() - startTime,
      })
    }
  }
)

// ═══════════════════════════════════════════════════════════════════════
// 4. BACKOFFICE STATS — superadmin dashboard
// ═══════════════════════════════════════════════════════════════════════

export const getBackofficeStats = onCall(
  {
    region: 'europe-west1',
    maxInstances: 3,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes estar autenticado.')
    }

    // Verify superadmin server-side (don't trust the client)
    const userSnap = await db.collection('users').doc(request.auth.uid).get()
    if (!userSnap.exists || !userSnap.data()?.isSuperAdmin) {
      throw new HttpsError('permission-denied', 'Acceso denegado. Se requiere rol de superadmin.')
    }

    // ── Check cache (5 min TTL) ──
    const cacheRef = db.doc('backoffice_cache/stats')
    const cacheSnap = await cacheRef.get()
    if (cacheSnap.exists) {
      const cacheData = cacheSnap.data()!
      const cachedAt = cacheData.cachedAt?.toMillis?.() || 0
      const age = Date.now() - cachedAt
      if (age < 5 * 60 * 1000) {
        return cacheData.stats
      }
    }

    // ── Aggregate data ──
    const [clubsSnap, usersSnap, aiTotalSnap] = await Promise.all([
      db.collection('clubs').get(),
      db.collection('users').select('clubId', 'email', 'displayName', 'role').get(),
      db.collection('ai_usage_logs').count().get(),
    ])

    // AI calls last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const aiLast30dSnap = await db.collection('ai_usage_logs')
      .where('createdAt', '>=', thirtyDaysAgo)
      .count()
      .get()

    // Recent AI usage (last 10)
    const recentAISnap = await db.collection('ai_usage_logs')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()

    // Group users by club
    const usersByClub: Record<string, number> = {}
    usersSnap.forEach(doc => {
      const cid = doc.data().clubId
      if (cid) usersByClub[cid] = (usersByClub[cid] || 0) + 1
    })

    // Build clubs list
    const clubs = clubsSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Sin nombre',
      userCount: usersByClub[doc.id] || 0,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }))

    // Build recent AI activity
    const recentAIUsage = recentAISnap.docs.map(doc => {
      const d = doc.data()
      return {
        functionName: d.functionName,
        userEmail: d.userEmail || '',
        clubId: d.clubId,
        success: d.success,
        durationMs: d.durationMs,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
      }
    })

    const stats = {
      totalClubs: clubsSnap.size,
      totalUsers: usersSnap.size,
      totalAICalls: aiTotalSnap.data().count,
      aiCallsLast30d: aiLast30dSnap.data().count,
      clubs,
      recentAIUsage,
    }

    // ── Cache the result ──
    await cacheRef.set({
      stats,
      cachedAt: FieldValue.serverTimestamp(),
    })

    return stats
  }
)
