import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import * as maplibregl from 'maplibre-gl'
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

export function useDriverMap3D({ mapEl, tracking, getSnapshot, getStops, is3d }) {
  let map = null
  let busMarker = null
  const stopMarkers = []
  let styleReady = false
  let themeObserver = null
  let stopAnim = null
  let currentBusLngLat = null

  function plannedCoordsLngLat() {
    const raw = getSnapshot()?.geometry?.coordinates
    return Array.isArray(raw) && raw.length >= 2 ? raw.map(([lng, lat]) => [Number(lng), Number(lat)]) : []
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
      plannedCoordsLngLat(),
      currentBusLngLat?.[1],
      currentBusLngLat?.[0],
      { isLngLat: true },
    )
    map.getSource('nr-route-passed')?.setData(makeLineFeature(passed))
    map.getSource('nr-route-remaining')?.setData(makeLineFeature(remaining))
  }

  function animateBusTo(nextLngLat) {
    if (!map) return
    if (!busMarker) {
      busMarker = new maplibregl.Marker({
        element: createNavPuckElement(),
        rotationAlignment: 'viewport',
        pitchAlignment: 'map',
      })
        .setLngLat(nextLngLat)
        .addTo(map)
      currentBusLngLat = nextLngLat
    } else {
      stopAnim?.()
      stopAnim = animateLngLatMarker({
        startLngLat: currentBusLngLat || nextLngLat,
        nextLngLat,
        duration: 1700,
        onStep: (pos) => {
          currentBusLngLat = pos
          busMarker?.setLngLat(pos)
        },
        onDone: () => {
          stopAnim = null
        },
      })
    }

    updateRouteGeometry()
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
    map = new maplibregl.Map({
      container: mapEl.value,
      style: MAPLIBRE_STYLE_URLS[currentDocumentTheme()],
      center: initialCenterLngLat(),
      zoom: is3d() ? 16.5 : 14.5,
      pitch: is3d() ? 62 : 0,
      bearing: is3d() ? tracking.bearing || 0 : 0,
      attributionControl: false,
    })

    map.on('style.load', () => {
      styleReady = true
      ensureDriverRouteLayers(map)
      updateRouteGeometry()
      renderStopMarkers()
    })

    if (tracking.longitude != null && tracking.latitude != null) {
      animateBusTo([tracking.longitude, tracking.latitude])
    }

    themeObserver = new MutationObserver(() => {
      if (!map) return
      styleReady = false
      map.setStyle(MAPLIBRE_STYLE_URLS[currentDocumentTheme()])
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  }

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
    themeObserver?.disconnect()
    themeObserver = null
    for (const m of stopMarkers) m.remove()
    stopMarkers.length = 0
    busMarker?.remove()
    busMarker = null
    map?.remove()
    map = null
  })
}
