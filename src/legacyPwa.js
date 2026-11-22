// Transição do plugin PWA anterior. Nunca limpar storage/cache de forma indiscriminada.
export function retireLegacyCredentials(storage) {
  try {
    for (const key of ['access', 'user', 'manualLogout']) storage?.removeItem(key)
  } catch { /* Storage pode estar bloqueado; não dependemos dele para autenticar. */ }
}

function knownWorker(value, origin) {
  if (!value) return false
  const url = new URL(value, origin)
  return url.origin === origin && ['/sw.js', '/dev-sw.js'].includes(url.pathname)
}

export async function retireLegacyCaches({ cacheStorage = globalThis.caches } = {}) {
  if (!cacheStorage) return
  const legacyCaches = new Set(['api-cache', 'google-fonts-cache', 'gstatic-fonts-cache'])
  try {
    const names = await cacheStorage.keys()
    await Promise.all(names.filter((name) => legacyCaches.has(name)).map((name) => cacheStorage.delete(name)))
  } catch { /* CacheStorage pode estar indisponível em contextos restritos. */ }
}

export async function retireLegacyPwa({
  origin = globalThis.location.origin,
  serviceWorker = globalThis.navigator?.serviceWorker,
  cacheStorage = globalThis.caches,
} = {}) {
  const registrations = await serviceWorker?.getRegistrations() || []
  let removed = false
  for (const registration of registrations) {
    const worker = registration.active || registration.waiting || registration.installing
    if (registration.scope === `${origin}/` && knownWorker(worker?.scriptURL, origin)) {
      if (!await registration.unregister()) throw new Error('Não foi possível retirar o service worker antigo.')
      removed = true
    }
  }
  const ownedCaches = new Set([
    'api-cache', 'google-fonts-cache', 'gstatic-fonts-cache',
    `workbox-precache-v2-${origin}/`,
  ])
  if (cacheStorage) {
    const names = await cacheStorage.keys()
    await Promise.all(names.filter((name) => ownedCaches.has(name)).map((name) => cacheStorage.delete(name)))
  }
  return removed && knownWorker(serviceWorker?.controller?.scriptURL, origin)
}
