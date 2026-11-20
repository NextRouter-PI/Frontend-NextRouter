<script setup>
import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { state } from '@/stores/state'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import L from 'leaflet'
import { attachThemedTileLayer, createPinIcon, DEFAULT_MAP_CENTER } from '@/utils/leafletTiles'

const props = defineProps({
  selfMarkerLabel: { type: String, default: 'Você' },
  trackingMarkerLabel: { type: String, default: 'Motorista' },
  trackingMarkerIcon: { type: String, default: 'mdi-bus' },
})

const { state: tracking } = useTravelTracking()

const mapContainer = ref(null)
let map = null
let trackingMarker = null
let cleanupTiles = null

function initialCenter() {
  if (state.user?.latitude != null && state.user?.longitude != null) {
    return [state.user.latitude, state.user.longitude]
  }
  return DEFAULT_MAP_CENTER
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
}

watch(
  () => [tracking.latitude, tracking.longitude],
  ([lat, lng]) => {
    if (!map || lat == null || lng == null) return

    if (!trackingMarker) {
      trackingMarker = L.marker([lat, lng], {
        icon: createPinIcon({ icon: props.trackingMarkerIcon, pulse: true }),
      })
        .addTo(map)
        .bindPopup(props.trackingMarkerLabel)
    } else {
      trackingMarker.setLatLng([lat, lng])
    }

    map.panTo([lat, lng])
  },
)

watch(
  () => tracking.tracking,
  (isTracking) => {
    if (!isTracking && trackingMarker && map) {
      map.removeLayer(trackingMarker)
      trackingMarker = null
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
