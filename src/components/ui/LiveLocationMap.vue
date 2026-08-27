<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useTravelTracking } from '@/composables/useTravelTracking'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = [-26.3044, -48.8455] // Joinville, SC

const TILE_URLS = {
  light: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
}
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'

function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

const props = defineProps({
  travelId: { type: [Number, String], default: null },
  autoStartViewer: { type: Boolean, default: false },
  markerLabel: { type: String, default: 'Motorista' },
})

const { state: tracking, startViewerTracking } = useTravelTracking()

const mapContainer = ref(null)
let map = null
let marker = null
let tileLayer = null
let themeObserver = null

function applyTileLayer(theme) {
  if (!map) return
  if (tileLayer) map.removeLayer(tileLayer)
  tileLayer = L.tileLayer(TILE_URLS[theme], {
    maxZoom: 18,
    maxNativeZoom: 16,
    attribution: TILE_ATTRIBUTION,
  }).addTo(map)
}

function ensureMap() {
  if (map || !mapContainer.value) return

  const center =
    tracking.latitude != null && tracking.longitude != null
      ? [tracking.latitude, tracking.longitude]
      : DEFAULT_CENTER

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: true,
    dragging: true,
    scrollWheelZoom: false,
  }).setView(center, 14)

  applyTileLayer(currentTheme())

  if (tracking.latitude != null && tracking.longitude != null) {
    marker = L.marker(center).addTo(map).bindPopup(props.markerLabel)
  }

  themeObserver = new MutationObserver(() => applyTileLayer(currentTheme()))
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

watch(
  () => [tracking.latitude, tracking.longitude],
  ([lat, lng]) => {
    if (!map || lat == null || lng == null) return

    if (!marker) {
      marker = L.marker([lat, lng]).addTo(map).bindPopup(props.markerLabel)
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
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="live-map-wrap">
    <div ref="mapContainer" class="live-map"></div>
    <p v-if="tracking.latitude == null" class="live-map-empty">Aguardando localização em tempo real...</p>
  </div>
</template>

<style scoped>
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
  background: var(--superfice);
}
</style>

<style>
.dark .live-map-wrap .leaflet-control-attribution {
  background: rgba(0, 0, 0, 0.45);
  color: #ccc;
}

.dark .live-map-wrap .leaflet-control-attribution a {
  color: #ddd;
}

.live-map-wrap .leaflet-control-attribution {
  font-size: 9px;
}
</style>
