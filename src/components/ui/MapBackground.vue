<script setup>
import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { state } from '@/stores/state'
import { useTravelTracking } from '@/composables/useTravelTracking'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

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
  selfMarkerLabel: { type: String, default: 'Você' },
  trackingMarkerLabel: { type: String, default: 'Motorista' },
  trackingMarkerIcon: { type: String, default: 'mdi-bus' },
})

const { state: tracking } = useTravelTracking()

const mapContainer = ref(null)
let map = null
let selfMarker = null
let trackingMarker = null
let tileLayer = null
let themeObserver = null

function initialCenter() {
  if (state.user?.latitude != null && state.user?.longitude != null) {
    return [state.user.latitude, state.user.longitude]
  }
  return DEFAULT_CENTER
}

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
  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: true,
  }).setView(initialCenter(), 14)

  applyTileLayer(currentTheme())

  if (state.user?.latitude != null && state.user?.longitude != null) {
    selfMarker = L.marker([state.user.latitude, state.user.longitude])
      .addTo(map)
      .bindPopup(props.selfMarkerLabel)
  }

  themeObserver = new MutationObserver(() => applyTileLayer(currentTheme()))
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

watch(
  () => [tracking.latitude, tracking.longitude],
  ([lat, lng]) => {
    if (!map || lat == null || lng == null) return

    if (!trackingMarker) {
      trackingMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'map-tracking-marker',
          html: `<span class="mdi ${props.trackingMarkerIcon}"></span>`,
          iconSize: [32, 32],
        }),
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
  <div ref="mapContainer" class="map-background"></div>
</template>

<style scoped>
.map-background {
  position: fixed;
  inset: 0;
  z-index: 0;
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

<style>
/* Não escopado: o Leaflet injeta o marcador fora da árvore de templates do Vue. */
.map-tracking-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary, #df801a);
  color: #fff;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  border: 2px solid #fff;
}

.leaflet-control-attribution {
  font-size: 9px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
}

.dark .leaflet-control-attribution {
  background: rgba(0, 0, 0, 0.45);
  color: #ccc;
}

.dark .leaflet-control-attribution a {
  color: #ddd;
}
</style>
