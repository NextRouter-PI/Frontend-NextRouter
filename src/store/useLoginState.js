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
    localStorage.setItem('access', state.access)
    state.logged = true

    // * Cookies defindos por Set-Cookies no Backend

    const me = await api.get('users/me/')
    state.user = me.data
    localStorage.setItem('user', JSON.stringify(me.data))

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
    // Tenta usar o access token salvo primeiro (evita refresh desnecessário)
    if (state.access) {
      try {
        const me = await api.get('users/me/')
        state.user = me.data
        localStorage.setItem('user', JSON.stringify(me.data))
        state.logged = true
        state.checkingAuth = false
        return
      } catch {
        // Token expirado, tenta refresh
      }
    }

    const response = await api.post('token/refresh/')

    state.access = response.data.access
    localStorage.setItem('access', state.access)

    const me = await api.get('users/me/')
    state.user = me.data
    localStorage.setItem('user', JSON.stringify(me.data))

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
    localStorage.removeItem('access')
    localStorage.removeItem('user')
    state.logged = false
    state.user = null
    state.access = null
    state.error = null
    router.push({ name: 'login' })
  }
}


export function useLoginState() {
  return {
    login,
    logout,
    checkAuth,
  }
}

