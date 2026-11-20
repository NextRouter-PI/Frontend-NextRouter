import { onScopeDispose, readonly, shallowRef } from 'vue'
import { TOAST_DEFAULT_DURATION_MS } from '@/constants'

export function useToast() {
  const toast = shallowRef(null)
  let timer = null
  let disposed = false

  function showToast(message, type = 'success', durationMs = TOAST_DEFAULT_DURATION_MS) {
    if (disposed) return
    clearTimeout(timer)
    toast.value = { message, type }
    timer = setTimeout(() => {
      toast.value = null
      timer = null
    }, durationMs)
  }

  onScopeDispose(() => {
    disposed = true
    clearTimeout(timer)
  })

  return { toast: readonly(toast), showToast }
}
