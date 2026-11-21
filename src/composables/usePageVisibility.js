import { computed, onScopeDispose, shallowRef } from 'vue'

/**
 * Monitora visibilidade da aba/app e conectividade de rede para pausar polling e animações em background.
 */
export function usePageVisibility() {
  const isVisible = shallowRef(
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  )
  const isOnline = shallowRef(
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  )
  const isActive = computed(() => isVisible.value && isOnline.value)

  function onVisibilityChange() {
    isVisible.value = document.visibilityState !== 'hidden'
  }
  function onOnline() {
    isOnline.value = true
  }
  function onOffline() {
    isOnline.value = false
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
  }

  onScopeDispose(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  })

  return { isVisible, isOnline, isActive }
}
