import { reactive } from 'vue'
import { state as authState } from '@/stores/state'

const state = reactive({
  travelId: null,
  role: null, // 'driver' | 'viewer'
  tracking: false,
  latitude: null,
  longitude: null,
  updatedAt: null,
  error: null,
})

let socket = null
let watchId = null

function wsUrlFor(travelId) {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  const base = apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '')
  return `${base}/ws/travels/${travelId}/location/?token=${authState.access || ''}`
}

function openSocket(travelId) {
  const ws = new WebSocket(wsUrlFor(travelId))

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'location') {
        state.latitude = data.latitude
        state.longitude = data.longitude
        state.updatedAt = data.updated_at
      }
    } catch {
      // ignora mensagens inválidas
    }
  }

  ws.onerror = () => {
    state.error = 'Erro na conexão de localização em tempo real.'
  }

  return ws
}

function stopTracking() {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
  if (socket) {
    socket.close()
    socket = null
  }
  state.tracking = false
  state.role = null
  state.travelId = null
  state.latitude = null
  state.longitude = null
  state.updatedAt = null
  state.error = null
}

/** Motorista: começa a enviar a localização em tempo real para a viagem. */
function startDriverTracking(travelId) {
  if (state.tracking && state.travelId === travelId && state.role === 'driver') return

  stopTracking()
  state.travelId = travelId
  state.role = 'driver'
  state.tracking = true
  socket = openSocket(travelId)

  if (!navigator.geolocation) {
    state.error = 'Geolocalização não é suportada neste navegador.'
    return
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      state.latitude = position.coords.latitude
      state.longitude = position.coords.longitude
      state.updatedAt = new Date().toISOString()
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        )
      }
    },
    () => {
      state.error = 'Não foi possível obter sua localização.'
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  )
}

/** Passageiro/empresa: passa a receber a localização em tempo real da viagem. */
function startViewerTracking(travelId) {
  if (state.tracking && state.travelId === travelId && state.role === 'viewer') return

  stopTracking()
  state.travelId = travelId
  state.role = 'viewer'
  state.tracking = true
  socket = openSocket(travelId)
}

export function useTravelTracking() {
  return { state, startDriverTracking, startViewerTracking, stopTracking }
}
