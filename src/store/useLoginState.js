import api from '@/api/api'
import { state } from '@/store/state'

// * Função para autenticar usuário
async function login(email, password) {
  state.loading = true
  state.error = null

  try {
    const response = await api.post('token/', {
      email,
      password,
    })

    state.access = response.data.access
    state.logged = true

    // * Cookies defindos por Set-Cookies no Backend

    const me = await api.get('users/me/')
    state.user = me.data

    return true
  } catch (error) {
    state.error = 'Login inválido'
    logout()
    return false
  } finally {
    state.loading = false
  }
}


// * Checagem de autenticação
async function checkAuth() {
  try {
    // Se deu F5, a memória limpou. Chamamos o endpoint de refresh.
    // O navegador anexará o cookie HttpOnly do refresh token automaticamente nesta chamada.
    const response = await api.post('token/refresh/')

    state.access = response.data.access

    const me = await api.get('users/me/')
    state.user = me.data
    state.logged = true
  } catch {
    logout()
  }
}



// * Função de desautenticar
function logout() {
  state.logged = false
  state.user = null
  state.access = null
  state.refresh = null
  state.error = null

  // ! TODO: Rever lógica
  // delete api.defaults.headers.common.Authorization
}


export function useLoginState() {
  return {
    login,
    logout,
    checkAuth,
  }
}

