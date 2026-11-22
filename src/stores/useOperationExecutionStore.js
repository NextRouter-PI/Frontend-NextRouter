import { reactive, toRefs, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/useAuthStore'
import { createDriverTransportActions } from './transport/driverActions'
import { createPassengerTransportActions } from './transport/passengerActions'

export const useOperationExecutionStore = defineStore('operationExecution', () => {
  const auth = useAuthStore()
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

  function $reset() {
    activeController?.abort()
    activeController = null
    state.passenger = null
    state.driver = null
    state.loading = false
    state.busy = false
    state.error = null
    state.notice = null
  }

  watch(() => auth.roleIdentityKey, $reset, { flush: 'sync' })

  const driverActions = createDriverTransportActions({ state, auth, nextSignal })
  const passengerActions = createPassengerTransportActions({ state, auth, nextSignal })

  return {
    ...toRefs(state),
    $reset,
    ...passengerActions,
    ...driverActions,
  }
})
