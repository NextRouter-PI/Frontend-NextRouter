import { reactive, watch } from 'vue'
import { state as authState } from '@/stores/state'
import { createDriverTransportActions } from './transport/driverActions'
import { createPassengerTransportActions } from './transport/passengerActions'

const state = reactive({
  passenger: null,
  driver: null,
  loading: false,
  busy: false,
  error: null,
  notice: null,
})

let activeController = null

function nextSignal() {
  activeController?.abort()
  activeController = new AbortController()
  return activeController.signal
}

function resetTransportState() {
  activeController?.abort()
  activeController = null
  state.passenger = null
  state.driver = null
  state.loading = false
  state.busy = false
  state.error = null
  state.notice = null
}

watch(
  () => `${authState.logged}:${authState.user?.id || ''}:${authState.role || ''}`,
  () => {
    resetTransportState()
  },
  { flush: 'sync' },
)

const driverActions = createDriverTransportActions({ state, nextSignal })
const passengerActions = createPassengerTransportActions({ state, nextSignal })

export function useTransportState() {
  return {
    state,
    ...passengerActions,
    ...driverActions,
  }
}
