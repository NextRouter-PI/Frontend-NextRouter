import { haversineMeters } from '@/utils/geo'

const MIN_SEND_INTERVAL_MS = 2000
const STATIONARY_HEARTBEAT_MS = 15000
const MIN_DISPLACEMENT_METERS = 5

export function createGeolocationWatcher({ state, sendPosition }) {
  let watchId = null
  let lastSentAt = 0
  let lastSentCoords = null

  function stop() {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    lastSentAt = 0
    lastSentCoords = null
  }

  function shouldTransmit(lat, lng, nowMs) {
    const elapsed = nowMs - lastSentAt
    if (elapsed < MIN_SEND_INTERVAL_MS) return false
    if (!lastSentCoords || elapsed >= STATIONARY_HEARTBEAT_MS) return true
    return haversineMeters(lastSentCoords.lat, lastSentCoords.lng, lat, lng) >= MIN_DISPLACEMENT_METERS
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
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const recordedAt = new Date(nowMs).toISOString()
        state.latitude = lat
        state.longitude = lng
        state.updatedAt = recordedAt
        state.stale = false
        if (shouldTransmit(lat, lng, nowMs)) {
          const sent = sendPosition({ latitude: lat, longitude: lng, recorded_at: recordedAt })
          if (sent) {
            lastSentAt = nowMs
            lastSentCoords = { lat, lng }
          }
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
