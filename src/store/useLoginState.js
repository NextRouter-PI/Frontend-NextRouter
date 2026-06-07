import { reactive } from 'vue'
import api from '@/api/api'

// Objeto que salva no local storage (por enquanto)
const state = reactive({
  logged: false,
  user: null,
  access: null,
  refresh: null,
  loading: false,
  error: null,
})

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
    state.refresh = response.data.refresh
    state.logged = true

    localStorage.setItem('access', state.access) // TODO; Futuramente salvar como cookies
    localStorage.setItem('refresh', state.refresh) // TODO; Futuramente salvar como cookies

    api.defaults.headers.common['Authorization'] = `Bearer ${state.access}`

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
  const token = localStorage.getItem('access') // TODO; Futuramente acessar pelos cookies

  if (!token) return

  try {
    state.access = token
    state.refresh = localStorage.getItem('refresh') // TODO; Futuramente acessar pelos cookies

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

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

  localStorage.removeItem('access') // TODO; Futuramente remover cookies
  localStorage.removeItem('refresh') // TODO; Futuramente remover cookies

  delete api.defaults.headers.common.Authorization
}


export function useLoginState() {
  return {
    state,
    login,
    logout,
    checkAuth,
  }
}
