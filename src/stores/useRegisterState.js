import { reactive } from 'vue'
import api from '@/api/client'
import { formatApiError } from '@/utils/apiErrors'


// Objeto de estado de registro
const state = reactive({
  loading: false,
  success: false,
  // Mensagem de erro (já formatada e legível) exibida na tela do usuário
  error: null,
  // Objeto contendo o usuário após o login
  user: null
})


// Endpoints para API
const endpointsForEachUserType = {
  passenger: '/passengers/',
  driver: '/drivers/',
  company: '/companies/'
}


export function useRegisterState() {
  // Função de reset de estado
  const reset = () => {
    state.loading = false
    state.success = false
    state.error = null
    state.user = null
  }

  const register = async (userType, data) => {
    reset() // Reset dos estados de registro
    state.loading = true // Inicia tela de loading, antes da requisição

    try {
      const response = await api.post(endpointsForEachUserType[userType], data) // Requisição de registro

      state.success = true
      state.user = response.data
    } catch (error) {
      state.error = formatApiError(error, 'Erro ao cadastrar. Verifique os dados e tente novamente.')
    } finally {
      state.loading = false
    }
  }

  return {
    state,
    reset,
    registerPassenger: data => register('passenger', data),
    registerDriver: data => register('driver', data),
    registerCompany: data => register('company', data)
  }
}
