export function createGeolocationWatcher({ state, sendPosition }) {
  let watchId = null
  let lastSentAt = 0

  function stop() {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    lastSentAt = 0
  }

  function start(travelId) {
    stop()
    if (!navigator.geolocation) {
      state.error = 'Geolocalização não é suportada neste navegador ou contexto HTTP.'
      return
    }
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!state.tracking || state.role !== 'driver' || state.travelId !== travelId) return
        const nowMs = Date.now()
        const recordedAt = new Date(nowMs).toISOString()
        state.latitude = position.coords.latitude
        state.longitude = position.coords.longitude
        state.updatedAt = recordedAt
        state.stale = false
        // Evita disparo excessivo (< 2s) que o servidor recusaria por position_rate_limited.
        if (nowMs - lastSentAt >= 2000) {
          const sent = sendPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            recorded_at: recordedAt,
          })
          if (sent) lastSentAt = nowMs
        }
      },
      () => {
        state.error = 'Não foi possível obter sua localização (permissão negada ou sinal indisponível).'
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
  }

  return { start, stop }
}
