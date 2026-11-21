<script setup>
import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { state } from '@/stores/state'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import L from 'leaflet'
import { attachThemedTileLayer, createPinIcon, DEFAULT_MAP_CENTER } from '@/utils/leafletTiles'
import { pointLatLng } from '@/features/transport/composables/useRouteSnapshotMap'
import { haversineMeters } from '@/utils/geo'

const props = defineProps({
  selfMarkerLabel: { type: String, default: 'Você' },
  trackingMarkerLabel: { type: String, default: 'Motorista' },
  trackingMarkerIcon: { type: String, default: 'mdi-bus' },
  snapshot: { type: Object, default: null },
  stops: { type: Array, default: () => [] },
  targetPoint: { type: Object, default: null },
})

const { state: tracking } = useTravelTracking()

const mapContainer = ref(null)
let map = null
let trackingMarker = null
let targetMarker = null
let routeLayer = null
let passedLine = null
let remainingLine = null
let trailLine = null
let trailCoords = []
let cleanupTiles = null
let animFrame = null
let lastRenderedPos = null

function cancelMarkerAnim() {
  if (animFrame) {
    cancelAnimationFrame(animFrame)
    animFrame = null
  }
}

function initialCenter() {
  const target = pointLatLng(props.targetPoint)
  if (target) return target
  if (state.user?.latitude != null && state.user?.longitude != null) {
    return [state.user.latitude, state.user.longitude]
  }
  return DEFAULT_MAP_CENTER
}

function plannedCoordsLatLng() {
  const raw = props.snapshot?.geometry?.coordinates
  if (!Array.isArray(raw) || raw.length < 2) return []
  return raw.map(([lng, lat]) => [lat, lng])
}

function updateConsumedRoute(busPos) {
  if (!map) return
  const coords = plannedCoordsLatLng()
  if (!coords.length) return

  let closestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < coords.length; i += 1) {
    const d = haversineMeters(busPos[0], busPos[1], coords[i][0], coords[i][1])
    if (d < bestDist) {
      bestDist = d
      closestIdx = i
    }
  }

  const passed = coords.slice(0, closestIdx + 1)
  const remaining = coords.slice(closestIdx)

  if (passedLine) map.removeLayer(passedLine)
  if (remainingLine) map.removeLayer(remainingLine)

  if (passed.length >= 2) {
    passedLine = L.polyline(passed, {
      color: '#71717a',
      weight: 4,
      opacity: 0.45,
    }).addTo(map)
  }
  if (remaining.length >= 2) {
    remainingLine = L.polyline(remaining, {
      color: '#df801a',
      weight: 5,
      opacity: 0.92,
      className: 'nr-route-animated-dash',
    }).addTo(map)
  }
}

function renderTargetMarker() {
  if (!map) return
  if (targetMarker) {
    map.removeLayer(targetMarker)
    targetMarker = null
  }
  const target = pointLatLng(props.targetPoint)
  if (!target) return
  targetMarker = L.marker(target, {
    icon: createPinIcon({ variant: 'success', icon: 'mdi-map-marker-account', size: 'md' }),
  })
    .addTo(map)
    .bindPopup(props.targetPoint?.name || props.selfMarkerLabel)
}

function renderPlannedRoute() {
  if (!map) return
  if (routeLayer) routeLayer.clearLayers()
  else routeLayer = L.layerGroup().addTo(map)

  const snapshot = props.snapshot
  if (!snapshot) return
  const bounds = []

  const coords = plannedCoordsLatLng()
  if (coords.length >= 2 && tracking.latitude == null) {
    if (remainingLine) map.removeLayer(remainingLine)
    remainingLine = L.polyline(coords, {
      color: '#df801a',
      weight: 4,
      opacity: 0.85,
      className: 'nr-route-animated-dash',
    }).addTo(map)
    for (const pt of coords) bounds.push(pt)
  }

  const originCoord = pointLatLng(snapshot.origin)
  if (originCoord) {
    bounds.push(originCoord)
    L.marker(originCoord, {
      icon: createPinIcon({ variant: 'success', icon: 'mdi-flag-outline', size: 'sm' }),
    }).addTo(routeLayer)
  }

  for (const stop of props.stops || []) {
    const coord = pointLatLng(stop.point_snapshot)
    if (!coord) continue
    bounds.push(coord)
    const firstPassenger = (stop.participants || []).find((p) => p.profile_picture_url || p.passenger_name)
    L.marker(coord, {
      icon: createPinIcon({
        variant: stop.state === 'handled' || stop.state === 'completed' ? 'success' : 'primary',
        label: firstPassenger?.profile_picture_url ? '' : String(stop.position ?? ''),
        avatarUrl: firstPassenger?.profile_picture_url || '',
        avatarAlt: firstPassenger?.passenger_name || `Parada #${stop.position}`,
        size: 'sm',
      }),
    }).addTo(routeLayer)
  }

  const destCoord = pointLatLng(snapshot.destination)
  if (destCoord) {
    bounds.push(destCoord)
    L.marker(destCoord, {
      icon: createPinIcon({ variant: 'danger', icon: 'mdi-flag-checkered', size: 'sm' }),
    }).addTo(routeLayer)
  }

  if (bounds.length >= 2 && tracking.latitude == null) {
    map.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 15 })
  }
}

function animateMarkerTo(fromPos, toPos, durationMs = 1800) {
  cancelMarkerAnim()
  const start = performance.now()
  function frame(now) {
    const t = Math.min(1, (now - start) / durationMs)
    const eased = t * (2 - t)
    const lat = fromPos[0] + (toPos[0] - fromPos[0]) * eased
    const lng = fromPos[1] + (toPos[1] - fromPos[1]) * eased
    trackingMarker?.setLatLng([lat, lng])
    lastRenderedPos = [lat, lng]
    if (t < 1) {
      animFrame = requestAnimationFrame(frame)
    } else {
      animFrame = null
      lastRenderedPos = toPos
    }
  }
  animFrame = requestAnimationFrame(frame)
}

function frameViewport(busPos) {
  if (!map) return
  const target = pointLatLng(props.targetPoint)
  if (target) {
    const dist = haversineMeters(busPos[0], busPos[1], target[0], target[1])
    if (dist <= 450) {
      map.setView(busPos, 16, { animate: true })
    } else {
      map.fitBounds(L.latLngBounds([busPos, target]), {
        paddingTopLeft: [48, 80],
        paddingBottomRight: [48, 220],
        maxZoom: 15,
        animate: true,
      })
    }
  } else {
    map.panTo(busPos, { animate: true })
  }
}

function ensureMap() {
  if (map || !mapContainer.value) return
  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: true,
    dragging: false,
    touchZoom: false,
    doubleClickZoom: false,
    scrollWheelZoom: false,
    boxZoom: false,
    keyboard: false,
  }).setView(initialCenter(), 14)

  cleanupTiles = attachThemedTileLayer(map)
  renderTargetMarker()
  renderPlannedRoute()
}

watch(
  () => [props.snapshot?.id, props.stops?.length],
  () => renderPlannedRoute(),
)

watch(
  () => [props.targetPoint?.latitude, props.targetPoint?.longitude],
  () => renderTargetMarker(),
)

watch(
  () => [tracking.latitude, tracking.longitude],
  ([lat, lng]) => {
    if (!map || lat == null || lng == null) return

    const nextPos = [lat, lng]
    const hasPlanned = plannedCoordsLatLng().length >= 2

    if (hasPlanned) {
      updateConsumedRoute(nextPos)
    } else {
      const last = trailCoords[trailCoords.length - 1]
      if (!last || last[0] !== lat || last[1] !== lng) {
        trailCoords.push(nextPos)
        if (!trailLine) {
          trailLine = L.polyline(trailCoords, {
            color: '#df801a',
            weight: 5,
            opacity: 0.92,
            className: 'nr-route-animated-dash',
          }).addTo(map)
        } else {
          trailLine.setLatLngs(trailCoords)
        }
      }
    }

    if (!trackingMarker) {
      trackingMarker = L.marker(nextPos, {
        icon: createPinIcon({ icon: props.trackingMarkerIcon, pulse: true }),
      })
        .addTo(map)
        .bindPopup(props.trackingMarkerLabel)
      lastRenderedPos = nextPos
    } else {
      animateMarkerTo(lastRenderedPos || nextPos, nextPos)
    }

    frameViewport(nextPos)
  },
)

watch(
  () => tracking.tracking,
  (isTracking) => {
    if (!isTracking && map) {
      cancelMarkerAnim()
      if (trackingMarker) {
        map.removeLayer(trackingMarker)
        trackingMarker = null
      }
      if (trailLine) {
        map.removeLayer(trailLine)
        trailLine = null
      }
      trailCoords = []
      lastRenderedPos = null
    }
  },
)

onMounted(async () => {
  await nextTick()
  ensureMap()
})

onUnmounted(() => {
  cancelMarkerAnim()
  cleanupTiles?.()
  cleanupTiles = null
  if (map) {
    map.remove()
    map = null
    routeLayer = null
    passedLine = null
    remainingLine = null
    trailLine = null
    trackingMarker = null
    targetMarker = null
  }
})
</script>

<template>
  <div ref="mapContainer" class="map-background"></div>
</template>

<style lang="scss" scoped>
.map-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.map-background::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.28) 100%);
}

.dark .map-background::after {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.55) 100%);
}
</style>
