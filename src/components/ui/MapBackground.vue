<script setup>
import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { state } from '@/stores/state'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import L from 'leaflet'
import { attachThemedTileLayer, createPinIcon, DEFAULT_MAP_CENTER } from '@/utils/leafletTiles'
import { pointLatLng } from '@/features/transport/composables/useRouteSnapshotMap'

const props = defineProps({
  selfMarkerLabel: { type: String, default: 'Você' },
  trackingMarkerLabel: { type: String, default: 'Motorista' },
  trackingMarkerIcon: { type: String, default: 'mdi-bus' },
  snapshot: { type: Object, default: null },
  stops: { type: Array, default: () => [] },
})

const { state: tracking } = useTravelTracking()

const mapContainer = ref(null)
let map = null
let trackingMarker = null
let routeLayer = null
let trailLine = null
let trailCoords = []
let cleanupTiles = null

function initialCenter() {
  if (state.user?.latitude != null && state.user?.longitude != null) {
    return [state.user.latitude, state.user.longitude]
  }
  return DEFAULT_MAP_CENTER
}

function renderPlannedRoute() {
  if (!map) return
  if (routeLayer) routeLayer.clearLayers()
  else routeLayer = L.layerGroup().addTo(map)

  const snapshot = props.snapshot
  if (!snapshot) return
  const bounds = []

  if (snapshot.geometry?.type && Array.isArray(snapshot.geometry.coordinates)) {
    const geo = L.geoJSON(snapshot.geometry, {
      style: { color: '#df801a', weight: 4, opacity: 0.85, className: 'nr-route-animated-dash' },
    }).addTo(routeLayer)
    const b = geo.getBounds()
    if (b.isValid()) bounds.push(b.getSouthWest(), b.getNorthEast())
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

  if (state.user?.latitude != null && state.user?.longitude != null) {
    L.marker([state.user.latitude, state.user.longitude], {
      icon: createPinIcon({ icon: 'mdi-map-marker' }),
    })
      .addTo(map)
      .bindPopup(props.selfMarkerLabel)
  }

  renderPlannedRoute()
}

watch(
  () => [props.snapshot?.id, props.stops?.length],
  () => renderPlannedRoute(),
)

watch(
  () => [tracking.latitude, tracking.longitude],
  ([lat, lng]) => {
    if (!map || lat == null || lng == null) return

    const point = [lat, lng]
    const last = trailCoords[trailCoords.length - 1]
    if (!last || last[0] !== lat || last[1] !== lng) {
      trailCoords.push(point)
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

    if (!trackingMarker) {
      trackingMarker = L.marker(point, {
        icon: createPinIcon({ icon: props.trackingMarkerIcon, pulse: true }),
      })
        .addTo(map)
        .bindPopup(props.trackingMarkerLabel)
    } else {
      trackingMarker.setLatLng(point)
    }

    map.panTo(point)
  },
)

watch(
  () => tracking.tracking,
  (isTracking) => {
    if (!isTracking && map) {
      if (trackingMarker) {
        map.removeLayer(trackingMarker)
        trackingMarker = null
      }
      if (trailLine) {
        map.removeLayer(trailLine)
        trailLine = null
      }
      trailCoords = []
    }
  },
)

onMounted(async () => {
  await nextTick()
  ensureMap()
})

onUnmounted(() => {
  cleanupTiles?.()
  cleanupTiles = null
  if (map) {
    map.remove()
    map = null
    routeLayer = null
    trailLine = null
    trackingMarker = null
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
