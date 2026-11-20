<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = [-26.3044, -48.8455]
const TILE_URLS = {
  light: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
}
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'

function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function pointLatLng(point) {
  if (!point) return null
  const lat = Number(point.latitude)
  const lng = Number(point.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return [lat, lng]
}

const props = defineProps({
  snapshot: { type: Object, default: null },
  stops: { type: Array, default: () => [] },
  title: { type: String, default: 'Traçado e Paradas da Rota' },
  height: { type: String, default: '280px' },
})

const mapContainer = ref(null)
let map = null
let tileLayer = null
let routeLayer = null
let themeObserver = null

const orderedStops = computed(() =>
  [...(props.stops || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
)

const distanceLabel = computed(() => {
  const meters = Number(props.snapshot?.distance_meters)
  if (!Number.isFinite(meters) || meters <= 0) return ''
  return `${(meters / 1000).toFixed(1)} km`
})

const durationLabel = computed(() => {
  const seconds = Number(props.snapshot?.duration_seconds)
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const mins = Math.max(1, Math.round(seconds / 60))
  return `${mins} min`
})

const hasMapData = computed(() => {
  if (props.snapshot?.geometry?.coordinates?.length) return true
  if (pointLatLng(props.snapshot?.origin) || pointLatLng(props.snapshot?.destination)) return true
  return orderedStops.value.some((s) => pointLatLng(s.point_snapshot))
})

function applyTileLayer(theme) {
  if (!map) return
  if (tileLayer) map.removeLayer(tileLayer)
  tileLayer = L.tileLayer(TILE_URLS[theme], {
    maxZoom: 18,
    maxNativeZoom: 16,
    attribution: TILE_ATTRIBUTION,
  }).addTo(map)
}

function renderRoute() {
  if (!map) return
  if (routeLayer) {
    routeLayer.clearLayers()
  } else {
    routeLayer = L.layerGroup().addTo(map)
  }

  const boundsPoints = []

  // 1. Traçado GeoJSON (OSRM) ou linha tracejada entre pontos
  if (props.snapshot?.geometry?.type && Array.isArray(props.snapshot.geometry.coordinates)) {
    const geo = L.geoJSON(props.snapshot.geometry, {
      style: {
        color: '#df801a',
        weight: 4,
        opacity: 0.9,
      },
    }).addTo(routeLayer)
    const geoBounds = geo.getBounds()
    if (geoBounds.isValid()) {
      boundsPoints.push(geoBounds.getSouthWest(), geoBounds.getNorthEast())
    }
  }

  const fallbackCoords = []

  // 2. Origem
  const originCoord = pointLatLng(props.snapshot?.origin)
  if (originCoord) {
    fallbackCoords.push(originCoord)
    boundsPoints.push(originCoord)
    L.circleMarker(originCoord, {
      radius: 8,
      color: '#15803d',
      fillColor: '#22c55e',
      fillOpacity: 0.9,
      weight: 2,
    })
      .bindPopup(`<strong>Origem:</strong> ${props.snapshot.origin.name || 'Início'}`)
      .addTo(routeLayer)
  }

  // 3. Paradas ordenadas
  for (const stop of orderedStops.value) {
    const coord = pointLatLng(stop.point_snapshot)
    if (!coord) continue
    fallbackCoords.push(coord)
    boundsPoints.push(coord)
    const handled = stop.state === 'handled' || stop.state === 'completed'
    L.circleMarker(coord, {
      radius: 7,
      color: handled ? '#15803d' : '#be6c14',
      fillColor: handled ? '#22c55e' : '#f48a1d',
      fillOpacity: 0.9,
      weight: 2,
    })
      .bindTooltip(`#${stop.position}`, { direction: 'top', offset: [0, -6] })
      .bindPopup(
        `<strong>Parada #${stop.position}:</strong> ${stop.point_snapshot?.name || 'Ponto'}<br>Estado: ${stop.state || 'pendente'}`,
      )
      .addTo(routeLayer)
  }

  // 4. Destino
  const destCoord = pointLatLng(props.snapshot?.destination)
  if (destCoord) {
    fallbackCoords.push(destCoord)
    boundsPoints.push(destCoord)
    L.circleMarker(destCoord, {
      radius: 8,
      color: '#b91c1c',
      fillColor: '#ef4444',
      fillOpacity: 0.9,
      weight: 2,
    })
      .bindPopup(`<strong>Destino:</strong> ${props.snapshot.destination.name || 'Destino'}`)
      .addTo(routeLayer)
  }

  if (!props.snapshot?.geometry?.coordinates?.length && fallbackCoords.length >= 2) {
    L.polyline(fallbackCoords, {
      color: '#df801a',
      weight: 3,
      dashArray: '6 6',
      opacity: 0.85,
    }).addTo(routeLayer)
  }

  if (boundsPoints.length >= 2) {
    map.fitBounds(L.latLngBounds(boundsPoints), { padding: [28, 28], maxZoom: 15 })
  } else if (boundsPoints.length === 1) {
    map.setView(boundsPoints[0], 14)
  }
}

function initMap() {
  if (map || !mapContainer.value) return
  map = L.map(mapContainer.value, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false,
  }).setView(DEFAULT_CENTER, 13)

  applyTileLayer(currentTheme())
  themeObserver = new MutationObserver(() => applyTileLayer(currentTheme()))
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  renderRoute()
}

watch(
  () => [props.snapshot, props.stops],
  () => renderRoute(),
  { deep: true },
)

onMounted(async () => {
  if (!hasMapData.value) return
  await nextTick()
  initMap()
})

watch(hasMapData, async (available) => {
  if (available && !map) {
    await nextTick()
    initMap()
  }
})

onUnmounted(() => {
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }
  if (map) {
    map.remove()
    map = null
    tileLayer = null
    routeLayer = null
  }
})
</script>

<template>
  <div v-if="hasMapData" class="route-snapshot-box">
    <div class="snapshot-header">
      <h4>{{ title }}</h4>
      <div class="snapshot-meta">
        <span v-if="distanceLabel" class="meta-pill">{{ distanceLabel }}</span>
        <span v-if="durationLabel" class="meta-pill">{{ durationLabel }}</span>
        <span v-if="orderedStops.length" class="meta-pill">{{ orderedStops.length }} parada(s)</span>
      </div>
    </div>
    <div ref="mapContainer" class="snapshot-map" :style="{ height }"></div>
    <div class="snapshot-legend">
      <span><i class="dot origin"></i> Origem</span>
      <span><i class="dot stop"></i> Paradas</span>
      <span><i class="dot dest"></i> Destino</span>
    </div>
  </div>
</template>

<style scoped>
.route-snapshot-box {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
}

.snapshot-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.snapshot-header h4 {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text);
}

.snapshot-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  background: rgba(223, 128, 26, 0.14);
  color: var(--primary);
}

.snapshot-map {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border);
  z-index: 1;
}

.snapshot-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.snapshot-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.dot.origin {
  background: #22c55e;
}

.dot.stop {
  background: #f48a1d;
}

.dot.dest {
  background: #ef4444;
}
</style>
