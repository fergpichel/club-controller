import { boot } from 'quasar/wrappers'
import { useAuthStore } from 'src/stores/auth'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { isMockEnabled } from 'src/mocks'

export default boot(async () => {
  const authStore = useAuthStore()

  // If mock mode is enabled, initialize mock user
  if (isMockEnabled()) {
    await authStore.initMockUser()
    return
  }

  // Set up Firebase auth state listener
  return new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await authStore.setUser(firebaseUser)
      } else {
        authStore.clearUser()
      }
      resolve()
    })

    // Store unsubscribe function for cleanup
    authStore.setUnsubscribe(unsubscribe)
  })
})
