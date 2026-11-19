import { onScopeDispose, reactive } from 'vue'
import api from '@/api/client'
import { formatApiError } from '@/utils/apiErrors'

const endpointsForEachUserType = {
  passenger: '/passengers/',
  driver: '/drivers/',
  company: '/companies/',
}

export function useRegisterState() {
  const state = reactive({
    loading: false,
    success: false,
    error: null,
    user: null,
  })
  const controller = new AbortController()
  const { signal } = controller

  const reset = () => {
    if (signal.aborted || state.loading) return
    state.success = false
    state.error = null
    state.user = null
  }

  const register = async (userType, data) => {
    if (signal.aborted || state.loading || state.success) return false
    reset()
    state.loading = true

    try {
      const response = await api.post(endpointsForEachUserType[userType], data, { signal })
      if (signal.aborted) return false
      state.user = response.data
      state.success = true
      return true
    } catch (error) {
      if (!signal.aborted) {
        state.error = formatApiError(error, 'Erro ao cadastrar. Verifique os dados e tente novamente.')
      }
      return false
    } finally {
      if (!signal.aborted) state.loading = false
    }
  }

  // Descartar a tela cancela a espera local; não desfaz uma escrita já aceita pelo servidor.
  onScopeDispose(() => controller.abort())

  return {
    state,
    reset,
    registerPassenger: (data) => register('passenger', data),
    registerDriver: (data) => register('driver', data),
    registerCompany: (data) => register('company', data),
  }
}
