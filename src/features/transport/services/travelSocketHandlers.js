import { bearingDegrees, haversineMeters } from '@/utils/geo'

export function applyLocationPayload(state, payload) {
  const pos = payload?.position
  state.stale = Boolean(payload?.stale ?? !pos)
  if (pos && typeof pos.latitude === 'number' && typeof pos.longitude === 'number') {
    if (
      state.latitude != null &&
      state.longitude != null &&
      haversineMeters(state.latitude, state.longitude, pos.latitude, pos.longitude) >= 5
    ) {
      state.bearing = bearingDegrees(state.latitude, state.longitude, pos.latitude, pos.longitude)
    }
    state.latitude = pos.latitude
    state.longitude = pos.longitude
    state.updatedAt = pos.updated_at || null
  } else if (pos === null) {
    state.latitude = null
    state.longitude = null
    state.updatedAt = null
  }
}

export function handleTravelWsMessage(state, rawData, stopTracking) {
  try {
    const data = JSON.parse(rawData)
    if (data.type === 'location') {
      applyLocationPayload(state, data)
      state.error = null
    } else if (data.type === 'approaching') {
      state.lastApproaching = {
        participationId: data.participation_id,
        distanceMeters: data.distance_meters,
        at: Date.now(),
      }
    } else if (data.type === 'presence') {
      state.lastPresence = {
        participationId: data.participation_id,
        status: data.status,
        at: Date.now(),
      }
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

export async function handleTravelWsClose({ state, event, travelId, http, openSocket, scheduleReconnect, stopTracking }) {
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
      if (state.tracking && state.travelId === travelId) openSocket(travelId)
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
