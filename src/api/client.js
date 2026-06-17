// api.js
import axios from 'axios'
import { state } from '@/stores/state' // Importa apenas o estado puro

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Garante o envio do cookie do Refresh Token
})

// INTERCEPTOR DINÂMICO
api.interceptors.request.use(
  (config) => {
    // Busca o access token diretamente da memória reativa do Vue
    if (state.access) {
      config.headers.Authorization = `Bearer ${state.access}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api
