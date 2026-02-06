import { boot } from 'quasar/wrappers'
import { useAuthStore } from 'src/stores/auth'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

export default boot(async () => {
  const authStore = useAuthStore()

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
