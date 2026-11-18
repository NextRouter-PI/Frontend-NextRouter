import assert from 'node:assert/strict'
import test from 'node:test'
import { AxiosError } from 'axios'
import { createHttpClient } from '../src/api/http.js'

function mutex() {
  let tail = Promise.resolve()
  return { request(_name, action) {
    const pending = tail.then(action)
    tail = pending.catch(() => {})
    return pending
  } }
}

function fixture(t, handler, options = {}) {
  const calls = []
  const client = createHttpClient({
    locks: mutex(),
    adapter: async (config) => {
      calls.push(config)
      const { status = 200, data = {} } = await handler(config)
      const response = { config, status, data, headers: {}, statusText: String(status) }
      if (status >= 400) throw new AxiosError(`HTTP ${status}`, 'ERR_BAD_RESPONSE', config, null, response)
      return response
    },
    ...options,
  })
  t.after(() => client.dispose())
  return { client, calls, count: (path) => calls.filter((config) => config.url === path).length }
}

test('mutações compartilham bootstrap e enviam CSRF, não Bearer', async (t) => {
  const { client, calls, count } = fixture(t, ({ url }) => ({ data: url === 'csrf/' ? { csrfToken: 'csrf-inicial' } : {} }))
  await Promise.all([
    client.api.post('memberships/', { company_id: 1, profile: 'passenger' }),
    client.api.patch('/passengers/me/', {}, { headers: { Authorization: 'Bearer legado' } }),
  ])
  assert.equal(count('csrf/'), 1)
  for (const config of calls.filter((item) => item.method !== 'get')) {
    assert.equal(config.headers.get('X-CSRFToken'), 'csrf-inicial')
    assert.equal(config.headers.has('Authorization'), false)
    assert.equal(config.baseURL, '/api/')
    assert.equal(config.withCredentials, true)
    assert.equal(config.withXSRFToken, false)
  }
})

test('login aceita somente detail/CSRF e usa o token rotacionado na próxima mutação', async (t) => {
  const sent = []
  const channel = { postMessage: (value) => sent.push(value), close() {} }
  const { client, calls, count } = fixture(t, ({ url }) => ({ data: url === 'csrf/'
    ? { csrfToken: 'csrf-antes' } : url === 'login/' ? { detail: 'Sessão iniciada.', csrfToken: 'csrf-depois' } : {} }), { channel })
  const response = await client.login('aluno@example.invalid', 'senha-ficticia')
  await client.api.post('memberships/', {})
  assert.deepEqual(Object.keys(response.data).sort(), ['csrfToken', 'detail'])
  assert.equal(count('csrf/'), 1)
  assert.equal(calls.find((config) => config.url === 'memberships/').headers.get('X-CSRFToken'), 'csrf-depois')
  assert.deepEqual(sent, ['changed'])
})

test('leituras 401 concorrentes fazem um refresh e um replay por leitura', async (t) => {
  let active = false
  const { client, count } = fixture(t, ({ url }) => {
    if (url === 'csrf/') return { data: { csrfToken: 'csrf' } }
    if (url === 'refresh/') { active = true; return {} }
    return { status: active ? 200 : 401, data: { detail: 'fixture' } }
  })
  await Promise.all([client.api.get('notifications/'), client.api.get('memberships/')])
  assert.equal(count('refresh/'), 1)
  assert.equal(count('notifications/'), 2)
  assert.equal(count('memberships/'), 2)
})

test('duas abas com Web Lock reconsultam a sessão antes de disputar a rotação', async (t) => {
  let active = false
  const locks = mutex()
  const handler = ({ url }) => {
    if (url === 'csrf/') return { data: { csrfToken: 'csrf' } }
    if (url === 'refresh/') { active = true; return {} }
    return { status: active ? 200 : 401 }
  }
  const first = fixture(t, handler, { locks })
  const second = fixture(t, handler, { locks })
  await Promise.all([first.client.refreshSession(), second.client.refreshSession()])
  assert.equal(first.count('refresh/') + second.count('refresh/'), 1)
  assert.equal(first.count('users/me/') + second.count('users/me/'), 2)
})

test('403 de leitura ou mutação não dispara refresh nem replay', async (t) => {
  const { client, count } = fixture(t, ({ url }) => url === 'csrf/' ? { data: { csrfToken: 'csrf' } } : { status: 403 })
  await assert.rejects(client.api.get('notifications/'), (error) => error.response.status === 403)
  await assert.rejects(client.api.post('memberships/', {}), (error) => error.response.status === 403)
  assert.equal(count('refresh/'), 0)
  assert.equal(count('notifications/'), 1)
  assert.equal(count('memberships/'), 1)
})

for (const method of ['post', 'patch', 'put', 'delete']) {
  test(`${method.toUpperCase()} 401 não é repetido nem dispara refresh`, async (t) => {
    const { client, count } = fixture(t, ({ url }) => url === 'csrf/' ? { data: { csrfToken: 'csrf' } } : { status: 401 })
    await assert.rejects(client.api[method]('memberships/1/', {}))
    assert.equal(count('memberships/1/'), 1)
    assert.equal(count('refresh/'), 0)
  })
}

test('falha de rede numa mutação não inventa sucesso nem repete o envio', async (t) => {
  const { client, count } = fixture(t, ({ url }) => {
    if (url === 'csrf/') return { data: { csrfToken: 'csrf' } }
    throw new Error('Falha simulada')
  })
  await assert.rejects(client.api.post('memberships/', {}))
  assert.equal(count('memberships/'), 1)
  assert.equal(count('refresh/'), 0)
})

test('segunda resposta 401 encerra a tentativa, sem loop ou logout HTTP', async (t) => {
  let expired = 0
  const { client, count, calls } = fixture(t, ({ url }) => {
    if (url === 'csrf/') return { data: { csrfToken: 'csrf' } }
    return { status: url === 'refresh/' ? 200 : 401 }
  })
  client.events.addEventListener('expired', () => expired++)
  await assert.rejects(client.api.get('notifications/'))
  assert.equal(count('refresh/'), 1)
  assert.equal(count('notifications/'), 2)
  assert.equal(count('me/logout/'), 0)
  assert.equal(calls.find((config) => config.url === 'refresh/').data, undefined)
  assert.equal(expired, 1)
})

test('refresh derrotado consulta a sessão vencedora, sem apagar seus cookies', async (t) => {
  let active = false
  let expired = false
  const { client, count } = fixture(t, ({ url }) => {
    if (url === 'csrf/') return { data: { csrfToken: 'csrf' } }
    if (url === 'refresh/') { active = true; return { status: 401 } }
    return { status: active ? 200 : 401 }
  })
  client.events.addEventListener('expired', () => { expired = true })
  await client.api.get('notifications/')
  assert.equal(count('refresh/'), 1)
  assert.equal(count('me/logout/'), 0)
  assert.equal(expired, false)
})

test('sem Web Locks, não existe rotação automática concorrente insegura', async (t) => {
  const { client, count } = fixture(t, () => ({ status: 401 }), { locks: null })
  await assert.rejects(client.api.get('users/me/'), /entrar novamente/)
  assert.equal(count('refresh/'), 0)
})

test('evento de outra aba invalida CSRF, sem transportar identidade ou tokens', async (t) => {
  let sequence = 0
  const channel = { close() {}, postMessage() {} }
  const { client, calls } = fixture(t, ({ url }) => ({ data: url === 'csrf/' ? { csrfToken: `csrf-${++sequence}` } : {} }), { channel })
  await client.api.post('memberships/', {})
  channel.onmessage({ data: 'changed' })
  await client.api.post('memberships/', {})
  assert.deepEqual(calls.filter((config) => config.url === 'memberships/').map((config) => config.headers.get('X-CSRFToken')), ['csrf-1', 'csrf-2'])
})

test('paginação preserva filtros e não agrega duas vezes após refresh', async (t) => {
  let active = false
  const { client, calls } = fixture(t, ({ url, params }) => {
    if (url === 'csrf/') return { data: { csrfToken: 'csrf' } }
    if (url === 'refresh/') { active = true; return {} }
    if (!active) return { status: 401 }
    return { data: { results: [params.page || 1], total_pages: 3 } }
  })
  const { data } = await client.api.get('memberships/', { params: { status: 'pending' } })
  assert.deepEqual(data.results, [1, 2, 3])
  assert.ok(calls.filter((config) => config.url === 'memberships/').every((config) => config.params.status === 'pending'))
})

test('página explícita não faz coleta oculta de todas as páginas', async (t) => {
  const { client, count } = fixture(t, () => ({ data: { results: [2], total_pages: 3 } }))
  const { data } = await client.api.get('memberships/', { params: { page: 2 } })
  assert.deepEqual(data.results, [2])
  assert.equal(count('memberships/'), 1)
})

for (const path of ['https://externo.invalid/api/', '//externo.invalid/api/', '../admin/', '/api/../admin/', 'users/me/#token', '\\externo.invalid']) {
  test(`recusa caminho externo ou fora da API: ${path}`, async (t) => {
    const { client, calls } = fixture(t, () => ({}))
    await assert.rejects(client.api.get(path), /mesma origem/)
    assert.equal(calls.length, 0)
  })
}
