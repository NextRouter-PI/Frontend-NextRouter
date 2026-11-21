import { nextTick, onMounted, onUnmounted, watch } from 'vue'
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

export function useDriverMap3D({ mapEl, tracking, getSnapshot, getStops, is3d }) {
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
    const { passed, remaining } = splitPolylineAtPosition(
      plannedCoordsLngLat(), currentBusLngLat?.[1], currentBusLngLat?.[0], { isLngLat: true },
    )
    map.getSource('nr-route-passed')?.setData(makeLineFeature(passed))
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
    if (!isVisible.value) return
    map.easeTo({
      center: nextLngLat,
      bearing: is3d() ? tracking.bearing || 0 : 0,
      pitch: is3d() ? 62 : 0,
      zoom: is3d() ? 17.1 : 15.2,
      duration: 1500,
      easing: (t) => t * (2 - t),
    })
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
    mapCanvas = map.getCanvas()
    mapCanvas?.addEventListener('webglcontextlost', onContextLost)

    map.on('style.load', () => {
      styleReady = true
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
  watch(is3d, (mode3d) => {
    map?.easeTo({ pitch: mode3d ? 62 : 0, bearing: mode3d ? tracking.bearing || 0 : 0, zoom: mode3d ? 17.1 : 15, duration: 600 })
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
}
