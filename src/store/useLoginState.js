import { reactive } from 'vue'
import api from '@/api/api'

const state = reactive({
  logado: false,
  user: null,
  access: null,
  refresh: null,
  loading: false,
  error: null,
})

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
    state.logado = true

    localStorage.setItem('access', state.access)
    localStorage.setItem('refresh', state.refresh)

    api.defaults.headers.common['Authorization'] = `Bearer ${state.access}`

    const me = await api.get('usuarios/me/')
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

async function checkAuth() {
  const token = localStorage.getItem('access')

  if (!token) return

  try {
    state.access = token
    state.refresh = localStorage.getItem('refresh')

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    const me = await api.get('usuarios/me/')

    state.user = me.data
    state.logado = true
  } catch {
    logout()
  }
}

function logout() {
  state.logado = false
  state.user = null
  state.access = null
  state.refresh = null
  state.error = null

  localStorage.removeItem('access')
  localStorage.removeItem('refresh')

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
