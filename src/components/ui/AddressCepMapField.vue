<script setup>
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import api from '@/api/client'
import FormField from '@/components/ui/FormField.vue'
import FormattedField from '@/components/ui/FormattedField.vue'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = [-26.3044, -48.8455]
const TILE_URLS = {
  light: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
}
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'

const cep = defineModel('cep', { type: String, default: '' })
const street = defineModel('street', { type: String, default: '' })
const number = defineModel('number', { type: String, default: '' })
const complement = defineModel('complement', { type: String, default: '' })
const neighborhood = defineModel('neighborhood', { type: String, default: '' })
const city = defineModel('city', { type: String, default: '' })
const state = defineModel('state', { type: String, default: '' })
const latitude = defineModel('latitude', { type: [Number, String, null], default: null })
const longitude = defineModel('longitude', { type: [Number, String, null], default: null })

const props = defineProps({
  disabled: { type: Boolean, default: false },
  cepError: { type: String, default: '' },
  formatCep: { type: Function, required: true },
  complementPlaceholder: { type: String, default: 'Bloco, condomínio, apto...' },
})

const emit = defineEmits(['cep-input', 'cep-blur'])

const mapEl = useTemplateRef('mapContainer')
const loadingCep = shallowRef(false)
const cepFeedback = shallowRef('')

let map = null
let tileLayer = null
let marker = null
let themeObserver = null
let cepController = null

const resolvedAddress = computed(() => {
  const streetText = street.value?.trim()
  const neighborhoodText = neighborhood.value?.trim()
  const cityState = [city.value?.trim(), state.value?.trim()].filter(Boolean).join(' / ')
  return [streetText, neighborhoodText, cityState].filter(Boolean).join(' · ')
})

const hasCoordinates = computed(
  () =>
    latitude.value != null &&
    longitude.value != null &&
    Number.isFinite(Number(latitude.value)) &&
    Number.isFinite(Number(longitude.value))
)

function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
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

function setPin(lat, lng, pan = true) {
  const nLat = Number(lat)
  const nLng = Number(lng)
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return
  latitude.value = Number(nLat.toFixed(6))
  longitude.value = Number(nLng.toFixed(6))

  if (!map) return
  if (!marker) {
    marker = L.marker([nLat, nLng], { draggable: true })
      .addTo(map)
      .bindPopup('Localização selecionada (arraste para ajustar)')
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      latitude.value = Number(pos.lat.toFixed(6))
      longitude.value = Number(pos.lng.toFixed(6))
    })
  } else {
    marker.setLatLng([nLat, nLng])
  }
  if (pan) map.setView([nLat, nLng], 16)
}

function initMap() {
  if (map || !mapEl.value) return
  const center = hasCoordinates.value
    ? [Number(latitude.value), Number(longitude.value)]
    : DEFAULT_CENTER
  map = L.map(mapEl.value, { zoomControl: true, attributionControl: true }).setView(
    center,
    hasCoordinates.value ? 16 : 13
  )
  applyTileLayer(currentTheme())
  map.on('click', (event) => {
    if (props.disabled) return
    setPin(event.latlng.lat, event.latlng.lng, false)
  })
  themeObserver = new MutationObserver(() => applyTileLayer(currentTheme()))
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  if (hasCoordinates.value) {
    setPin(latitude.value, longitude.value, false)
  }
}

async function lookupCep() {
  const cleanCep = String(cep.value || '').replace(/\D/g, '')
  if (cleanCep.length !== 8) {
    cepFeedback.value = ''
    return
  }

  cepController?.abort()
  cepController = new AbortController()
  loadingCep.value = true
  cepFeedback.value = ''
  try {
    const { data } = await api.get(`/cep/${cleanCep}/`, { signal: cepController.signal })
    if (cepController.signal.aborted) return
    state.value = data.state || ''
    city.value = data.city || ''
    street.value = data.street || ''
    neighborhood.value = data.neighborhood || ''
    if (data.latitude != null && data.longitude != null) {
      setPin(data.latitude, data.longitude, true)
      cepFeedback.value = 'Endereço e posição aproximada carregados pelo CEP. Ajuste o pino no mapa se necessário.'
    } else {
      cepFeedback.value = 'Endereço carregado pelo CEP. Clique no mapa abaixo para marcar o ponto exato.'
    }
  } catch {
    if (!cepController.signal.aborted) {
      cepFeedback.value = 'Não foi possível consultar o CEP agora. Clique no mapa para marcar o ponto do endereço.'
    }
  } finally {
    if (!cepController.signal.aborted) loadingCep.value = false
  }
}

function onCepInput() {
  emit('cep-input')
  const digits = String(cep.value || '').replace(/\D/g, '')
  if (digits.length === 8) lookupCep()
}

watch(
  () => [latitude.value, longitude.value],
  ([lat, lng]) => {
    if (map && lat != null && lng != null && !marker) {
      setPin(lat, lng, false)
    }
  }
)

onMounted(async () => {
  await nextTick()
  initMap()
})

onUnmounted(() => {
  cepController?.abort()
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }
  if (map) {
    map.remove()
    map = null
    tileLayer = null
    marker = null
  }
})
</script>

<template>
  <div class="address-cep-map">
    <FormattedField
      v-model="cep"
      label="CEP"
      required
      :only-numbers="true"
      placeholder="00000-000"
      maxlength="9"
      :disabled="disabled"
      :format="formatCep"
      :error="cepError"
      @input="onCepInput"
      @blur="emit('cep-blur')"
    />

    <p v-if="loadingCep" class="cep-status" role="status">Consultando endereço pelo CEP...</p>
    <div v-else-if="resolvedAddress" class="resolved-box" role="status">
      <span class="mdi mdi-map-marker-outline resolved-icon" aria-hidden="true"></span>
      <span>{{ resolvedAddress }}</span>
    </div>
    <p v-if="cepFeedback" class="cep-feedback">{{ cepFeedback }}</p>

    <div class="address-row">
      <FormField
        v-model="number"
        label="Número"
        placeholder="Nº"
        :disabled="disabled"
        class="half-field"
      />
      <FormField
        v-model="complement"
        label="Complemento"
        :placeholder="complementPlaceholder"
        :disabled="disabled"
        class="half-field"
      />
    </div>

    <div class="map-section">
      <div class="map-header">
        <span class="map-label">Localização no mapa</span>
        <span v-if="hasCoordinates" class="coords-badge">
          {{ Number(latitude).toFixed(5) }}, {{ Number(longitude).toFixed(5) }}
        </span>
      </div>
      <p class="map-hint">Clique no mapa ou arraste o pino para salvar as coordenadas exatas do endereço.</p>
      <div ref="mapContainer" class="leaflet-canvas"></div>
    </div>
  </div>
</template>

<style scoped>
.address-cep-map {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.cep-status,
.cep-feedback {
  margin: -6px 0 4px;
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.resolved-box {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-primary);
  background: rgba(223, 128, 26, 0.08);
  font-size: 0.86rem;
  color: var(--text);
  line-height: 1.4;
}

.resolved-icon {
  color: var(--primary);
  font-size: 1.15rem;
  flex-shrink: 0;
}

.address-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 10px;
}

.half-field {
  min-width: 0;
}

.map-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
}

.map-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.map-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--primary);
}

.coords-badge {
  font-size: 0.76rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(223, 128, 26, 0.14);
  color: var(--primary);
  font-weight: 600;
}

.map-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.leaflet-canvas {
  width: 100%;
  height: 220px;
  border-radius: 10px;
  border: 1.5px solid var(--border-primary);
  z-index: 1;
}
</style>
