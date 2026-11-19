import { onScopeDispose, readonly, ref } from 'vue'

export function useToast() {
  const toast = ref(null)
  let timer = null
  let disposed = false

  function showToast(message, type = 'success') {
    if (disposed) return
    clearTimeout(timer)
    toast.value = { message, type }
    timer = setTimeout(() => {
      toast.value = null
      timer = null
    }, 3000)
  }

  onScopeDispose(() => {
    disposed = true
    clearTimeout(timer)
  })

  return { toast: readonly(toast), showToast }
}
