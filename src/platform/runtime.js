/**
 * Camada de isolamento de runtime para suportar Web padrão e futuro empacotamento
 * Android via Tauri v2 (Modelo B — WebView apontando para o frontend HTTPS servido
 * em mesma origem pelo Django), sem acoplar composables de domínio à plataforma.
 */

export function isTauriRuntime() {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__)
}

export function getPlatformGeolocation() {
  const nativeBridge = typeof window !== 'undefined' ? window.__NEXTROUTER_NATIVE_GEO__ : null
  if (nativeBridge && typeof nativeBridge.watchPosition === 'function' && typeof nativeBridge.clearWatch === 'function') {
    return {
      isSupported: () => true,
      watchPosition: (onSuccess, onError, options) => nativeBridge.watchPosition(onSuccess, onError, options),
      clearWatch: (watchId) => nativeBridge.clearWatch(watchId),
    }
  }

  const webGeo = typeof navigator !== 'undefined' ? navigator.geolocation : null
  return {
    isSupported: () => Boolean(webGeo),
    watchPosition: (onSuccess, onError, options) => webGeo.watchPosition(onSuccess, onError, options),
    clearWatch: (watchId) => webGeo?.clearWatch(watchId),
  }
}
