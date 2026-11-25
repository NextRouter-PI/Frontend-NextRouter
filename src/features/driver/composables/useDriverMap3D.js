import { nextTick, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import * as maplibregl from 'maplibre-gl'
import { usePageVisibility } from '@/composables/usePageVisibility'
import { splitPolylineAtPosition } from '@/utils/geo'
import { animateLngLatMarker } from '@/utils/mapAnimation'
import {
  MAPLIBRE_STYLE_URLS,
  createNavPuckElement,
  currentDocumentTheme,
  ensureDriverRouteLayers,
  makeLineFeature,
  renderDriverStopMarkers,
} from '@/features/driver/utils/mapLibreLayers'

const onContextLost = (event) => event.preventDefault()

export function useDriverMap3D({ mapEl, tracking, getSnapshot, getStops, is3d, getApproach, getNextStop }) {
  const { isVisible } = usePageVisibility()
  let map = null
  let busMarker = null
  let mapCanvas = null
  let styleReady = false
  let themeObserver = null
  let stopAnim = null
  let currentBusLngLat = null
  let cachedSnapshotRef = null
  let cachedPlannedCoords = []
  const stopMarkers = []
  // Câmera segue o motorista; ao arrastar/girar o mapa para de seguir até "recentralizar".
  const following = shallowRef(true)

  function followCamera(lngLat, duration = 1500) {
    map?.easeTo({
      center: lngLat,
      bearing: is3d() ? tracking.bearing || 0 : 0,
      pitch: is3d() ? 62 : 0,
      zoom: is3d() ? 17.1 : 15.2,
      duration,
      easing: (t) => t * (2 - t),
    })
  }

  function recenter() {
    following.value = true
    const target = currentBusLngLat || initialCenterLngLat()
    followCamera(target, 700)
  }

  function plannedCoordsLngLat() {
    const snap = getSnapshot()
    if (snap === cachedSnapshotRef) return cachedPlannedCoords
    cachedSnapshotRef = snap
    const raw = snap?.geometry?.coordinates
    cachedPlannedCoords = Array.isArray(raw) && raw.length >= 2 ? raw.map(([lng, lat]) => [Number(lng), Number(lat)]) : []
    return cachedPlannedCoords
  }

  function initialCenterLngLat() {
    if (tracking.longitude != null && tracking.latitude != null) return [tracking.longitude, tracking.latitude]
    const coords = plannedCoordsLngLat()
    return coords.length ? coords[0] : [-48.8455, -26.3044]
  }

  function renderStopMarkers() {
    renderDriverStopMarkers({ map, snapshot: getSnapshot(), stops: getStops(), stopMarkers })
  }

  function updateRouteGeometry() {
    if (!map || !styleReady) return
    ensureDriverRouteLayers(map)
    const legs = getApproach?.()
    let passed
    let remaining
    let later = []
    if (legs?.length) {
      // Laranja: da posição do motorista até a próxima casa. Preto: as casas seguintes até o fim.
      passed = []
      remaining = splitPolylineAtPosition(legs[0], currentBusLngLat?.[1], currentBusLngLat?.[0], { isLngLat: true })
        .remaining
      later = legs.slice(1).flatMap((leg, index) => (index ? leg.slice(1) : leg))
    } else {
      // Sem trajeto ao vivo (GPS desligado ou serviço de rotas fora): usa o percurso planejado,
      // laranja até a próxima parada e preto depois dela.
      ;({ passed, remaining } = splitPolylineAtPosition(
        plannedCoordsLngLat(), currentBusLngLat?.[1], currentBusLngLat?.[0], { isLngLat: true },
      ))
      const pt = getNextStop?.()?.point_snapshot
      if (pt?.latitude != null && pt?.longitude != null && remaining.length >= 2) {
        const split = splitPolylineAtPosition(remaining, Number(pt.latitude), Number(pt.longitude), { isLngLat: true })
        remaining = split.passed
        later = split.remaining
      }
    }
    map.getSource('nr-route-passed')?.setData(makeLineFeature(passed))
    map.getSource('nr-route-later')?.setData(makeLineFeature(later))
    map.getSource('nr-route-remaining')?.setData(makeLineFeature(remaining))
  }

  function animateBusTo(nextLngLat) {
    if (!map) return
    if (!busMarker) {
      busMarker = new maplibregl.Marker({
        element: createNavPuckElement(), rotationAlignment: 'viewport', pitchAlignment: 'map',
      }).setLngLat(nextLngLat).addTo(map)
      currentBusLngLat = nextLngLat
    } else if (!isVisible.value) {
      stopAnim?.()
      stopAnim = null
      currentBusLngLat = nextLngLat
      busMarker.setLngLat(nextLngLat)
    } else {
      stopAnim?.()
      stopAnim = animateLngLatMarker({
        startLngLat: currentBusLngLat || nextLngLat, nextLngLat, duration: 1700,
        onStep: (pos) => { currentBusLngLat = pos; busMarker?.setLngLat(pos) },
        onDone: () => { stopAnim = null },
      })
    }

    updateRouteGeometry()
    if (!isVisible.value || !following.value) return
    followCamera(nextLngLat)
  }

  function initMap() {
    if (map || !mapEl.value) return
    try {
      map = new maplibregl.Map({
        container: mapEl.value,
        style: MAPLIBRE_STYLE_URLS[currentDocumentTheme()],
        center: initialCenterLngLat(),
        zoom: is3d() ? 16.5 : 14.5,
        pitch: is3d() ? 62 : 0,
        bearing: is3d() ? tracking.bearing || 0 : 0,
        attributionControl: false,
      })
    } catch {
      map = null
      return
    }
    // Só gestos do usuário (têm originalEvent) soltam a câmera; os easeTo do próprio app não.
    const release = (event) => {
      if (event.originalEvent) following.value = false
    }
    map.on('dragstart', release)
    map.on('rotatestart', release)
    map.on('pitchstart', release)
    map.on('zoomstart', release)
    mapCanvas = map.getCanvas()
    mapCanvas?.addEventListener('webglcontextlost', onContextLost)

    map.on('style.load', () => {
      styleReady = true
      // Tema claro: fundo branco puro (o Positron vem levemente acinzentado).
      if (currentDocumentTheme() === 'light' && map.getLayer('background')) {
        map.setPaintProperty('background', 'background-color', '#ffffff')
      }
      // Menos detalhe para dirigir: sem o contorno de cada prédio.
      for (const layer of map.getStyle().layers || []) {
        if (layer['source-layer'] === 'building') map.setLayoutProperty(layer.id, 'visibility', 'none')
      }
      ensureDriverRouteLayers(map)
      updateRouteGeometry()
      renderStopMarkers()
    })

    if (tracking.longitude != null && tracking.latitude != null) animateBusTo([tracking.longitude, tracking.latitude])

    themeObserver = new MutationObserver(() => {
      if (!map) return
      styleReady = false
      map.setStyle(MAPLIBRE_STYLE_URLS[currentDocumentTheme()])
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  }

  watch(isVisible, (visible) => {
    if (!visible) { stopAnim?.(); stopAnim = null }
  })
  watch(() => [getSnapshot()?.id, getStops()?.length], () => { updateRouteGeometry(); renderStopMarkers() })
  watch(() => [getApproach?.(), getNextStop?.()?.id], updateRouteGeometry)
  watch(is3d, (mode3d) => {
    if (following.value && currentBusLngLat) return followCamera(currentBusLngLat, 600)
    map?.easeTo({ pitch: mode3d ? 62 : 0, bearing: mode3d ? tracking.bearing || 0 : 0, duration: 600 })
  })
  watch(() => [tracking.latitude, tracking.longitude], ([lat, lng]) => {
    if (map && lat != null && lng != null) animateBusTo([lng, lat])
  })

  onMounted(async () => { await nextTick(); initMap() })
  onUnmounted(() => {
    stopAnim?.()
    mapCanvas?.removeEventListener('webglcontextlost', onContextLost)
    themeObserver?.disconnect()
    for (const m of stopMarkers) m.remove()
    stopMarkers.length = 0
    busMarker?.remove()
    map?.remove()
    map = busMarker = mapCanvas = themeObserver = stopAnim = null
  })

  return { following, recenter }
}
