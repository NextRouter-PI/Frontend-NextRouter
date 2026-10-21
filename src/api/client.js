// api.js
import axios from 'axios'
import { state } from '@/stores/state' // Importa apenas o estado puro

// Tamanho máximo de página aceito pela API (max_page_size do backend)
const PAGE_SIZE = 100

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

    // As listagens da API são paginadas (10 por página por padrão). As telas esperam a lista
    // completa, então as requisições GET pedem a maior página possível.
    if (config.method === 'get' && !config.params?.page_size) {
      config.params = { ...config.params, page_size: PAGE_SIZE }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Se a listagem tiver mais de uma página, busca as demais e junta tudo em `results`.
api.interceptors.response.use(async (response) => {
  const { config, data } = response
  const isFirstPageOfList =
    config.method === 'get' && !config.params?.page && Array.isArray(data?.results) && data.total_pages > 1

  if (!isFirstPageOfList) return response

  const nextPages = await Promise.all(
    Array.from({ length: data.total_pages - 1 }, (_, index) =>
      api.get(config.url, { params: { ...config.params, page: index + 2 } }),
    ),
  )
  data.results = data.results.concat(...nextPages.map((page) => page.data.results))
  return response
})

export default api
