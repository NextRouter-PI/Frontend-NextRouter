import { reactive } from 'vue'
import api from '@/api/api'


// Objeto de estado de registro
const state = reactive({
  loading: false,
  success: false,
  // String de texto informando qual o erro que é recebida das requisições e é atribuida a uma variável posteior que é exibida na tela do usuário
  // TODO; Mensagens de erro recebidas do banco vêm aninhadas, seria muito bom se elas fossem tratadas!
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
    registerPassenger: data => register('passenger', data),
    registerDriver: data => register('driver', data),
    registerCompany: data => register('company', data)
  }
}
