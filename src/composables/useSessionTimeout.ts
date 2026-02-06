import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useRouter } from 'vue-router'

/**
 * Composable that logs the user out after a period of inactivity.
 *
 * Default: 30 minutes (1_800_000 ms).
 * Resets on mouse move, key press, click, scroll, or touch.
 *
 * Usage: call `useSessionTimeout()` once in MainLayout.vue.
 */
export function useSessionTimeout(timeoutMs = 30 * 60 * 1000) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const authStore = useAuthStore()
  const router = useRouter()

  const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const

  function resetTimer() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(async () => {
      if (authStore.isAuthenticated) {
        await authStore.logout()
        router.push({ name: 'login', query: { reason: 'timeout' } })
      }
    }, timeoutMs)
  }

  onMounted(() => {
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true })
    })
    resetTimer()
  })

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
    ACTIVITY_EVENTS.forEach(event => {
      window.removeEventListener(event, resetTimer)
    })
  })
}
