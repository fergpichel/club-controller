import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  Unsubscribe
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from 'src/boot/firebase'
import { isMockEnabled, mockService } from 'src/mocks'
import type { User, UserRole } from 'src/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const firebaseUser = ref<FirebaseUser | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const unsubscribe = ref<Unsubscribe | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isManager = computed(() => ['admin', 'manager'].includes(user.value?.role || ''))
  const isAccountant = computed(() => user.value?.role === 'accountant')
  const canApprove = computed(() => ['admin', 'manager'].includes(user.value?.role || ''))
  const canEdit = computed(() => ['admin', 'manager', 'employee'].includes(user.value?.role || ''))
  const userRole = computed(() => user.value?.role || 'employee')
  const clubId = computed(() => user.value?.clubId)

  // Actions
  async function setUser(fbUser: FirebaseUser) {
    if (isMockEnabled()) return

    firebaseUser.value = fbUser
    loading.value = true
    error.value = null

    try {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid))

      if (userDoc.exists()) {
        user.value = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || userDoc.data().displayName,
          photoURL: fbUser.photoURL || userDoc.data().photoURL,
          ...userDoc.data()
        } as User
      } else {
        const newUser: User = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          role: 'employee',
          clubId: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await setDoc(doc(db, 'users', fbUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        user.value = newUser
      }
    } catch (e) {
      console.error('Error fetching user data:', e)
      error.value = 'Error loading user data'
    } finally {
      loading.value = false
    }
  }

  function clearUser() {
    user.value = null
    firebaseUser.value = null
    loading.value = false
    error.value = null
  }

  function setUnsubscribe(fn: Unsubscribe) {
    unsubscribe.value = fn
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        const mockUser = await mockService.auth.login(email, password)
        if (mockUser) {
          user.value = mockUser
          loading.value = false
          return true
        }
        error.value = 'Credenciales inválidas'
        loading.value = false
        return false
      }

      await signInWithEmailAndPassword(auth, email, password)
      return true
    } catch (e: unknown) {
      const firebaseError = e as { code?: string }
      error.value = getAuthErrorMessage(firebaseError.code || '')
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, displayName: string, clubId: string, role: UserRole = 'employee') {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        const mockUser = await mockService.auth.register(email, password, displayName)
        user.value = mockUser
        loading.value = false
        return true
      }

      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password)

      const newUser: User = {
        uid: fbUser.uid,
        email,
        displayName,
        role,
        clubId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(doc(db, 'users', fbUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      return true
    } catch (e: unknown) {
      const firebaseError = e as { code?: string }
      error.value = getAuthErrorMessage(firebaseError.code || '')
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      if (isMockEnabled()) {
        await mockService.auth.logout()
        clearUser()
        return
      }

      await signOut(auth)
      clearUser()
    } catch (e) {
      console.error('Error signing out:', e)
    }
  }

  async function resetPassword(email: string) {
    loading.value = true
    error.value = null

    try {
      if (isMockEnabled()) {
        // Simulate password reset in mock mode
        await new Promise(resolve => setTimeout(resolve, 500))
        loading.value = false
        return true
      }

      await sendPasswordResetEmail(auth, email)
      return true
    } catch (e: unknown) {
      const firebaseError = e as { code?: string }
      error.value = getAuthErrorMessage(firebaseError.code || '')
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateUserProfile(data: Partial<User>) {
    if (!user.value) return false

    try {
      if (isMockEnabled()) {
        user.value = { ...user.value, ...data }
        return true
      }

      await setDoc(doc(db, 'users', user.value.uid), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true })

      user.value = { ...user.value, ...data }
      return true
    } catch (e) {
      console.error('Error updating profile:', e)
      return false
    }
  }

  // Initialize mock user if mock mode
  async function initMockUser() {
    if (isMockEnabled()) {
      loading.value = true
      const mockUser = await mockService.auth.getCurrentUser()
      if (mockUser) {
        user.value = mockUser
      }
      loading.value = false
    }
  }

  function getAuthErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/invalid-email': 'Email inválido',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/weak-password': 'La contraseña es muy débil',
      'auth/user-disabled': 'Usuario deshabilitado',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde'
    }
    return messages[code] || 'Error de autenticación'
  }

  return {
    // State
    user,
    firebaseUser,
    loading,
    error,

    // Getters
    isAuthenticated,
    isAdmin,
    isManager,
    isAccountant,
    canApprove,
    canEdit,
    userRole,
    clubId,

    // Actions
    setUser,
    clearUser,
    setUnsubscribe,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    initMockUser
  }
})
