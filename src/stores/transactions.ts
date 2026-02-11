import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getCountFromServer,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject, type UploadMetadata } from 'firebase/storage'
import { db, storage } from 'src/boot/firebase'
import { useAuthStore } from './auth'
import { useCategoriesStore } from './categories'
import type {
  Transaction,
  TransactionFilters,
  TransactionStatus,
  Attachment
} from 'src/types'
import { computeSeason, generateSearchKeywords, getSeasonDates } from 'src/types'
import { startOfMonth, endOfMonth } from 'date-fns'
import { logger } from 'src/utils/logger'

const PAGE_SIZE = 20

export const useTransactionsStore = defineStore('transactions', () => {
  // State
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastDoc = ref<QueryDocumentSnapshot<DocumentData> | null>(null)
  const hasMore = ref(true)
  const currentFilters = ref<TransactionFilters>({})

  /** Cache for fetchAllInDateRange; expires after TTL so other users' new transactions appear. */
  const RANGE_CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes
  const rangeCache = ref<{
    startTime: number
    endTime: number
    list: Transaction[]
    employeeId: string | null
    cachedAt: number
  } | null>(null)

  function invalidateRangeCache() {
    rangeCache.value = null
  }

  // Getters
  const incomeTransactions = computed(() =>
    transactions.value.filter(t => t.type === 'income')
  )

  const expenseTransactions = computed(() =>
    transactions.value.filter(t => t.type === 'expense')
  )

  const pendingTransactions = computed(() =>
    transactions.value.filter(t => t.status === 'pending')
  )

  const totalIncome = computed(() =>
    incomeTransactions.value.reduce((sum, t) => sum + t.amount, 0)
  )

  const totalExpenses = computed(() =>
    expenseTransactions.value.reduce((sum, t) => sum + t.amount, 0)
  )

  const balance = computed(() => totalIncome.value - totalExpenses.value)

  // Recent transactions (last 10)
  const recentTransactions = computed(() =>
    transactions.value.slice(0, 10)
  )

  // Uncategorized transactions
  const uncategorizedTransactions = computed(() => {
    const categoriesStore = useCategoriesStore()
    return transactions.value.filter(t =>
      !t.categoryId || categoriesStore.isUncategorized(t.categoryId)
    )
  })

  // Season-based filtering
  function getTransactionsBySeason(season: string) {
    return transactions.value.filter(t => {
      // If transaction has explicit season override, use it
      if (t.season) return t.season === season
      // Otherwise compute from date
      return computeSeason(new Date(t.date)) === season
    })
  }

  // Actions
  async function fetchTransactions(filters: TransactionFilters = {}, reset = true) {
    loading.value = true
    error.value = null

    if (reset) {
      transactions.value = []
      lastDoc.value = null
      hasMore.value = true
    }

    currentFilters.value = filters

    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return

      const isEmployeeQuery = authStore.isEmployee && !!authStore.user?.uid

      // Build constraints array first, then create single query.
      // For employees we skip orderBy('date') to avoid requiring a composite
      // index on (clubId, createdBy, date). Sorting is done client-side.
      const constraints = [
        where('clubId', '==', authStore.clubId),
        ...(!isEmployeeQuery ? [orderBy('date', 'desc')] : []),
        limit(PAGE_SIZE)
      ]

      // Employee: only see own transactions
      if (isEmployeeQuery) {
        constraints.push(where('createdBy', '==', authStore.user!.uid))
      }

      // Apply filters
      if (filters.type) {
        constraints.push(where('type', '==', filters.type))
      }

      if (filters.status) {
        constraints.push(where('status', '==', filters.status))
      }

      if (filters.categoryId) {
        constraints.push(where('categoryId', '==', filters.categoryId))
      }

      if (filters.teamId) {
        constraints.push(where('teamId', '==', filters.teamId))
      }

      if (filters.projectId) {
        constraints.push(where('projectId', '==', filters.projectId))
      }

      // Season filter: use date range (1 Jul–30 Jun) so it works with or without stored season field
      if (filters.season) {
        const { start, end } = getSeasonDates(filters.season)
        constraints.push(where('date', '>=', Timestamp.fromDate(start)))
        constraints.push(where('date', '<=', Timestamp.fromDate(end)))
      }

      if (filters.dateFrom) {
        constraints.push(where('date', '>=', Timestamp.fromDate(filters.dateFrom)))
      }

      if (filters.dateTo) {
        constraints.push(where('date', '<=', Timestamp.fromDate(filters.dateTo)))
      }

      // Text search via searchKeywords (server-side)
      if (filters.searchQuery) {
        const normalized = filters.searchQuery
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
        if (normalized.length >= 2) {
          constraints.push(where('searchKeywords', 'array-contains', normalized))
        }
      }

      // Uncategorized filter: use Firestore 'in' query with all known uncategorized IDs
      if (filters.uncategorized) {
        const categoriesStore = useCategoriesStore()
        const uncatIds = Array.from(categoriesStore.uncategorizedIds)
        if (uncatIds.length > 0) {
          constraints.push(where('categoryId', 'in', uncatIds))
        }
      }

      // Pagination
      if (lastDoc.value) {
        constraints.push(startAfter(lastDoc.value))
      }

      const q = query(collection(db, 'transactions'), ...constraints)

      const snapshot = await getDocs(q)
      const newTransactions = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate() || new Date(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        updatedAt: d.data().updatedAt?.toDate() || new Date()
      })) as Transaction[]

      // Client-side sort for employee queries (no orderBy in Firestore)
      if (isEmployeeQuery) {
        newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }

      if (reset) {
        transactions.value = newTransactions
      } else {
        transactions.value = [...transactions.value, ...newTransactions]
      }

      lastDoc.value = snapshot.docs[snapshot.docs.length - 1] || null
      hasMore.value = snapshot.docs.length === PAGE_SIZE
    } catch (e) {
      logger.error('Error fetching transactions:', e)
      error.value = 'Error al cargar transacciones'
    } finally {
      loading.value = false
    }
  }

  /**
   * Lightweight count of uncategorized transactions (server-side aggregation).
   * Uses getCountFromServer() — no documents are downloaded.
   */
  const uncategorizedServerCount = ref(0)

  async function fetchUncategorizedCount() {
    try {
      const authStore = useAuthStore()
      if (!authStore.clubId) return

      const categoriesStore = useCategoriesStore()
      const uncatIds = Array.from(categoriesStore.uncategorizedIds)
      if (uncatIds.length === 0) return

      const q = query(
        collection(db, 'transactions'),
        where('clubId', '==', authStore.clubId),
        where('categoryId', 'in', uncatIds)
      )

      const snapshot = await getCountFromServer(q)
      uncategorizedServerCount.value = snapshot.data().count
    } catch (e) {
      logger.error('Error fetching uncategorized count:', e)
    }
  }

  /** Counts by query with current filters (for badges). */
  const pendingFilteredCount = ref(0)
  const uncategorizedFilteredCount = ref(0)

  /** Build base query constraints from filters (same as fetchTransactions, without limit/startAfter/status/uncategorized). */
  function buildCountConstraints(filters: TransactionFilters) {
    const authStore = useAuthStore()
    if (!authStore.clubId) return null
    const isEmployeeQuery = authStore.isEmployee && !!authStore.user?.uid
    const constraints: (ReturnType<typeof where> | ReturnType<typeof orderBy>)[] = [
      where('clubId', '==', authStore.clubId),
      ...(!isEmployeeQuery ? [orderBy('date', 'desc')] : [])
    ]
    if (isEmployeeQuery) {
      constraints.push(where('createdBy', '==', authStore.user!.uid))
    }
    if (filters.type) constraints.push(where('type', '==', filters.type))
    if (filters.categoryId) constraints.push(where('categoryId', '==', filters.categoryId))
    if (filters.teamId) constraints.push(where('teamId', '==', filters.teamId))
    if (filters.projectId) constraints.push(where('projectId', '==', filters.projectId))
    if (filters.season) {
      const { start, end } = getSeasonDates(filters.season)
      constraints.push(where('date', '>=', Timestamp.fromDate(start)))
      constraints.push(where('date', '<=', Timestamp.fromDate(end)))
    }
    if (filters.dateFrom) constraints.push(where('date', '>=', Timestamp.fromDate(filters.dateFrom)))
    if (filters.dateTo) constraints.push(where('date', '<=', Timestamp.fromDate(filters.dateTo)))
    if (filters.searchQuery && filters.searchQuery.trim().length >= 2) {
      const normalized = filters.searchQuery
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
      constraints.push(where('searchKeywords', 'array-contains', normalized))
    }
    return constraints
  }

  /** Server-side count of pending transactions with the same filters as the list. */
  async function fetchPendingFilteredCount(filters: TransactionFilters): Promise<void> {
    const constraints = buildCountConstraints(filters)
    if (!constraints) return
    try {
      const q = query(
        collection(db, 'transactions'),
        ...constraints,
        where('status', '==', 'pending')
      )
      const snapshot = await getCountFromServer(q)
      pendingFilteredCount.value = snapshot.data().count
    } catch (e) {
      logger.error('Error fetching pending filtered count:', e)
      pendingFilteredCount.value = 0
    }
  }

  /** Server-side count of uncategorized transactions with the same filters as the list. */
  async function fetchUncategorizedFilteredCount(filters: TransactionFilters): Promise<void> {
    const constraints = buildCountConstraints(filters)
    if (!constraints) return
    const categoriesStore = useCategoriesStore()
    const uncatIds = Array.from(categoriesStore.uncategorizedIds)
    if (uncatIds.length === 0) {
      uncategorizedFilteredCount.value = 0
      return
    }
    try {
      const q = query(
        collection(db, 'transactions'),
        ...constraints,
        where('categoryId', 'in', uncatIds)
      )
      const snapshot = await getCountFromServer(q)
      uncategorizedFilteredCount.value = snapshot.data().count
    } catch (e) {
      logger.error('Error fetching uncategorized filtered count:', e)
      uncategorizedFilteredCount.value = 0
    }
  }

  async function fetchMonthTransactions(year: number, month: number) {
    const start = startOfMonth(new Date(year, month - 1))
    const end = endOfMonth(new Date(year, month - 1))

    return fetchTransactions({
      dateFrom: start,
      dateTo: end
    })
  }

  /**
   * Fetch ALL transactions within a date range (no pagination).
   * Used by charts and statistics that need the full season data.
   * Results are cached by range and employee context; cache is invalidated on create/update/delete
   * to avoid extra Firestore reads when navigating between Dashboard, Treasury, Stats, Profitability.
   */
  async function fetchAllInDateRange(startDate: Date, endDate: Date) {
    const authStore = useAuthStore()
    if (!authStore.clubId) return

    const requestStart = startDate.getTime()
    const requestEnd = endDate.getTime()
    const cacheEmployeeId = authStore.isEmployee ? authStore.user?.uid ?? null : null

    // Serve from cache if we have data covering this range, same context, and not expired
    const cached = rangeCache.value
    const now = Date.now()
    if (
      cached &&
      requestStart >= cached.startTime &&
      requestEnd <= cached.endTime &&
      cached.employeeId === cacheEmployeeId &&
      now - cached.cachedAt < RANGE_CACHE_TTL_MS
    ) {
      const inRange = cached.list.filter(t => {
        const tTime = new Date(t.date).getTime()
        return tTime >= requestStart && tTime <= requestEnd
      })
      inRange.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      transactions.value = inRange
      lastDoc.value = null
      hasMore.value = false
      return
    }

    loading.value = true
    error.value = null

    try {
      // Match the proven query pattern: clubId + status(in) + date range
      let q = query(
        collection(db, 'transactions'),
        where('clubId', '==', authStore.clubId),
        where('status', 'in', ['approved', 'pending', 'paid']),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      )

      if (authStore.isEmployee && authStore.user?.uid) {
        q = query(q, where('createdBy', '==', authStore.user.uid))
      }

      const snapshot = await getDocs(q)
      const results = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate() || new Date(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        updatedAt: d.data().updatedAt?.toDate() || new Date()
      })) as Transaction[]

      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      transactions.value = results
      lastDoc.value = null
      hasMore.value = false

      rangeCache.value = {
        startTime: requestStart,
        endTime: requestEnd,
        list: results,
        employeeId: cacheEmployeeId,
        cachedAt: Date.now()
      }
    } catch (e) {
      logger.error('Error fetching all transactions in range:', e)
      error.value = 'Error al cargar transacciones'
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loading.value) return
    await fetchTransactions(currentFilters.value, false)
  }

  async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'clubId'>) {
    const authStore = useAuthStore()
    loading.value = true
    error.value = null

    // Auto-compute season if not explicitly set
    const season = data.season || computeSeason(new Date(data.date))

    try {
      if (!authStore.clubId || !authStore.user) return null

      // Generate search keywords for server-side text search
      const searchKeywords = generateSearchKeywords({
        description: data.description,
        categoryName: data.categoryName,
        teamName: data.teamName,
        supplierName: data.supplierName,
        sponsorName: data.sponsorName,
        reference: data.reference,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes
      })

      const rawData = {
        ...data,
        season,
        searchKeywords,
        clubId: authStore.clubId,
        createdBy: authStore.user.uid,
        createdByName: authStore.user.displayName,
        status: authStore.canApprove ? 'approved' : 'pending' as TransactionStatus,
        date: Timestamp.fromDate(data.date),
        paidDate: data.paidDate ? Timestamp.fromDate(data.paidDate) : null,
        dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Remove undefined values (Firebase doesn't accept them)
      const transactionData = Object.fromEntries(
        Object.entries(rawData).filter(([, v]) => v !== undefined)
      )

      const docRef = await addDoc(collection(db, 'transactions'), transactionData)

      const newTransaction: Transaction = {
        ...data,
        season,
        id: docRef.id,
        clubId: authStore.clubId,
        createdBy: authStore.user.uid,
        createdByName: authStore.user.displayName,
        status: authStore.canApprove ? 'approved' : 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      transactions.value = [newTransaction, ...transactions.value]
      invalidateRangeCache()

      // If the transaction is pending (created by employee), notify approvers
      if (newTransaction.status === 'pending') {
        import('./notifications').then(({ useNotificationsStore }) => {
          import('./auth').then(({ useAuthStore: getAuth }) => {
            const auth = getAuth()
            const notifStore = useNotificationsStore()
            // Notify each club member who can approve
            for (const member of auth.clubMembers) {
              if (['admin', 'manager', 'controller'].includes(member.role) && member.uid !== auth.user?.uid) {
                notifStore.createNotification({
                  userId: member.uid,
                  type: 'transaction_created',
                  title: 'Nueva transacción pendiente',
                  message: `${newTransaction.createdByName || 'Un empleado'} registró "${newTransaction.description}" (${newTransaction.amount.toFixed(2)}€)`,
                  link: '/pending'
                })
              }
            }
          })
        })
      }

      return newTransaction
    } catch (e) {
      logger.error('Error creating transaction:', e)
      error.value = 'Error al crear transacción'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateTransaction(id: string, data: Partial<Transaction>) {
    loading.value = true
    error.value = null

    try {
      // Regenerate search keywords if any searchable field changed
      const searchableFields = ['description', 'categoryName', 'teamName', 'supplierName', 'sponsorName', 'reference', 'invoiceNumber', 'notes'] as const
      const hasSearchableChange = searchableFields.some(f => f in data)

      const rawUpdateData: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp()
      }

      if (hasSearchableChange) {
        // Merge with existing transaction data to regenerate full keywords
        const existing = transactions.value.find(t => t.id === id)
        const merged = { ...existing, ...data }
        rawUpdateData.searchKeywords = generateSearchKeywords({
          description: merged.description || '',
          categoryName: merged.categoryName,
          teamName: merged.teamName,
          supplierName: merged.supplierName,
          sponsorName: merged.sponsorName,
          reference: merged.reference,
          invoiceNumber: merged.invoiceNumber,
          notes: merged.notes
        })
      }

      if (data.date) {
        rawUpdateData.date = Timestamp.fromDate(data.date)
      }
      if (data.paidDate) {
        rawUpdateData.paidDate = Timestamp.fromDate(data.paidDate)
      }
      if (data.dueDate) {
        rawUpdateData.dueDate = Timestamp.fromDate(data.dueDate)
      }

      // Remove undefined values (Firebase doesn't accept them)
      const updateData = Object.fromEntries(
        Object.entries(rawUpdateData).filter(([, v]) => v !== undefined)
      )

      await updateDoc(doc(db, 'transactions', id), updateData)

      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) {
        transactions.value[index] = {
          ...transactions.value[index],
          ...data,
          updatedAt: new Date()
        }
      }
      invalidateRangeCache()
      return true
    } catch (e) {
      logger.error('Error updating transaction:', e)
      error.value = 'Error al actualizar transacción'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteTransaction(id: string) {
    const authStore = useAuthStore()
    if (!authStore.isAdmin && !['admin', 'manager'].includes(authStore.userRole)) {
      logger.error('Permission denied: only admin/manager can delete transactions')
      return false
    }

    loading.value = true
    error.value = null

    try {
      // Delete attachments first
      const transaction = transactions.value.find(t => t.id === id)
      if (transaction?.attachments) {
        for (const attachment of transaction.attachments) {
          try {
            await deleteObject(storageRef(storage, attachment.url))
          } catch (e) {
            logger.warn('Could not delete attachment:', e)
          }
        }
      }

      await deleteDoc(doc(db, 'transactions', id))
      transactions.value = transactions.value.filter(t => t.id !== id)
      invalidateRangeCache()
      return true
    } catch (e) {
      logger.error('Error deleting transaction:', e)
      error.value = 'Error al eliminar transacción'
      return false
    } finally {
      loading.value = false
    }
  }

  async function approveTransaction(id: string) {
    const authStore = useAuthStore()
    if (!authStore.user) return false
    if (!authStore.canApprove) {
      logger.error('Permission denied: cannot approve transactions')
      return false
    }

    const result = await updateTransaction(id, {
      status: 'approved',
      approvedBy: authStore.user.uid,
      approvedAt: new Date()
    })

    // Notify the transaction creator
    if (result) {
      const tx = transactions.value.find(t => t.id === id)
      if (tx && tx.createdBy !== authStore.user.uid) {
        const { useNotificationsStore } = await import('./notifications')
        const notificationsStore = useNotificationsStore()
        notificationsStore.createNotification({
          userId: tx.createdBy,
          type: 'transaction_approved',
          title: 'Transacción aprobada',
          message: `"${tx.description}" (${tx.amount.toFixed(2)}€) ha sido aprobada`,
          link: `/transactions/${id}`
        })
      }
    }

    return result
  }

  async function rejectTransaction(id: string) {
    const authStore = useAuthStore()
    if (!authStore.user) return false
    if (!authStore.canApprove) {
      logger.error('Permission denied: cannot reject transactions')
      return false
    }

    const result = await updateTransaction(id, {
      status: 'rejected'
    })

    // Notify the transaction creator
    if (result) {
      const tx = transactions.value.find(t => t.id === id)
      if (tx && tx.createdBy !== authStore.user.uid) {
        const { useNotificationsStore } = await import('./notifications')
        const notificationsStore = useNotificationsStore()
        notificationsStore.createNotification({
          userId: tx.createdBy,
          type: 'transaction_rejected',
          title: 'Transacción rechazada',
          message: `"${tx.description}" (${tx.amount.toFixed(2)}€) ha sido rechazada`,
          link: `/transactions/${id}`
        })
      }
    }

    return result
  }

  /**
   * Approve multiple transactions atomically using a Firestore batch write.
   * Much faster and consistent than individual updates in a loop.
   */
  async function batchApproveTransactions(ids: string[]): Promise<boolean> {
    const authStore = useAuthStore()
    if (!authStore.user || !authStore.canApprove) {
      logger.error('Permission denied: cannot approve transactions')
      return false
    }

    if (ids.length === 0) return true

    loading.value = true
    error.value = null

    try {
      // Firestore batches max out at 500 writes
      const chunks: string[][] = []
      for (let i = 0; i < ids.length; i += 500) {
        chunks.push(ids.slice(i, i + 500))
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db)
        for (const id of chunk) {
          batch.update(doc(db, 'transactions', id), {
            status: 'approved',
            approvedBy: authStore.user.uid,
            approvedAt: Timestamp.now(),
            updatedAt: serverTimestamp()
          })
        }
        await batch.commit()
      }

      // Update local state
      for (const id of ids) {
        const index = transactions.value.findIndex(t => t.id === id)
        if (index !== -1) {
          transactions.value[index] = {
            ...transactions.value[index],
            status: 'approved',
            approvedBy: authStore.user.uid,
            approvedAt: new Date(),
            updatedAt: new Date()
          }
        }
      }

      return true
    } catch (e) {
      logger.error('Error batch approving transactions:', e)
      error.value = 'Error al aprobar transacciones en lote'
      return false
    } finally {
      loading.value = false
    }
  }

  // Upload constraints
  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10 MB
  const ALLOWED_UPLOAD_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf'
  ]

  async function uploadAttachment(transactionId: string, file: File): Promise<Attachment | null> {
    const authStore = useAuthStore()
    if (!authStore.clubId) return null

    // Validate file size
    if (file.size > MAX_UPLOAD_SIZE) {
      error.value = `El archivo excede el límite de ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`
      return null
    }

    // Validate file type
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      error.value = 'Tipo de archivo no permitido. Solo imágenes y PDF.'
      return null
    }

    try {
      const timestamp = Date.now()
      // Sanitize file name: remove dangerous characters
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `clubs/${authStore.clubId}/transactions/${transactionId}/${timestamp}_${safeName}`
      const fileRef = storageRef(storage, path)
      const metadata: UploadMetadata = { contentType: file.type || 'application/octet-stream' }

      await uploadBytes(fileRef, file, metadata)
      const url = await getDownloadURL(fileRef)

      const attachment: Attachment = {
        id: `${timestamp}`,
        name: safeName,
        url,
        type: file.type,
        size: file.size,
        uploadedAt: new Date()
      }

      // Update transaction with new attachment
      const transaction = transactions.value.find(t => t.id === transactionId)
      const attachments = [...(transaction?.attachments || []), attachment]

      await updateTransaction(transactionId, { attachments })

      return attachment
    } catch (e) {
      logger.error('Error uploading attachment:', e)
      return null
    }
  }

  async function deleteAttachment(transactionId: string, attachmentId: string) {
    const transaction = transactions.value.find(t => t.id === transactionId)
    if (!transaction?.attachments) return false

    const attachment = transaction.attachments.find(a => a.id === attachmentId)
    if (!attachment) return false

    try {
      await deleteObject(storageRef(storage, attachment.url))

      const attachments = transaction.attachments.filter(a => a.id !== attachmentId)
      await updateTransaction(transactionId, { attachments })

      return true
    } catch (e) {
      logger.error('Error deleting attachment:', e)
      return false
    }
  }

  function getTransactionById(id: string) {
    return transactions.value.find(t => t.id === id)
  }

  function clearTransactions() {
    transactions.value = []
    lastDoc.value = null
    hasMore.value = true
    currentFilters.value = {}
    invalidateRangeCache()
  }

  /**
   * Migration: Generate searchKeywords for all existing transactions
   * that don't have them yet. Call from Settings > Data Migration.
   */
  async function migrateSearchKeywords(
    onProgress?: (done: number, total: number) => void
  ): Promise<number> {
    const authStore = useAuthStore()
    if (!authStore.clubId) return 0

    // Fetch ALL transactions without keywords
    const allDocsQuery = query(
      collection(db, 'transactions'),
      where('clubId', '==', authStore.clubId)
    )

    const snapshot = await getDocs(allDocsQuery)
    let updated = 0
    const total = snapshot.docs.length

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()

      // Skip if already has keywords
      if (data.searchKeywords && data.searchKeywords.length > 0) {
        updated++
        onProgress?.(updated, total)
        continue
      }

      const keywords = generateSearchKeywords({
        description: data.description || '',
        categoryName: data.categoryName,
        teamName: data.teamName,
        supplierName: data.supplierName,
        sponsorName: data.sponsorName,
        reference: data.reference,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes
      })

      await updateDoc(doc(db, 'transactions', docSnap.id), {
        searchKeywords: keywords
      })

      updated++
      onProgress?.(updated, total)
    }

    return updated
  }

  return {
    // State
    transactions,
    loading,
    error,
    hasMore,
    currentFilters,

    // Getters
    incomeTransactions,
    expenseTransactions,
    pendingTransactions,
    uncategorizedTransactions,
    uncategorizedServerCount,
    pendingFilteredCount,
    uncategorizedFilteredCount,
    totalIncome,
    totalExpenses,
    balance,
    recentTransactions,
    getTransactionsBySeason,

    // Actions
    fetchTransactions,
    fetchUncategorizedCount,
    fetchPendingFilteredCount,
    fetchUncategorizedFilteredCount,
    fetchMonthTransactions,
    fetchAllInDateRange,
    loadMore,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    approveTransaction,
    batchApproveTransactions,
    rejectTransaction,
    uploadAttachment,
    deleteAttachment,
    getTransactionById,
    clearTransactions,
    migrateSearchKeywords
  }
})
