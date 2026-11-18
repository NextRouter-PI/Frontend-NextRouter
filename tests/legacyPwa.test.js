import assert from 'node:assert/strict'
import test from 'node:test'
import { retireLegacyCredentials, retireLegacyPwa } from '../src/legacyPwa.js'

test('retira somente as chaves legadas, sem ler JWT/perfil ou apagar tema', () => {
  const removed = []
  retireLegacyCredentials({ removeItem: (key) => removed.push(key) })
  assert.deepEqual(removed, ['access', 'user', 'manualLogout'])
  assert.doesNotThrow(() => retireLegacyCredentials({ removeItem() { throw new Error('bloqueado') } }))
})

test('retira apenas worker/caches conhecidos da origem, sem registrar outro', async () => {
  const deleted = []
  let unregistered = 0
  const origin = 'https://nextrouter.example.invalid'
  const worker = { scriptURL: `${origin}/sw.js` }
  const reload = await retireLegacyPwa({
    origin,
    serviceWorker: {
      controller: worker,
      getRegistrations: async () => [
        { scope: `${origin}/`, active: worker, unregister: async () => { unregistered++; return true } },
        { scope: `${origin}/outro/`, active: worker, unregister: () => { throw new Error('fora do escopo') } },
      ],
    },
    cacheStorage: {
      keys: async () => ['api-cache', `workbox-precache-v2-${origin}/`, 'outro-cache'],
      delete: async (key) => { deleted.push(key); return true },
    },
  })
  assert.equal(unregistered, 1)
  assert.equal(reload, true)
  assert.deepEqual(deleted, ['api-cache', `workbox-precache-v2-${origin}/`])
})

test('sem registro antigo não pede recargas sucessivas', async () => {
  assert.equal(await retireLegacyPwa({ origin: 'https://example.invalid', serviceWorker: { getRegistrations: async () => [] }, cacheStorage: null }), false)
})

test('falha ao retirar worker não é silenciosamente tratada como sucesso', async () => {
  const origin = 'https://example.invalid'
  await assert.rejects(retireLegacyPwa({ origin, cacheStorage: null, serviceWorker: {
    getRegistrations: async () => [{ scope: `${origin}/`, active: { scriptURL: `${origin}/sw.js` }, unregister: async () => false }],
  } }), /retirar/)
})
