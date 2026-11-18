import assert from 'node:assert/strict'
import test from 'node:test'
import { createAuthSession } from '../src/stores/session.js'

const failure = (status) => ({ response: { status } })
function fixture(t, { role = 'passenger', get, login, logout } = {}) {
  const state = { initialized: false, logged: false, user: null, role: null, profiles: {}, loading: false, error: null }
  const calls = []
  const http = {
    events: new EventTarget(),
    api: { async get(path) {
      calls.push(path)
      if (get) return get(path)
      if (path === 'users/me/') return { data: { id: 'uuid-ficticio', name: 'Aluno de teste' } }
      if (path === `${{ passenger: 'passengers', driver: 'drivers', company: 'companies' }[role]}/me/`) return { data: { id: 1 } }
      throw failure(404)
    } },
    login: login || (async () => {}),
    logout: logout || (async () => {}),
  }
  const session = createAuthSession({ state, http })
  t.after(() => session.dispose())
  return { session, state, http, calls }
}

for (const role of ['passenger', 'driver', 'company']) {
  test(`restaura identidade e papel ${role} pelas leituras próprias, sem type no usuário`, async (t) => {
    const { session, state, calls } = fixture(t, { role })
    assert.equal(await session.checkAuth(), true)
    assert.equal(state.role, role)
    assert.equal(state.user.type, undefined)
    assert.equal(state.logged, true)
    assert.equal(state.initialized, true)
    assert.equal(state.checkingAuth, false)
    assert.equal(calls.length, 4)
  })
}

test('restaurações simultâneas compartilham a consulta', async (t) => {
  const { session, calls } = fixture(t)
  await Promise.all([session.checkAuth(), session.checkAuth(), session.checkAuth()])
  assert.equal(calls.length, 4)
  await session.checkAuth()
  assert.equal(calls.length, 4)
})

test('falha de login não chama logout nem revoga uma sessão confirmada', async (t) => {
  let logouts = 0
  const { session, state } = fixture(t, { login: async () => { throw failure(401) }, logout: async () => logouts++ })
  await session.checkAuth()
  assert.equal(await session.login('aluno@example.invalid', 'errada'), false)
  assert.equal(logouts, 0)
  assert.equal(state.logged, true)
  assert.match(state.error, /inválidos/)
})

test('login normaliza e-mail sem aguardar access/refresh no JSON', async (t) => {
  let email
  const { session, state } = fixture(t, { login: async (value) => { email = value; return { data: { detail: 'ok', csrfToken: 'csrf' } } } })
  assert.equal(await session.login(' ALUNO@EXAMPLE.INVALID ', 'ficticia'), true)
  assert.equal(email, 'aluno@example.invalid')
  assert.equal(state.logged, true)
  assert.equal('access' in state, false)
})

test('não confunde falha de rede na consulta do perfil com ausência de perfil', async (t) => {
  const { session, state } = fixture(t, { get: async (path) => {
    if (path === 'users/me/') return { data: { name: 'fixture' } }
    throw new Error('rede')
  } })
  assert.equal(await session.checkAuth(), false)
  assert.equal(state.role, null)
  assert.equal(state.user, null)
})

test('conta sem perfil não recebe papel inventado', async (t) => {
  const { session, state } = fixture(t, { role: null })
  assert.equal(await session.checkAuth(), true)
  assert.equal(state.logged, true)
  assert.equal(state.role, null)
})

test('login aceito com falha posterior não preserva a identidade da conta anterior', async (t) => {
  let changed = false
  const { session, state } = fixture(t, { login: async () => { changed = true }, get: async (path) => {
    if (changed) throw new Error('rede após troca dos cookies')
    if (path === 'users/me/') return { data: { name: 'Conta anterior' } }
    throw failure(404)
  } })
  await session.checkAuth()
  assert.equal(state.logged, true)
  assert.equal(await session.login('outra@example.invalid', 'ficticia'), false)
  assert.equal(state.user, null)
  assert.equal(state.logged, false)
})

test('falha de logout preserva identidade e informa que a sessão pode estar ativa', async (t) => {
  const { session, state } = fixture(t, { logout: async () => { throw new Error('rede') } })
  await session.checkAuth()
  assert.equal(await session.logout(), false)
  assert.equal(state.logged, true)
  assert.match(state.error, /continuar ativa/)
})

test('logout confirmado e expiração limpam usuário, perfil e papel da memória', async (t) => {
  const { session, state, http } = fixture(t)
  await session.checkAuth()
  assert.equal(await session.logout(), true)
  assert.equal(state.user, null)
  assert.equal(state.role, null)
  assert.deepEqual(state.profiles, {})
  await session.checkAuth({ force: true })
  http.events.dispatchEvent(new Event('expired'))
  assert.equal(state.logged, false)
  assert.equal(state.user, null)
})

test('consulta iniciada antes do logout não restaura identidade atrasada', async (t) => {
  let finish
  const pending = { promise: new Promise((resolve) => { finish = resolve }) }
  const { session, state } = fixture(t, { get: async (path) => {
    if (path === 'users/me/') return pending.promise
    throw failure(404)
  } })
  const checking = session.checkAuth()
  await session.logout()
  finish({ data: { name: 'anterior' } })
  assert.equal(await checking, false)
  assert.equal(state.user, null)
  assert.equal(state.logged, false)
})
