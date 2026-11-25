import { onScopeDispose, shallowRef, watch } from 'vue'

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Anima um número de onde estava até o novo valor (ease-out). Valores não numéricos passam direto.
export function useCountUp(source, { duration = 900 } = {}) {
  const display = shallowRef(0)
  let frame = 0

  watch(
    source,
    (target) => {
      cancelAnimationFrame(frame)
      if (typeof target !== 'number' || !Number.isFinite(target)) {
        display.value = target
        return
      }
      const from = typeof display.value === 'number' ? display.value : 0
      if (reducedMotion() || from === target) {
        display.value = target
        return
      }
      const start = performance.now()
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        display.value = Math.round(from + (target - from) * eased)
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    },
    { immediate: true },
  )

  onScopeDispose(() => cancelAnimationFrame(frame))
  return display
}
