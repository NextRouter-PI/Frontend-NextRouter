import { getPlatformGeolocation } from '@/platform/runtime'
import { haversineMeters } from '@/utils/geo'

const MIN_SEND_INTERVAL_MS = 2000
const STATIONARY_HEARTBEAT_MS = 15000
const MIN_DISPLACEMENT_METERS = 5

export function createGeolocationWatcher({ state, sendPosition }) {
  const geo = getPlatformGeolocation()
  let watchId = null
  let lastSentAt = 0
  let lastSentCoords = null
  let lastFix = null
  let currentTravelId = null

  function stop() {
    if (watchId !== null) {
      geo.clearWatch(watchId)
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
    currentTravelId = travelId
    if (!geo.isSupported()) {
      state.error = 'Geolocalização não é suportada neste navegador ou contexto HTTP.'
      return
    }
    watchId = geo.watchPosition(
      (position) => {
        if (!state.tracking || state.role !== 'driver' || state.travelId !== travelId) return
        const nowMs = Date.now()
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const recordedAt = new Date(nowMs).toISOString()
        lastFix = { lat, lng, at: nowMs }
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

  // Depois de reconectar: manda a última posição (se recente) para o servidor não ficar com a antiga.
  function sendLatest() {
    if (!lastFix || Date.now() - lastFix.at > 20_000) return
    const nowMs = Date.now()
    if (sendPosition({ latitude: lastFix.lat, longitude: lastFix.lng, recorded_at: new Date(nowMs).toISOString() })) {
      lastSentAt = nowMs
      lastSentCoords = { lat: lastFix.lat, lng: lastFix.lng }
    }
  }

  // Celulares podem congelar o watchPosition com a tela bloqueada; ao voltar, recomeça a leitura.
  function restart() {
    if (currentTravelId !== null && watchId !== null) start(currentTravelId)
  }

  return { start, stop, sendLatest, restart }
}
