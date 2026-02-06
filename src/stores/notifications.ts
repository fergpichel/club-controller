import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
import { db } from 'src/boot/firebase'
import { useAuthStore } from './auth'
import type { Notification } from 'src/types'
import { logger } from 'src/utils/logger'

const PAGE_SIZE = 30

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let unsubscribe: Unsubscribe | null = null

  // Getters
  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.read)
  )

  const recentNotifications = computed(() =>
    notifications.value.slice(0, 20)
  )

  // Actions

  /**
   * Subscribe to real-time notifications for the current user.
   * Call once when the user logs in; unsubscribe on logout.
   */
  function subscribe() {
    // Avoid double subscription
    if (unsubscribe) unsubscribe()

    const authStore = useAuthStore()
    if (!authStore.user?.uid) return

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', authStore.user.uid),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      notifications.value = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date()
      })) as Notification[]
    }, (err) => {
      // If the query fails (e.g. missing index), fall back to a one-time fetch
      logger.error('Notifications real-time listener failed, falling back:', err)
      fetchOnce()
    })
  }

  /** One-time fetch (fallback if real-time listener fails). */
  async function fetchOnce() {
    const authStore = useAuthStore()
    if (!authStore.user?.uid) return

    loading.value = true
    try {
      // Simple query without orderBy to avoid needing a composite index
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', authStore.user.uid),
        limit(PAGE_SIZE)
      )

      const snapshot = await getDocs(q)
      notifications.value = snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() || new Date()
        }) as Notification)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (e) {
      logger.error('Error fetching notifications:', e)
      error.value = 'Error al cargar notificaciones'
    } finally {
      loading.value = false
    }
  }

  /** Mark a single notification as read */
  async function markAsRead(id: string) {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true })
      const n = notifications.value.find(x => x.id === id)
      if (n) n.read = true
    } catch (e) {
      logger.error('Error marking notification as read:', e)
    }
  }

  /** Mark all notifications as read (batch) */
  async function markAllAsRead() {
    const unread = notifications.value.filter(n => !n.read)
    if (unread.length === 0) return

    try {
      const batch = writeBatch(db)
      for (const n of unread) {
        batch.update(doc(db, 'notifications', n.id), { read: true })
      }
      await batch.commit()
      unread.forEach(n => { n.read = true })
    } catch (e) {
      logger.error('Error marking all as read:', e)
    }
  }

  /**
   * Create a notification for a specific user.
   * Called internally when transactions are approved/rejected, months closed, etc.
   */
  async function createNotification(data: {
    userId: string
    type: Notification['type']
    title: string
    message: string
    link?: string
  }) {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...data,
        read: false,
        createdAt: serverTimestamp()
      })
    } catch (e) {
      logger.error('Error creating notification:', e)
    }
  }

  /** Stop the real-time listener */
  function stop() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    notifications.value = []
  }

  return {
    notifications,
    loading,
    error,
    unreadCount,
    unreadNotifications,
    recentNotifications,
    subscribe,
    fetchOnce,
    markAsRead,
    markAllAsRead,
    createNotification,
    stop
  }
})
