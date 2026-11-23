<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import { attachThemedTileLayer, createPinIcon, DEFAULT_MAP_CENTER } from '@/utils/leafletTiles'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'

const props = defineProps({
  travelId: { type: [Number, String], default: null },
  autoStartViewer: { type: Boolean, default: false },
  markerLabel: { type: String, default: 'Motorista' },
})

const { state: tracking, startViewerTracking } = useTravelTracking()

const mapContainer = ref(null)
let map = null
let marker = null
let cleanupTiles = null

function createTrackingMarker(coords) {
  return L.marker(coords, {
    icon: createPinIcon({ icon: 'mdi-bus', pulse: true }),
  })
    .addTo(map)
    .bindPopup(`<strong>${props.markerLabel}</strong>`)
}

function ensureMap() {
  if (map || !mapContainer.value) return

  const center =
    tracking.latitude != null && tracking.longitude != null
      ? [tracking.latitude, tracking.longitude]
      : DEFAULT_MAP_CENTER

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: true,
    dragging: true,
    scrollWheelZoom: false,
  }).setView(center, 14)

  cleanupTiles = attachThemedTileLayer(map)

  if (tracking.latitude != null && tracking.longitude != null) {
    marker = createTrackingMarker(center)
  }
}

watch(
  () => [tracking.latitude, tracking.longitude],
  ([lat, lng]) => {
    if (!map || lat == null || lng == null) return

    if (!marker) {
      marker = createTrackingMarker([lat, lng])
    } else {
      marker.setLatLng([lat, lng])
    }

    map.panTo([lat, lng])
  },
)

onMounted(async () => {
  if (props.autoStartViewer && props.travelId) {
    startViewerTracking(props.travelId)
  }
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
  <div class="live-map-wrap">
    <div ref="mapContainer" class="live-map"></div>
    <p v-if="tracking.latitude == null" class="live-map-empty">
      {{ tracking.error || 'Posição ainda não informada para esta viagem.' }}
    </p>
    <p v-else-if="tracking.stale" class="live-map-status">
      Última posição conhecida (desatualizada). O rastreamento contínuo em segundo plano não é garantido.
    </p>
    <p v-if="tracking.error && tracking.latitude != null" class="live-map-status error" role="alert">
      {{ tracking.error }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.live-map-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border, rgba(223, 128, 26, 0.12));
}

.live-map {
  width: 100%;
  height: 200px;
  background: var(--bg);
}

.live-map-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 16px;
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-muted);
  background: var(--color-surface);
}

.live-map-status {
  margin: 0;
  padding: 8px 12px;
  font-size: 0.78rem;
  color: var(--text-muted);
  background: var(--color-surface);
  border-top: 1px solid var(--border, rgba(223, 128, 26, 0.12));
}

.live-map-status.error {
  color: var(--danger, var(--danger));
}
</style>
