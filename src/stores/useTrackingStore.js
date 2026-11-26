import { reactive, toRefs, watch } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/api/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { createTravelSocketClient } from '@/features/transport/services/travelSocketClient'
import { createGeolocationWatcher } from '@/features/transport/services/geolocationWatcher'

function initialState() {
  return {
    travelId: null,
    role: null, // 'driver' | 'viewer'
    tracking: false,
    connected: false,
    stale: true,
    closed: false,
    latitude: null,
    longitude: null,
    bearing: 0,
    updatedAt: null,
    lastApproaching: null,
    lastPresence: null,
    error: null,
  }
}

export const useTrackingStore = defineStore('tracking', () => {
  const auth = useAuthStore()
  const state = reactive(initialState())

  const socketClient = createTravelSocketClient({
    state,
    http,
    stopTracking,
    onOpen: () => {
      if (state.role === 'driver') geoWatcher.sendLatest()
    },
  })
  const geoWatcher = createGeolocationWatcher({ state, sendPosition: socketClient.sendPosition })

  // Estabilidade do tempo real: ao voltar para a tela ou para a rede, reconecta e retoma o GPS na hora;
  // e um vigia reabre a conexão se o motorista ficar 60 s sem nenhum retorno do servidor.
  const SILENT_LIMIT_MS = 60_000
  function resume() {
    if (!state.tracking || state.closed) return
    if (!socketClient.isOpen()) socketClient.reconnectNow()
    if (state.role === 'driver') geoWatcher.restart()
  }
  const onVisibility = () => {
    if (document.visibilityState === 'visible') resume()
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility)
  if (typeof window !== 'undefined') window.addEventListener('online', resume)
  const watchdog = setInterval(() => {
    if (state.tracking && state.role === 'driver' && socketClient.isOpen() && socketClient.silentForMs() > SILENT_LIMIT_MS) {
      socketClient.reconnectNow()
    }
  }, 20_000)

  function stopTracking({ keepNotice = false } = {}) {
    socketClient.abortReads()
    geoWatcher.stop()
    socketClient.clearSocket()
    state.tracking = false
    state.role = null
    state.travelId = null
    if (!keepNotice) {
      state.closed = false
      state.stale = true
      state.latitude = null
      state.longitude = null
      state.updatedAt = null
      state.error = null
    }
  }

  function $reset() {
    stopTracking()
    Object.assign(state, initialState())
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
    socketClient.fetchInitialLocation(travelId)
    socketClient.openSocket(travelId)
    geoWatcher.start(travelId)
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
    socketClient.fetchInitialLocation(travelId)
    socketClient.openSocket(travelId)
  }

  const onRefreshed = () => {
    if (state.tracking && state.travelId) socketClient.openSocket(state.travelId)
  }
  const onExpired = () => stopTracking()

  http.events.addEventListener('refreshed', onRefreshed)
  http.events.addEventListener('expired', onExpired)

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      http.events.removeEventListener('refreshed', onRefreshed)
      http.events.removeEventListener('expired', onExpired)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', resume)
      clearInterval(watchdog)
      stopTracking()
    })
  }

  watch(() => auth.identityKey, () => stopTracking(), { flush: 'sync' })

  return {
    ...toRefs(state),
    $reset,
    startDriverTracking,
    startViewerTracking,
    stopTracking,
  }
})
