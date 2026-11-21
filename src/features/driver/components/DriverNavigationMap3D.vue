<script setup>
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import { pointLatLng } from '@/features/transport/composables/useRouteSnapshotMap'
import { haversineMeters } from '@/utils/geo'

const props = defineProps({
  snapshot: { type: Object, default: null },
  stops: { type: Array, default: () => [] },
  is3d: { type: Boolean, default: true },
})

const { state: tracking } = useTravelTracking()

const mapEl = ref(null)
let map = null
let busMarker = null
let stopMarkers = []
let styleReady = false
let themeObserver = null
let animFrame = null
let currentBusLngLat = null

const STYLE_URLS = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function plannedCoordsLngLat() {
  const raw = props.snapshot?.geometry?.coordinates
  if (!Array.isArray(raw) || raw.length < 2) return []
  return raw.map(([lng, lat]) => [Number(lng), Number(lat)])
}

function initialCenterLngLat() {
  if (tracking.longitude != null && tracking.latitude != null) {
    return [tracking.longitude, tracking.latitude]
  }
  const coords = plannedCoordsLngLat()
  if (coords.length) return coords[0]
  return [-48.8455, -26.3044]
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function createNavPuckElement() {
  const el = document.createElement('div')
  el.className = 'gps-nav-puck'
  el.innerHTML = `
    <div class="gps-nav-puck__halo"></div>
    <div class="gps-nav-puck__core">
      <span class="mdi mdi-navigation" aria-hidden="true"></span>
    </div>
  `
  return el
}

function createStopMarkerElement({ variant = 'primary', icon = 'mdi-map-marker', label = '', avatarUrl = '', avatarAlt = '' }) {
  const el = document.createElement('div')
  el.className = `nr-map-pin nr-map-pin--${variant} nr-map-pin--sm${avatarUrl ? ' nr-map-pin--avatar' : ''}`
  const inner = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(avatarAlt)}" class="nr-map-pin__avatar" />`
    : label
      ? `<span class="nr-map-pin__label">${escapeHtml(label)}</span>`
      : `<span class="mdi ${icon}" aria-hidden="true"></span>`
  el.innerHTML = `<span class="nr-map-pin__body">${inner}</span>`
  return el
}

function clearStopMarkers() {
  for (const m of stopMarkers) m.remove()
  stopMarkers = []
}

function renderStopMarkers() {
  if (!map) return
  clearStopMarkers()
  const snap = props.snapshot
  if (!snap) return

  const origin = pointLatLng(snap.origin)
  if (origin) {
    const marker = new maplibregl.Marker({
      element: createStopMarkerElement({ variant: 'success', icon: 'mdi-flag-outline' }),
      anchor: 'bottom',
    })
      .setLngLat([origin[1], origin[0]])
      .addTo(map)
    stopMarkers.push(marker)
  }

  for (const stop of props.stops || []) {
    const pt = pointLatLng(stop.point_snapshot)
    if (!pt) continue
    const handled = stop.state === 'handled' || stop.state === 'completed'
    const firstPassenger = (stop.participants || []).find((p) => p.profile_picture_url || p.passenger_name)
    const marker = new maplibregl.Marker({
      element: createStopMarkerElement({
        variant: handled ? 'success' : 'primary',
        label: firstPassenger?.profile_picture_url ? '' : String(stop.position ?? ''),
        avatarUrl: firstPassenger?.profile_picture_url || '',
        avatarAlt: firstPassenger?.passenger_name || `Parada #${stop.position}`,
      }),
      anchor: 'bottom',
    })
      .setLngLat([pt[1], pt[0]])
      .addTo(map)
    stopMarkers.push(marker)
  }

  const dest = pointLatLng(snap.destination)
  if (dest) {
    const marker = new maplibregl.Marker({
      element: createStopMarkerElement({ variant: 'danger', icon: 'mdi-flag-checkered' }),
      anchor: 'bottom',
    })
      .setLngLat([dest[1], dest[0]])
      .addTo(map)
    stopMarkers.push(marker)
  }
}

function splitRouteAtBus(coords, busLngLat) {
  if (!busLngLat || coords.length < 2) {
    return { passed: [], remaining: coords }
  }
  let closestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < coords.length; i += 1) {
    const d = haversineMeters(busLngLat[1], busLngLat[0], coords[i][1], coords[i][0])
    if (d < bestDist) {
      bestDist = d
      closestIdx = i
    }
  }
  return {
    passed: coords.slice(0, closestIdx + 1),
    remaining: coords.slice(closestIdx),
  }
}

function makeLineFeature(coords) {
  if (!coords || coords.length < 2) {
    return { type: 'FeatureCollection', features: [] }
  }
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }],
  }
}

function ensureRouteLayers() {
  if (!map || !styleReady) return
  if (!map.getSource('nr-route-passed')) {
    map.addSource('nr-route-passed', { type: 'geojson', data: makeLineFeature([]) })
    map.addLayer({
      id: 'nr-route-passed-line',
      type: 'line',
      source: 'nr-route-passed',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#71717a', 'line-width': 6, 'line-opacity': 0.5 },
    })
  }
  if (!map.getSource('nr-route-remaining')) {
    map.addSource('nr-route-remaining', { type: 'geojson', data: makeLineFeature([]) })
    map.addLayer({
      id: 'nr-route-remaining-casing',
      type: 'line',
      source: 'nr-route-remaining',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#18181b', 'line-width': 11, 'line-opacity': 0.75 },
    })
    map.addLayer({
      id: 'nr-route-remaining-line',
      type: 'line',
      source: 'nr-route-remaining',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#ec8314', 'line-width': 7, 'line-opacity': 0.96 },
    })
  }
}

function updateRouteGeometry() {
  if (!map || !styleReady) return
  ensureRouteLayers()
  const coords = plannedCoordsLngLat()
  const { passed, remaining } = splitRouteAtBus(coords, currentBusLngLat)
  map.getSource('nr-route-passed')?.setData(makeLineFeature(passed))
  map.getSource('nr-route-remaining')?.setData(makeLineFeature(remaining))
}

function cancelBusAnim() {
  if (animFrame) {
    cancelAnimationFrame(animFrame)
    animFrame = null
  }
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
    const startLngLat = currentBusLngLat || nextLngLat
    cancelBusAnim()
    const start = performance.now()
    const duration = 1700
    function step(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = t * (2 - t)
      const lng = startLngLat[0] + (nextLngLat[0] - startLngLat[0]) * eased
      const lat = startLngLat[1] + (nextLngLat[1] - startLngLat[1]) * eased
      currentBusLngLat = [lng, lat]
      busMarker?.setLngLat(currentBusLngLat)
      if (t < 1) {
        animFrame = requestAnimationFrame(step)
      } else {
        animFrame = null
      }
    }
    animFrame = requestAnimationFrame(step)
  }

  updateRouteGeometry()
  map.easeTo({
    center: nextLngLat,
    bearing: props.is3d ? tracking.bearing || 0 : 0,
    pitch: props.is3d ? 62 : 0,
    zoom: props.is3d ? 17.1 : 15.2,
    duration: 1500,
    easing: (t) => t * (2 - t),
  })
}

function initMap() {
  if (map || !mapEl.value) return
  map = new maplibregl.Map({
    container: mapEl.value,
    style: STYLE_URLS[currentTheme()],
    center: initialCenterLngLat(),
    zoom: props.is3d ? 16.5 : 14.5,
    pitch: props.is3d ? 62 : 0,
    bearing: props.is3d ? tracking.bearing || 0 : 0,
    attributionControl: false,
  })

  map.on('style.load', () => {
    styleReady = true
    ensureRouteLayers()
    updateRouteGeometry()
    renderStopMarkers()
  })

  if (tracking.longitude != null && tracking.latitude != null) {
    animateBusTo([tracking.longitude, tracking.latitude])
  }

  themeObserver = new MutationObserver(() => {
    if (!map) return
    styleReady = false
    map.setStyle(STYLE_URLS[currentTheme()])
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

watch(
  () => [props.snapshot?.id, props.stops?.length],
  () => {
    updateRouteGeometry()
    renderStopMarkers()
  },
)

watch(
  () => props.is3d,
  (mode3d) => {
    if (!map) return
    map.easeTo({
      pitch: mode3d ? 62 : 0,
      bearing: mode3d ? tracking.bearing || 0 : 0,
      zoom: mode3d ? 17.1 : 15,
      duration: 600,
    })
  },
)

watch(
  () => [tracking.latitude, tracking.longitude],
  ([lat, lng]) => {
    if (!map || lat == null || lng == null) return
    animateBusTo([lng, lat])
  },
)

onMounted(async () => {
  await nextTick()
  initMap()
})

onUnmounted(() => {
  cancelBusAnim()
  themeObserver?.disconnect()
  themeObserver = null
  clearStopMarkers()
  if (busMarker) {
    busMarker.remove()
    busMarker = null
  }
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div ref="mapEl" class="driver-gps-map"></div>
</template>

<style lang="scss" scoped>
.driver-gps-map {
  position: fixed;
  inset: 0;
  z-index: 0;
}

:deep(.gps-nav-puck) {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.gps-nav-puck__halo) {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(236, 131, 20, 0.28);
  animation: gps-puck-pulse 1.8s ease-out infinite;
}

:deep(.gps-nav-puck__core) {
  position: relative;
  z-index: 1;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #ec8314;
  color: #ffffff;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

@keyframes gps-puck-pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.9);
    opacity: 0;
  }
}
</style>
