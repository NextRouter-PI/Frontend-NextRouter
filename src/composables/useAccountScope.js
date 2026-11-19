import { onScopeDispose, watch } from 'vue'
import { state } from '@/stores/state'

// Usado por módulos privados montados com key da identidade; não se rearma para outra conta.
export function useAccountScope() {
  const ownerId = state.user?.id
  const controller = new AbortController()
  const current = () => Boolean(ownerId) && !controller.signal.aborted && state.logged && state.user?.id === ownerId
  watch(() => `${state.logged}:${state.user?.id || ''}`, () => controller.abort(), { flush: 'sync' })
  onScopeDispose(() => controller.abort())
  return { ownerId, signal: controller.signal, current }
}
