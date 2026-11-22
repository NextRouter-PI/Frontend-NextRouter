/**
 * Controla janela curta de frescor (SWR) e deduplicação de leituras em andamento nas stores Pinia.
 */
export function createFreshnessCache(ttlMs = 15_000) {
  let lastFetchedAt = 0
  let inFlight = null

  return {
    isFresh(hasData) {
      return Boolean(hasData && lastFetchedAt && Date.now() - lastFetchedAt < ttlMs)
    },
    markFresh(timestamp = Date.now()) {
      lastFetchedAt = timestamp
    },
    invalidate() {
      lastFetchedAt = 0
    },
    reset() {
      lastFetchedAt = 0
      inFlight = null
    },
    dedupe(force, runner) {
      if (inFlight && !force) return inFlight
      const promise = runner().finally(() => {
        if (inFlight === promise) inFlight = null
      })
      inFlight = promise
      return promise
    },
  }
}
