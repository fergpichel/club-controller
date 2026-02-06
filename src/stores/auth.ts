import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  Unsubscribe
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, query, where, getDocs, addDoc, updateDoc, Timestamp, deleteDoc
} from 'firebase/firestore'
import { auth, db } from 'src/boot/firebase'
import type { User, UserRole, ClubInvitation } from 'src/types'
import { logger } from 'src/utils/logger'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const firebaseUser = ref<FirebaseUser | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const unsubscribe = ref<Unsubscribe | null>(null)
  const _registering = ref(false) // Flag to prevent race condition during registration

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role || 'employee')
  const clubId = computed(() => user.value?.clubId)

  // Role hierarchy checks
  const isAdmin = computed(() => user.value?.role === 'admin')
  /** admin or manager — full management except closings */
  const isManager = computed(() => ['admin', 'manager'].includes(user.value?.role || ''))
  /** admin, manager or controller — can see sensitive data */
  const isController = computed(() => ['admin', 'manager', 'controller'].includes(user.value?.role || ''))

  // Granular permissions
  /** Can modify Settings (categories, catalogs, etc.) — admin, manager */
  const canManageSettings = computed(() => ['admin', 'manager'].includes(user.value?.role || ''))
  /** Can perform month closings — admin, controller */
  const canDoClosings = computed(() => ['admin', 'controller'].includes(user.value?.role || ''))
  /** Can approve transactions — admin, manager, controller */
  const canApprove = computed(() => ['admin', 'manager', 'controller'].includes(user.value?.role || ''))
  /** Can create/edit transactions — admin, manager, controller, editor, employee */
  const canEdit = computed(() => ['admin', 'manager', 'controller', 'editor', 'employee'].includes(user.value?.role || ''))
  /** Can see all transactions (not just own) — everyone except employee */
  const canViewAll = computed(() => user.value?.role !== 'employee')
  /** Can see statistics, charts, treasury — everyone except employee */
  const canViewStats = computed(() => user.value?.role !== 'employee')
  /** Can see sensitive category amounts (not anonymized) — admin, manager, controller */
  const canViewSensitive = computed(() => ['admin', 'manager', 'controller'].includes(user.value?.role || ''))
  /** Can mark categories as sensitive — admin, manager only */
  const canMarkSensitive = computed(() => ['admin', 'manager'].includes(user.value?.role || ''))
  /** Can remove a sensitive category from a transaction — admin, manager only */
  const canRemoveSensitiveCategory = computed(() => ['admin', 'manager'].includes(user.value?.role || ''))
  /** Can invite users to the club — admin, manager */
  const canInviteUsers = computed(() => ['admin', 'manager'].includes(user.value?.role || ''))
  /** Legacy: accountant check (now viewer or any read-only) */
  const isAccountant = computed(() => user.value?.role === 'viewer')
  /** Employee: can only see own data */
  const isEmployee = computed(() => user.value?.role === 'employee')

  // Actions
  async function setUser(fbUser: FirebaseUser) {
    // Skip if registration is in progress — register() will set user.value itself
    if (_registering.value) return

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
        // User authenticated (e.g. Google SSO) but has no Firestore document yet.
        // Don't try to write — Firestore rules may block it without a clubId.
        // Just set in memory; the setup wizard will complete the profile.
        user.value = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          role: 'employee',
          clubId: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    } catch (e) {
      logger.error('Error fetching user data:', e)
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

  async function loginWithGoogle() {
    loading.value = true
    error.value = null

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      // onAuthStateChanged → setUser() handles the rest
      return true
    } catch (e: unknown) {
      const firebaseError = e as { code?: string }
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        // User closed the popup — not an error
        return false
      }
      error.value = getAuthErrorMessage(firebaseError.code || '')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Register a new user.
   * If `clubId` is provided, joins that club.
   * If `newClubName` is provided instead, creates the club first (after auth) then joins.
   */
  async function register(
    email: string,
    password: string,
    displayName: string,
    clubId: string,
    role: UserRole = 'employee',
    newClubName?: string
  ) {
    loading.value = true
    error.value = null
    _registering.value = true // Prevent onAuthStateChanged from interfering

    try {
      // 1. Create Firebase Auth user first
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password)

      let finalClubId = clubId

      // 2. If creating a new club, do it now (user is authenticated)
      if (newClubName && !clubId) {
        const clubRef = await addDoc(collection(db, 'clubs'), {
          name: newClubName,
          createdAt: serverTimestamp(),
          settings: {
            currency: 'EUR',
            fiscalYearStart: 1,
            categories: [],
            defaultTeams: []
          }
        })
        finalClubId = clubRef.id
      }

      // 3. Create user document in Firestore
      const newUser: User = {
        uid: fbUser.uid,
        email,
        displayName,
        role,
        clubId: finalClubId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(doc(db, 'users', fbUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Explicitly set user with correct clubId (avoids race condition with onAuthStateChanged)
      firebaseUser.value = fbUser
      user.value = newUser

      return true
    } catch (e: unknown) {
      const firebaseError = e as { code?: string }
      error.value = getAuthErrorMessage(firebaseError.code || '')
      return false
    } finally {
      loading.value = false
      _registering.value = false
    }
  }

  /** True when user is authenticated but doesn't belong to any club yet */
  const needsSetup = computed(() => isAuthenticated.value && !user.value?.clubId)

  /**
   * Complete onboarding for a Google SSO (or any) user without a club.
   * Creates the club, then writes the user document.
   */
  async function completeSetup(clubName: string): Promise<boolean> {
    if (!firebaseUser.value) return false
    loading.value = true
    error.value = null

    try {
      // 1. Create the club
      const clubRef = await addDoc(collection(db, 'clubs'), {
        name: clubName,
        createdAt: serverTimestamp(),
        settings: {
          currency: 'EUR',
          fiscalYearStart: 1,
          categories: [],
          defaultTeams: []
        }
      })

      // 2. Write the user document
      const fbUser = firebaseUser.value
      const newUser: User = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        role: 'admin',
        clubId: clubRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(doc(db, 'users', fbUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      user.value = newUser
      return true
    } catch (e) {
      logger.error('Error completing setup:', e)
      error.value = 'Error al configurar la cuenta'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Join an existing club via invitation (for Google SSO users in setup wizard).
   */
  async function completeSetupWithInvitation(invitation: ClubInvitation): Promise<boolean> {
    if (!firebaseUser.value) return false
    loading.value = true
    error.value = null

    try {
      const fbUser = firebaseUser.value
      const newUser: User = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        role: invitation.role,
        clubId: invitation.clubId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(doc(db, 'users', fbUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Mark invitation as accepted
      await updateDoc(doc(db, 'invitations', invitation.id), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })

      user.value = newUser
      return true
    } catch (e) {
      logger.error('Error joining club:', e)
      error.value = 'Error al unirse al club'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      clearUser()
    } catch (e) {
      logger.error('Error signing out:', e)
    }
  }

  async function resetPassword(email: string) {
    loading.value = true
    error.value = null

    try {
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

  /** Fields the user is allowed to edit on their own profile */
  const SELF_EDITABLE_FIELDS = ['displayName', 'photoURL']

  async function updateUserProfile(data: Partial<User>) {
    if (!user.value) return false

    try {
      // Only allow safe fields — prevent self-escalation of role/clubId
      const safeData: Record<string, unknown> = {}
      for (const key of SELF_EDITABLE_FIELDS) {
        if (key in data) {
          safeData[key] = (data as Record<string, unknown>)[key]
        }
      }

      if (Object.keys(safeData).length === 0) return false

      await setDoc(doc(db, 'users', user.value.uid), {
        ...safeData,
        updatedAt: serverTimestamp()
      }, { merge: true })

      user.value = { ...user.value, ...safeData } as User
      return true
    } catch (e) {
      logger.error('Error updating profile:', e)
      return false
    }
  }

  // ===== INVITATIONS =====

  const invitations = ref<ClubInvitation[]>([])
  const clubMembers = ref<User[]>([])

  /** Fetch all pending invitations for the current club */
  async function fetchInvitations() {
    if (!user.value?.clubId) return
    try {
      const q = query(
        collection(db, 'invitations'),
        where('clubId', '==', user.value.clubId),
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(q)
      invitations.value = snapshot.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          expiresAt: data.expiresAt?.toDate?.() || new Date()
        } as ClubInvitation
      })
    } catch (e) {
      logger.error('Error fetching invitations:', e)
    }
  }

  /** Create an invitation for a user to join the club */
  async function createInvitation(email: string, role: UserRole): Promise<boolean> {
    if (!user.value?.clubId) return false
    if (!canInviteUsers.value) {
      throw new Error('Sin permisos para invitar usuarios')
    }

    try {
      // Check for existing pending invitation
      const existing = invitations.value.find(
        i => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending'
      )
      if (existing) {
        throw new Error('Ya existe una invitación pendiente para este email')
      }

      const now = new Date()
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Generate a cryptographic token for the invitation
      const token = crypto.randomUUID()

      // Get club name
      const clubDoc = await getDoc(doc(db, 'clubs', user.value.clubId))
      const clubName = clubDoc.exists() ? clubDoc.data().name : 'Club'

      await addDoc(collection(db, 'invitations'), {
        clubId: user.value.clubId,
        clubName,
        email: email.toLowerCase(),
        role,
        token,
        invitedBy: user.value.uid,
        invitedByName: user.value.displayName,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt)
      })

      await fetchInvitations()
      return true
    } catch (e) {
      logger.error('Error creating invitation:', e)
      throw e
    }
  }

  /** Cancel a pending invitation */
  async function cancelInvitation(invitationId: string): Promise<void> {
    await deleteDoc(doc(db, 'invitations', invitationId))
    invitations.value = invitations.value.filter(i => i.id !== invitationId)
  }

  /** Check if there is a pending, non-expired invitation for a given email */
  async function checkInvitation(email: string): Promise<ClubInvitation | null> {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('email', '==', email.toLowerCase()),
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(q)
      if (snapshot.empty) return null

      const d = snapshot.docs[0]
      const data = d.data()
      const expiresAt = data.expiresAt?.toDate?.() || new Date(0)

      // Check if invitation has expired
      if (expiresAt.getTime() < Date.now()) {
        // Mark as expired silently
        await updateDoc(doc(db, 'invitations', d.id), { status: 'expired' })
        return null
      }

      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        expiresAt
      } as ClubInvitation
    } catch (e) {
      logger.error('Error checking invitation:', e)
      return null
    }
  }

  /** Accept an invitation: mark it as accepted */
  async function acceptInvitation(invitationId: string): Promise<void> {
    await updateDoc(doc(db, 'invitations', invitationId), {
      status: 'accepted'
    })
  }

  /** Register a user who was invited — joins existing club */
  async function registerWithInvitation(
    email: string,
    password: string,
    displayName: string,
    invitation: ClubInvitation
  ): Promise<boolean> {
    loading.value = true
    error.value = null
    _registering.value = true

    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password)

      const newUser: User = {
        uid: fbUser.uid,
        email,
        displayName,
        role: invitation.role,
        clubId: invitation.clubId,
        invitedBy: invitation.invitedBy,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(doc(db, 'users', fbUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Mark invitation as accepted
      await acceptInvitation(invitation.id)

      firebaseUser.value = fbUser
      user.value = newUser

      return true
    } catch (e: unknown) {
      const firebaseError = e as { code?: string }
      error.value = getAuthErrorMessage(firebaseError.code || '')
      return false
    } finally {
      loading.value = false
      _registering.value = false
    }
  }

  /** Fetch all members of the current club */
  async function fetchClubMembers() {
    if (!user.value?.clubId) return
    try {
      const q = query(
        collection(db, 'users'),
        where('clubId', '==', user.value.clubId)
      )
      const snapshot = await getDocs(q)
      clubMembers.value = snapshot.docs.map(d => {
        const data = d.data()
        return {
          uid: d.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        } as User
      })
    } catch (e) {
      logger.error('Error fetching club members:', e)
    }
  }

  /** Update a member's role — requires admin or manager permission */
  async function updateMemberRole(uid: string, newRole: UserRole): Promise<boolean> {
    if (!canInviteUsers.value) {
      logger.error('Permission denied: only admin/manager can change member roles')
      return false
    }
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: serverTimestamp()
      })
      const member = clubMembers.value.find(m => m.uid === uid)
      if (member) member.role = newRole
      return true
    } catch (e) {
      logger.error('Error updating member role:', e)
      return false
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
    isController,
    isAccountant,
    isEmployee,
    canManageSettings,
    canDoClosings,
    canApprove,
    canEdit,
    canViewAll,
    canViewStats,
    canViewSensitive,
    canMarkSensitive,
    canRemoveSensitiveCategory,
    canInviteUsers,
    userRole,
    clubId,
    needsSetup,

    // Invitations & Members
    invitations,
    clubMembers,

    // Actions
    setUser,
    clearUser,
    setUnsubscribe,
    login,
    loginWithGoogle,
    register,
    registerWithInvitation,
    completeSetup,
    completeSetupWithInvitation,
    logout,
    resetPassword,
    updateUserProfile,

    // Invitation actions
    fetchInvitations,
    createInvitation,
    cancelInvitation,
    checkInvitation,
    acceptInvitation,

    // Members actions
    fetchClubMembers,
    updateMemberRole
  }
})
