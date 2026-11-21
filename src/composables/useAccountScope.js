import { onScopeDispose, watch } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

// Usado por módulos privados montados com key da identidade; não se rearma para outra conta.
export function useAccountScope() {
  const auth = useAuthStore()
  const ownerId = auth.user?.id
  const controller = new AbortController()
  const current = () =>
    Boolean(ownerId) && !controller.signal.aborted && auth.logged && auth.user?.id === ownerId
  watch(() => auth.identityKey, () => controller.abort(), { flush: 'sync' })
  onScopeDispose(() => controller.abort())
  return { ownerId, signal: controller.signal, current }
}
