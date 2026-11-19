import { onScopeDispose, reactive } from 'vue'
import {
  createPassengerAccount,
  createDriverAccount,
  createCompanyAccount,
} from '@/api/registration'
import { formatApiError } from '@/utils/apiErrors'
import { sessionError } from '@/stores/session'

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

  const register = async (createAccount, data) => {
    if (signal.aborted || state.loading || state.success) return false
    reset()
    state.loading = true

    try {
      const response = await createAccount(data, { signal })
      if (signal.aborted) return false
      state.user = response.data
      state.success = true
      return true
    } catch (error) {
      if (!signal.aborted) {
        state.error = sessionError(error,
          formatApiError(error, 'Erro ao cadastrar. Verifique os dados e tente novamente.'))
        if (!error.response || error.response.status >= 500) {
          state.error += ' A operação não foi repetida. Se o cadastro pode ter sido concluído, tente entrar ou recuperar a senha antes de enviar novamente.'
        }
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
    registerPassenger: (data) => register(createPassengerAccount, data),
    registerDriver: (data) => register(createDriverAccount, data),
    registerCompany: (data) => register(createCompanyAccount, data),
  }
}
