import { onScopeDispose, watch } from 'vue'
import { usePageVisibility } from '@/composables/usePageVisibility'

/**
 * Gerencia polling periódico que pausa quando a aba está oculta ou offline
 * e reajusta o intervalo dinamicamente conforme o estado da conexão.
 */
export function useAdaptivePolling({ getIntervalMs, onTick, canRun = () => true }) {
  const { isActive } = usePageVisibility()
  let timer = null
  let started = false

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function schedule() {
    stopTimer()
    if (!started || !isActive.value) return
    timer = setInterval(() => {
      if (isActive.value && canRun()) onTick()
    }, getIntervalMs())
  }

  watch([isActive, getIntervalMs], ([active], [prevActive]) => {
    if (!started) return
    if (active && !prevActive && canRun()) onTick()
    schedule()
  })

  function start(immediate = true) {
    started = true
    if (immediate) onTick()
    schedule()
  }

  function stop() {
    started = false
    stopTimer()
  }

  onScopeDispose(stop)
  return { start, stop, isActive }
}
