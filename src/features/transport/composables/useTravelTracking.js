import { reactive, watch } from 'vue'
import { http } from '@/api/client'
import { readTravelLocation } from '@/api/transport'
import { state as authState } from '@/stores/state'

const state = reactive({
  travelId: null,
  role: null, // 'driver' | 'viewer'
  tracking: false,
  connected: false,
  stale: true,
  closed: false,
  latitude: null,
  longitude: null,
  updatedAt: null,
  error: null,
})

let socket = null
let watchId = null
let reconnectTimer = null
let readController = null
let lastSentAt = 0

function wsUrlFor(travelId) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/travels/${encodeURIComponent(travelId)}/location/`
}

function applyLocationPayload(payload) {
  const pos = payload?.position
  state.stale = Boolean(payload?.stale ?? !pos)
  if (pos && typeof pos.latitude === 'number' && typeof pos.longitude === 'number') {
    state.latitude = pos.latitude
    state.longitude = pos.longitude
    state.updatedAt = pos.updated_at || null
  } else if (pos === null) {
    state.latitude = null
    state.longitude = null
    state.updatedAt = null
  }
}

async function fetchInitialLocation(travelId) {
  readController?.abort()
  readController = new AbortController()
  const signal = readController.signal
  try {
    const data = await readTravelLocation(travelId, { signal })
    if (!signal.aborted && state.travelId === travelId) {
      applyLocationPayload(data)
    }
  } catch {
    // O WebSocket ou uma próxima leitura informará indisponibilidade/encerramento.
  }
}

function clearSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (socket) {
    socket.onopen = null
    socket.onmessage = null
    socket.onerror = null
    socket.onclose = null
    socket.close()
    socket = null
  }
  state.connected = false
}

function scheduleReconnect() {
  if (!state.tracking || state.closed || !state.travelId || reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (state.tracking && !state.closed && state.travelId) {
      openSocket(state.travelId)
    }
  }, 3000)
}

function openSocket(travelId) {
  clearSocket()
  if (!state.tracking || state.travelId !== travelId) return
  const ws = new WebSocket(wsUrlFor(travelId))
  socket = ws

  ws.onopen = () => {
    if (socket !== ws) return
    state.connected = true
    state.error = null
  }

  ws.onmessage = (event) => {
    if (socket !== ws) return
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'location') {
        applyLocationPayload(data)
        state.error = null
      } else if (data.type === 'closed') {
        state.closed = true
        state.stale = true
        state.error = 'A viagem foi encerrada; o acompanhamento ao vivo terminou.'
        stopTracking({ keepNotice: true })
      } else if (data.type === 'error') {
        state.error = data.detail || 'Posição recusada pelo servidor.'
      }
    } catch {
      // ignora mensagens malformadas
    }
  }

  ws.onerror = () => {
    if (socket !== ws) return
    state.connected = false
  }

  ws.onclose = async (event) => {
    if (socket !== ws) return
    socket = null
    state.connected = false
    if (!state.tracking) return

    if (event.code === 1000) {
      state.closed = true
      return
    }
    if (event.code === 4003) {
      state.closed = true
      state.error = 'Acesso ao acompanhamento de localização não autorizado ou revogado.'
      stopTracking({ keepNotice: true })
      return
    }
    if (event.code === 4009) {
      state.closed = true
      state.error = 'A operação foi encerrada ou não está mais em andamento.'
      stopTracking({ keepNotice: true })
      return
    }
    if (event.code === 1009) {
      state.error = 'Mensagem de localização excedeu o limite permitido.'
      return
    }
    if (event.code === 4001) {
      try {
        await http.refreshSession()
        if (state.tracking && state.travelId === travelId) {
          openSocket(travelId)
        }
      } catch {
        state.closed = true
        state.error = 'Sessão expirada. Entre novamente para retomar o acompanhamento.'
        stopTracking({ keepNotice: true })
      }
      return
    }

    state.error = 'Conexão de localização interrompida. Tentando reconectar...'
    scheduleReconnect()
  }
}

function stopTracking({ keepNotice = false } = {}) {
  readController?.abort()
  readController = null
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
  }
  clearSocket()
  state.tracking = false
  state.role = null
  state.travelId = null
  lastSentAt = 0
  if (!keepNotice) {
    state.closed = false
    state.stale = true
    state.latitude = null
    state.longitude = null
    state.updatedAt = null
    state.error = null
  }
}

/** Motorista: envia localização em tempo real na mesma origem, sem prometer GPS em background. */
function startDriverTracking(travelId) {
  if (!travelId) return
  if (state.tracking && state.travelId === travelId && state.role === 'driver') return

  stopTracking()
  state.travelId = travelId
  state.role = 'driver'
  state.tracking = true
  state.closed = false
  fetchInitialLocation(travelId)
  openSocket(travelId)

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
      if (socket && socket.readyState === WebSocket.OPEN && nowMs - lastSentAt >= 2000) {
        lastSentAt = nowMs
        socket.send(
          JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            recorded_at: recordedAt,
          }),
        )
      }
    },
    () => {
      state.error = 'Não foi possível obter sua localização (permissão negada ou sinal indisponível).'
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  )
}

/** Passageiro ou empresa autorizada: recebe localização em tempo real da viagem em andamento. */
function startViewerTracking(travelId) {
  if (!travelId) return
  if (state.tracking && state.travelId === travelId && state.role === 'viewer') return

  stopTracking()
  state.travelId = travelId
  state.role = 'viewer'
  state.tracking = true
  state.closed = false
  fetchInitialLocation(travelId)
  openSocket(travelId)
}

// Quando o access token é renovado, reconecta o canal para associar o novo JTI.
http.events.addEventListener('refreshed', () => {
  if (state.tracking && state.travelId) {
    openSocket(state.travelId)
  }
})
http.events.addEventListener('expired', () => stopTracking())
watch(() => `${authState.logged}:${authState.user?.id || ''}`, () => stopTracking(), { flush: 'sync' })

export function useTravelTracking() {
  return { state, startDriverTracking, startViewerTracking, stopTracking }
}
