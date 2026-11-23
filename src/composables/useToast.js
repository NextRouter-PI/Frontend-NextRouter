import { toast } from 'vue-sonner'
import { TOAST_DEFAULT_DURATION_MS } from '@/constants'

function showToast(message, type = 'success', durationMs = TOAST_DEFAULT_DURATION_MS) {
  const text = String(message ?? '').trim()
  if (!text) return null

  const normalizedType = type === 'danger' ? 'error' : type
  const options = { duration: durationMs }

  if (normalizedType === 'error') return toast.error(text, options)
  if (normalizedType === 'warning') return toast.warning(text, options)
  if (normalizedType === 'info') return toast.info(text, options)
  return toast.success(text, options)
}

function dismissToast(id) {
  toast.dismiss(id)
}

export function useToast() {
  return {
    toast,
    showToast,
    dismissToast,
  }
}
