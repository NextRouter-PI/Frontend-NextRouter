import axios from 'axios'

const SAFE_METHODS = new Set(['get', 'head', 'options'])
const SESSION_LOCK = 'nextrouter-cookie-session'

// Mantém cookies/CSRF e coordenação separados do estado Vue e da navegação.
export function createHttpClient({
  adapter,
  origin = globalThis.location?.origin || 'http://localhost',
  locks = globalThis.navigator?.locks,
  channel = null,
} = {}) {
  const options = { baseURL: '/api/', withCredentials: true, withXSRFToken: false }
  if (adapter) options.adapter = adapter
  const raw = axios.create(options)
  const api = axios.create(options)
  const events = new EventTarget()
  let csrfToken = null
  let csrfPending = null
  let csrfRevision = 0
  let refreshing = null
  let requests = new AbortController()

  function invalidateCsrf() {
    csrfToken = null
    csrfPending = null
    csrfRevision++
  }

  function announce(kind, broadcast = true) {
    invalidateCsrf()
    if (kind === 'changed') {
      requests.abort()
      requests = new AbortController()
    }
    events.dispatchEvent(new Event(broadcast ? kind : `external-${kind}`))
    if (broadcast) channel?.postMessage(kind)
  }

  if (channel) channel.onmessage = ({ data }) => {
    if (data === 'changed' || data === 'refreshed') announce(data, false)
  }

  function sameOrigin(config) {
    const path = config.url || ''
    if (/^[a-z][a-z\d+.-]*:|^\/\/|\\/i.test(path)) {
      throw new Error('A API aceita somente caminhos da mesma origem.')
    }
    const url = new URL(path.startsWith('/api/') ? path : `/api/${path.replace(/^\//, '')}`, origin)
    if (url.origin !== origin || !url.pathname.startsWith('/api/') || url.hash) {
      throw new Error('A API aceita somente caminhos /api/ da mesma origem.')
    }
    config.baseURL = '/api/'
    config.url = url.pathname.slice('/api/'.length) + url.search
    config.withCredentials = true
    config.withXSRFToken = false
    config.headers.delete('Authorization')
    config.headers.set('Accept', 'application/json')
    return config
  }

  raw.interceptors.request.use(sameOrigin)

  async function bootstrapCsrf() {
    if (csrfToken) return csrfToken
    if (csrfPending) return csrfPending
    const revision = csrfRevision
    const pending = raw.get('csrf/').then(({ data }) => {
      if (typeof data?.csrfToken !== 'string' || !data.csrfToken) {
        throw new Error('Não foi possível preparar a proteção CSRF.')
      }
      if (revision !== csrfRevision) return bootstrapCsrf()
      csrfToken = data.csrfToken
      return csrfToken
    }).finally(() => {
      if (csrfPending === pending) csrfPending = null
    })
    csrfPending = pending
    return pending
  }

  const withSessionLock = (action) => locks
    ? locks.request(SESSION_LOCK, action)
    : action()

  async function sessionMutation(path, data) {
    invalidateCsrf()
    return raw.post(path, data, { headers: { 'X-CSRFToken': await bootstrapCsrf() } })
  }

  async function login(email, password) {
    return withSessionLock(async () => {
      const result = await sessionMutation('login/', { email, password })
      announce('changed')
      csrfToken = result.data.csrfToken
      return result
    })
  }

  async function logout() {
    return withSessionLock(async () => {
      const result = await sessionMutation('me/logout/')
      announce('changed')
      return result
    })
  }

  // Somente após confirmação do servidor de troca de credencial ou revogação total.
  // Não envia logout/replay; descarta requisições e notifica abas sem dados privados.
  function confirmSessionRevocation() {
    announce('changed')
    events.dispatchEvent(new Event('expired'))
  }

  async function refreshSession() {
    if (refreshing) return refreshing
    // Sem mutex entre abas, não disputar a rotação de um refresh de uso único.
    if (!locks) throw new Error('Este navegador exige entrar novamente para renovar a sessão com segurança.')
    refreshing = withSessionLock(async () => {
      try {
        // Outra aba/requisição pode ter renovado enquanto aguardávamos o lock.
        await raw.get('users/me/')
        return
      } catch (error) {
        if (error.response?.status !== 401) throw error
      }
      try {
        await sessionMutation('refresh/')
      } catch (error) {
        if (error.response?.status !== 401) throw error
        // Não transformar a derrota numa corrida em logout da sessão vencedora.
        await raw.get('users/me/')
      }
      announce('refreshed')
    }).finally(() => { refreshing = null })
    return refreshing
  }

  api.interceptors.request.use(async (config) => {
    sameOrigin(config)
    config.signal = config.signal
      ? AbortSignal.any([config.signal, requests.signal]) : requests.signal
    if (!SAFE_METHODS.has(config.method)) {
      config.headers.set('X-CSRFToken', await bootstrapCsrf())
    }
    if (config.method === 'get' && !config.params?.page_size) {
      config.params = { ...config.params, page_size: 100 }
    }
    return config
  })

  api.interceptors.response.use(undefined, async (error) => {
    const config = error.config
    if (error.response?.status !== 401 || !config || config.skipSessionRefresh) throw error
    // Uma leitura pode ser refeita uma vez. Escritas e 403 nunca têm replay/refresh.
    if (config.method === 'get' && !config.sessionRetried) {
      try {
        await refreshSession()
      } catch (cause) {
        if (cause.response?.status === 401) events.dispatchEvent(new Event('expired'))
        throw cause
      }
      return api.request({ ...config, sessionRetried: true })
    }
    events.dispatchEvent(new Event('expired'))
    throw error
  })

  // Compatibilidade com as telas existentes; chamadas com página explícita não agregam.
  api.interceptors.response.use(async (response) => {
    const { config, data } = response
    if (response.pagesCollected || config.method !== 'get' || config.params?.page || !Array.isArray(data?.results) || !(data.total_pages > 1)) {
      return response
    }
    const pages = await Promise.all(Array.from({ length: data.total_pages - 1 }, (_, index) =>
      api.get(config.url, { params: { ...config.params, page: index + 2 } }),
    ))
    data.results = data.results.concat(...pages.map((page) => page.data.results))
    response.pagesCollected = true
    return response
  })

  return {
    api, events, login, logout, bootstrapCsrf, refreshSession, confirmSessionRevocation,
    dispose() { requests.abort(); channel?.close() },
  }
}
