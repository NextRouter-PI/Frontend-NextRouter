import { readTravelLocation } from '@/api/transport'
import {
  applyLocationPayload,
  handleTravelWsClose,
  handleTravelWsMessage,
} from './travelSocketHandlers'

function wsUrlFor(travelId) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/travels/${encodeURIComponent(travelId)}/location/`
}

export function createTravelSocketClient({ state, http, stopTracking }) {
  let socket = null
  let socketAbort = null
  let reconnectTimer = null
  let readController = null

  async function fetchInitialLocation(travelId) {
    readController?.abort()
    readController = new AbortController()
    const signal = readController.signal
    try {
      const data = await readTravelLocation(travelId, { signal })
      if (!signal.aborted && state.travelId === travelId) {
        applyLocationPayload(state, data)
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
    socketAbort?.abort()
    socketAbort = null
    if (socket) {
      socket.close()
      socket = null
    }
    state.connected = false
  }

  function abortReads() {
    readController?.abort()
    readController = null
  }

  function scheduleReconnect() {
    if (!state.tracking || state.closed || !state.travelId || reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      if (state.tracking && !state.closed && state.travelId) openSocket(state.travelId)
    }, 3000)
  }

  function openSocket(travelId) {
    clearSocket()
    if (!state.tracking || state.travelId !== travelId) return
    const ws = new WebSocket(wsUrlFor(travelId))
    const ac = new AbortController()
    socket = ws
    socketAbort = ac

    ws.addEventListener('open', () => {
      if (socket !== ws) return
      state.connected = true
      state.error = null
    }, { signal: ac.signal })

    ws.addEventListener('message', (event) => {
      if (socket === ws) handleTravelWsMessage(state, event.data, stopTracking)
    }, { signal: ac.signal })

    ws.addEventListener('error', () => {
      if (socket === ws) state.connected = false
    }, { signal: ac.signal })

    ws.addEventListener('close', (event) => {
      if (socket !== ws) return
      socket = null
      state.connected = false
      handleTravelWsClose({ state, event, travelId, http, openSocket, scheduleReconnect, stopTracking })
    }, { signal: ac.signal })
  }

  function sendPosition(payload) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload))
      return true
    }
    return false
  }

  return { fetchInitialLocation, openSocket, clearSocket, abortReads, sendPosition }
}
