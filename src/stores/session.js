const PROFILE_RESOURCES = { company: 'companies', driver: 'drivers', passenger: 'passengers' }

export function sessionError(error, fallback) {
  const status = error.response?.status
  if (status === 401) return 'Sessão ausente ou expirada. Entre novamente; a operação não foi repetida.'
  if (status === 403) return 'Acesso ou proteção CSRF recusados. Recarregue a página antes de tentar novamente.'
  if (status === 429) return 'Muitas tentativas. Aguarde antes de tentar novamente.'
  return fallback
}

// A identidade é relida do servidor; não depender de type/papel ou vínculo em users/me/.
export function createAuthSession({ state, http }) {
  let checking = null
  let generation = 0

  function clearIdentity() {
    generation++
    state.logged = false
    state.user = null
    state.role = null
    state.profiles = {}
  }

  async function identity() {
    const { data: user } = await http.api.get('users/me/')
    const profiles = {}
    await Promise.all(Object.entries(PROFILE_RESOURCES).map(async ([role, resource]) => {
      try {
        profiles[role] = (await http.api.get(`${resource}/me/`, { skipSessionRefresh: true })).data
      } catch (error) {
        if (![403, 404].includes(error.response?.status)) throw error
      }
    }))
    return { user, profiles }
  }

  function applyIdentity({ user, profiles }) {
    const roles = Object.keys(profiles)
    state.user = user
    state.profiles = profiles
    state.role = roles.length === 1 ? roles[0] : null
    state.logged = true
    state.initialized = true
  }

  async function checkAuth({ force = false } = {}) {
    if (checking) return checking
    if (state.initialized && !force) return state.logged
    const current = generation
    state.checkingAuth = true
    checking = (async () => {
      try {
        const result = await identity()
        if (current !== generation) return false
        applyIdentity(result)
        state.error = null
        return true
      } catch (error) {
        if (current === generation) {
          clearIdentity()
          state.initialized = true
          state.error = sessionError(error, 'Não foi possível consultar a sessão. Confira a conexão e tente novamente.')
        }
        return false
      } finally {
        state.checkingAuth = false
        checking = null
      }
    })()
    return checking
  }

  async function login(email, password) {
    if (state.loading) return false
    state.loading = true
    state.error = null
    let current = ++generation
    try {
      await http.login(email.trim().toLowerCase(), password)
      if (current !== generation) return false
      // Os cookies já mudaram: uma falha nas leituras seguintes não pode manter
      // a identidade anterior visível sob a nova conta.
      clearIdentity()
      current = generation
      const result = await identity()
      if (current !== generation) return false
      applyIdentity(result)
      return true
    } catch (error) {
      // Falha de login não é logout; não revogar cookies válidos por erro de rede/senha.
      state.error = error.response?.status === 401 ? 'E-mail ou senha inválidos.'
        : sessionError(error, 'Não foi possível entrar. Confira a conexão e tente novamente.')
      return false
    } finally {
      state.loading = false
    }
  }

  async function logout() {
    if (state.loading) return false
    state.loading = true
    state.error = null
    try {
      await http.logout()
      clearIdentity()
      state.initialized = true
      return true
    } catch (error) {
      state.error = sessionError(error, 'Não foi possível confirmar a saída. Tente novamente; a sessão pode continuar ativa.')
      return false
    } finally {
      state.loading = false
    }
  }

  function expired() {
    clearIdentity()
    state.initialized = true
    state.error = 'Sessão encerrada. Entre novamente; nenhuma operação foi repetida.'
  }
  http.events.addEventListener('expired', expired)

  return { login, logout, checkAuth, dispose() { http.events.removeEventListener('expired', expired) } }
}
