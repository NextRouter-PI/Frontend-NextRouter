export function animateLngLatMarker({ startLngLat, nextLngLat, duration = 1700, onStep, onDone }) {
  const start = performance.now()
  let rafId = null
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = t * (2 - t)
    const pos = [
      startLngLat[0] + (nextLngLat[0] - startLngLat[0]) * eased,
      startLngLat[1] + (nextLngLat[1] - startLngLat[1]) * eased,
    ]
    onStep(pos)
    if (t < 1) {
      rafId = requestAnimationFrame(step)
    } else {
      rafId = null
      onDone?.(pos)
    }
  }
  rafId = requestAnimationFrame(step)
  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }
}
