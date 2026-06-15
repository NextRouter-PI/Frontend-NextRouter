import api from '@/api/api'
import { state } from '@/store/state'
import router from '@/router'

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
  state.checkingAuth = true

  try {
    const response = await api.post('token/refresh/')

    state.access = response.data.access

    const me = await api.get('users/me/')
    state.user = me.data

    state.logged = true
  } catch {
    logout()
  } finally {
    state.checkingAuth = false
  }
} 



// * Função de desautenticar
async function logout() {
  try {
    await api.post('logout/')
  } catch (error) {
    console.error(error)
  } finally {
    state.logged = false
    state.user = null
    state.access = null
    state.error = null

    console.log(state.logged)
    console.log(state.access)
    console.log(state.user)
  }
}


export function useLoginState() {
  return {
    login,
    logout,
    checkAuth,
  }
}

