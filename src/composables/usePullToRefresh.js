import { onMounted, onScopeDispose, ref } from 'vue'

export function usePullToRefresh(refresh, enabled) {
  const distance = ref(0)
  const refreshing = ref(false)
  let startY = null
  let active = true

  function cancel() {
    startY = null
    distance.value = 0
  }
  function start(event) {
    cancel()
    if (!enabled() || window.scrollY > 0 || event.touches.length !== 1 ||
        event.target.closest('input, textarea, select, button, a')) return
    startY = event.touches[0].clientY
  }
  function move(event) {
    if (event.touches.length !== 1) { cancel(); return }
    if (startY === null) return
    distance.value = Math.min(100, Math.max(0, (event.touches[0].clientY - startY) / 2))
  }
  async function end() {
    const shouldRefresh = startY !== null && distance.value >= 60 && enabled()
    startY = null
    distance.value = 0
    if (!shouldRefresh || refreshing.value) return
    refreshing.value = true
    try { await refresh() } finally { if (active) refreshing.value = false }
  }
  onMounted(() => {
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', end, { passive: true })
    window.addEventListener('touchcancel', cancel, { passive: true })
  })
  onScopeDispose(() => {
    active = false
    window.removeEventListener('touchstart', start)
    window.removeEventListener('touchmove', move)
    window.removeEventListener('touchend', end)
    window.removeEventListener('touchcancel', cancel)
  })
  return { distance, refreshing }
}
