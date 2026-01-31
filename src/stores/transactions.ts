import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from 'src/boot/firebase'
import { useAuthStore } from './auth'
import { isMockEnabled } from 'src/mocks'
import { transactionsApi } from 'src/services/api'
import type {
  Transaction,
  TransactionFilters,
  TransactionStatus,
  Attachment
} from 'src/types'
import { startOfMonth, endOfMonth } from 'date-fns'

const PAGE_SIZE = 20

export const useTransactionsStore = defineStore('transactions', () => {
  // State
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastDoc = ref<QueryDocumentSnapshot<DocumentData> | null>(null)
  const hasMore = ref(true)
  const currentFilters = ref<TransactionFilters>({})

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
      if (isMockEnabled()) {
        const result = await transactionsApi.getAll(filters)
        if (reset) {
          transactions.value = result
        } else {
          transactions.value = [...transactions.value, ...result]
        }
        hasMore.value = false
        loading.value = false
        return
      }

      const authStore = useAuthStore()
      if (!authStore.clubId) return

      let q = query(
        collection(db, 'transactions'),
        where('clubId', '==', authStore.clubId),
        orderBy('date', 'desc'),
        limit(PAGE_SIZE)
      )

      // Apply filters
      if (filters.type) {
        q = query(q, where('type', '==', filters.type))
      }

      if (filters.status) {
        q = query(q, where('status', '==', filters.status))
      }

      if (filters.categoryId) {
        q = query(q, where('categoryId', '==', filters.categoryId))
      }

      if (filters.teamId) {
        q = query(q, where('teamId', '==', filters.teamId))
      }

      if (filters.projectId) {
        q = query(q, where('projectId', '==', filters.projectId))
      }

      if (filters.dateFrom) {
        q = query(q, where('date', '>=', Timestamp.fromDate(filters.dateFrom)))
      }

      if (filters.dateTo) {
        q = query(q, where('date', '<=', Timestamp.fromDate(filters.dateTo)))
      }

      // Pagination
      if (lastDoc.value) {
        q = query(q, startAfter(lastDoc.value))
      }

      const snapshot = await getDocs(q)
      const newTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Transaction[]

      if (reset) {
        transactions.value = newTransactions
      } else {
        transactions.value = [...transactions.value, ...newTransactions]
      }

      lastDoc.value = snapshot.docs[snapshot.docs.length - 1] || null
      hasMore.value = snapshot.docs.length === PAGE_SIZE
    } catch (e) {
      console.error('Error fetching transactions:', e)
      error.value = 'Error al cargar transacciones'
    } finally {
      loading.value = false
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

  async function loadMore() {
    if (!hasMore.value || loading.value) return
    await fetchTransactions(currentFilters.value, false)
  }

  async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'clubId'>) {
    const authStore = useAuthStore()
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        const newTransaction = await transactionsApi.create({
          ...data,
          clubId: 'mock',
          createdBy: authStore.user?.uid || 'mock_user',
          createdByName: authStore.user?.displayName,
          status: authStore.canApprove ? 'approved' : 'pending'
        })
        transactions.value = [newTransaction, ...transactions.value]
        loading.value = false
        return newTransaction
      }

      if (!authStore.clubId || !authStore.user) return null

      const transactionData = {
        ...data,
        clubId: authStore.clubId,
        createdBy: authStore.user.uid,
        createdByName: authStore.user.displayName,
        status: authStore.canApprove ? 'approved' : 'pending' as TransactionStatus,
        date: Timestamp.fromDate(data.date),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'transactions'), transactionData)

      const newTransaction: Transaction = {
        ...data,
        id: docRef.id,
        clubId: authStore.clubId,
        createdBy: authStore.user.uid,
        createdByName: authStore.user.displayName,
        status: authStore.canApprove ? 'approved' : 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      transactions.value = [newTransaction, ...transactions.value]
      return newTransaction
    } catch (e) {
      console.error('Error creating transaction:', e)
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
      if (isMockEnabled()) {
        await transactionsApi.update(id, data)
        const index = transactions.value.findIndex(t => t.id === id)
        if (index !== -1) {
          transactions.value[index] = {
            ...transactions.value[index],
            ...data,
            updatedAt: new Date()
          }
        }
        loading.value = false
        return true
      }

      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      }

      if (data.date) {
        updateData.date = Timestamp.fromDate(data.date) as unknown as Date
      }

      await updateDoc(doc(db, 'transactions', id), updateData)

      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) {
        transactions.value[index] = {
          ...transactions.value[index],
          ...data,
          updatedAt: new Date()
        }
      }

      return true
    } catch (e) {
      console.error('Error updating transaction:', e)
      error.value = 'Error al actualizar transacción'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteTransaction(id: string) {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        await transactionsApi.delete(id)
        transactions.value = transactions.value.filter(t => t.id !== id)
        loading.value = false
        return true
      }

      // Delete attachments first
      const transaction = transactions.value.find(t => t.id === id)
      if (transaction?.attachments) {
        for (const attachment of transaction.attachments) {
          try {
            await deleteObject(storageRef(storage, attachment.url))
          } catch (e) {
            console.warn('Could not delete attachment:', e)
          }
        }
      }

      await deleteDoc(doc(db, 'transactions', id))
      transactions.value = transactions.value.filter(t => t.id !== id)
      return true
    } catch (e) {
      console.error('Error deleting transaction:', e)
      error.value = 'Error al eliminar transacción'
      return false
    } finally {
      loading.value = false
    }
  }

  async function approveTransaction(id: string) {
    const authStore = useAuthStore()
    if (!authStore.user) return false

    if (isMockEnabled()) {
      await transactionsApi.approve(id, authStore.user.uid)
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
      return true
    }

    return updateTransaction(id, {
      status: 'approved',
      approvedBy: authStore.user.uid,
      approvedAt: new Date()
    })
  }

  async function rejectTransaction(id: string) {
    if (isMockEnabled()) {
      await transactionsApi.reject(id)
      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) {
        transactions.value[index] = {
          ...transactions.value[index],
          status: 'rejected',
          updatedAt: new Date()
        }
      }
      return true
    }

    return updateTransaction(id, {
      status: 'rejected'
    })
  }

  async function uploadAttachment(transactionId: string, file: File): Promise<Attachment | null> {
    const authStore = useAuthStore()
    if (!authStore.clubId && !isMockEnabled()) return null

    try {
      if (isMockEnabled()) {
        // Mock attachment
        const attachment: Attachment = {
          id: `${Date.now()}`,
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          size: file.size,
          uploadedAt: new Date()
        }
        const transaction = transactions.value.find(t => t.id === transactionId)
        const attachments = [...(transaction?.attachments || []), attachment]
        await updateTransaction(transactionId, { attachments })
        return attachment
      }

      const timestamp = Date.now()
      const path = `clubs/${authStore.clubId}/transactions/${transactionId}/${timestamp}_${file.name}`
      const fileRef = storageRef(storage, path)

      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)

      const attachment: Attachment = {
        id: `${timestamp}`,
        name: file.name,
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
      console.error('Error uploading attachment:', e)
      return null
    }
  }

  async function deleteAttachment(transactionId: string, attachmentId: string) {
    const transaction = transactions.value.find(t => t.id === transactionId)
    if (!transaction?.attachments) return false

    const attachment = transaction.attachments.find(a => a.id === attachmentId)
    if (!attachment) return false

    try {
      if (!isMockEnabled()) {
        await deleteObject(storageRef(storage, attachment.url))
      }

      const attachments = transaction.attachments.filter(a => a.id !== attachmentId)
      await updateTransaction(transactionId, { attachments })

      return true
    } catch (e) {
      console.error('Error deleting attachment:', e)
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
    totalIncome,
    totalExpenses,
    balance,
    recentTransactions,

    // Actions
    fetchTransactions,
    fetchMonthTransactions,
    loadMore,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    approveTransaction,
    rejectTransaction,
    uploadAttachment,
    deleteAttachment,
    getTransactionById,
    clearTransactions
  }
})
