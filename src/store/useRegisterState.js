import { reactive } from 'vue'
import api from '@/api/api'

const state = reactive({
  loading: false,
  success: false,
  error: null,
  user: null
})

const endpoints = {
  passageiro: '/passengers/',
  motorista: '/drivers/',
  empresa: '/companies/'
}

export function useRegisterState() {
  const reset = () => {
    state.loading = false
    state.success = false
    state.error = null
    state.user = null
  }

  const register = async (tipo, data) => {
    reset()
    state.loading = true

    try {
      const response = await api.post(endpoints[tipo], data)

      state.success = true
      state.user = response.data
    } catch (error) {
      state.error =
        error.response?.data ||
        error.message ||
        'Erro ao cadastrar'
    } finally {
      state.loading = false
    }
  }

  return {
    state,
    registerPassageiro: data => register('passageiro', data),
    registerMotorista: data => register('motorista', data),
    registerEmpresa: data => register('empresa', data)
  }
}