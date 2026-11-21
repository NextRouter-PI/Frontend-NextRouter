import { readTravelLocation } from '@/api/transport'
import {
  applyLocationPayload,
  handleTravelWsClose,
  handleTravelWsMessage,
} from './travelSocketHandlers'

const BASE_RECONNECT_MS = 2000
const MAX_RECONNECT_MS = 30000

function wsUrlFor(travelId) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/travels/${encodeURIComponent(travelId)}/location/`
}

export function createTravelSocketClient({ state, http, stopTracking }) {
  let socket = null
  let socketAbort = null
  let reconnectTimer = null
  let onlineListener = null
  let reconnectAttempt = 0
  let readController = null

  function clearReconnectWait() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (onlineListener) {
      window.removeEventListener('online', onlineListener)
      onlineListener = null
    }
  }

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
    clearReconnectWait()
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
    if (!state.tracking || state.closed || !state.travelId || reconnectTimer || onlineListener) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      onlineListener = () => {
        clearReconnectWait()
        reconnectAttempt = 0
        if (state.tracking && !state.closed && state.travelId) openSocket(state.travelId)
      }
      window.addEventListener('online', onlineListener, { once: true })
      return
    }
    const backoff = Math.min(MAX_RECONNECT_MS, BASE_RECONNECT_MS * 2 ** Math.min(reconnectAttempt, 4))
    const delayMs = backoff + Math.round(Math.random() * 600)
    reconnectAttempt += 1
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      if (state.tracking && !state.closed && state.travelId) openSocket(state.travelId)
    }, delayMs)
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
      reconnectAttempt = 0
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
