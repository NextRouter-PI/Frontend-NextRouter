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
  mapLabel: { type: String, default: 'Localização do seu Endereço' },
})

const emit = defineEmits(['cep-input', 'cep-blur'])

const mapEl = useTemplateRef('mapContainer')
const loadingCep = shallowRef(false)
const cepFeedback = shallowRef('')
const isFullscreen = shallowRef(false)

let map = null
let tileLayer = null
let marker = null
let themeObserver = null
let lastFetchedCep = ''

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

async function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  await nextTick()
  if (map) map.invalidateSize()
}

function onKeydown(event) {
  if (event.key === 'Escape' && isFullscreen.value) {
    toggleFullscreen()
  }
}

// Consulta automática ao digitar/alterar o CEP para 8 dígitos.
watch(
  () => String(cep.value || '').replace(/\D/g, ''),
  async (cleanCep, _prev, onCleanup) => {
    if (cleanCep.length !== 8) {
      lastFetchedCep = ''
      loadingCep.value = false
      cepFeedback.value = ''
      street.value = ''
      neighborhood.value = ''
      city.value = ''
      state.value = ''
      return
    }
    if (cleanCep === lastFetchedCep) return

    const controller = new AbortController()
    let current = true
    onCleanup(() => {
      current = false
      controller.abort()
    })

    loadingCep.value = true
    cepFeedback.value = ''
    try {
      const { data } = await api.get(`/cep/${cleanCep}/`, { signal: controller.signal })
      if (!current) return
      lastFetchedCep = cleanCep
      state.value = data.state || ''
      city.value = data.city || ''
      street.value = data.street || ''
      neighborhood.value = data.neighborhood || ''
      if (data.latitude != null && data.longitude != null) {
        setPin(data.latitude, data.longitude, true)
        cepFeedback.value = 'Endereço e posição aproximada preenchidos pelo CEP. Ajuste o pino no mapa se necessário.'
      } else {
        cepFeedback.value = 'Endereço preenchido pelo CEP. Clique no mapa abaixo para marcar o ponto exato.'
      }
    } catch {
      if (!current || controller.signal.aborted) return
      cepFeedback.value = 'Não foi possível consultar o CEP agora. Marque a localização diretamente no mapa.'
    } finally {
      if (current) loadingCep.value = false
    }
  }
)

watch(
  () => [latitude.value, longitude.value],
  ([lat, lng]) => {
    if (!map) return
    if (lat == null || lat === '' || lng == null || lng === '') {
      if (marker) {
        map.removeLayer(marker)
        marker = null
      }
      return
    }
    const nLat = Number(lat)
    const nLng = Number(lng)
    if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return
    if (!marker) {
      setPin(nLat, nLng, true)
    } else {
      const current = marker.getLatLng()
      if (Math.abs(current.lat - nLat) > 1e-6 || Math.abs(current.lng - nLng) > 1e-6) {
        marker.setLatLng([nLat, nLng])
        map.panTo([nLat, nLng])
      }
    }
  }
)

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  initMap()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
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
      @input="emit('cep-input')"
      @blur="emit('cep-blur')"
    />

    <p v-if="loadingCep" class="cep-status" role="status">Consultando Rua, Bairro e Cidade pelo CEP...</p>
    <p v-else-if="cepFeedback" class="cep-feedback" role="status">{{ cepFeedback }}</p>

    <FormField
      v-model="street"
      label="Rua"
      placeholder="Preenchida automaticamente pelo CEP"
      disabled
    />

    <FormField
      v-model="neighborhood"
      label="Bairro"
      placeholder="Preenchido automaticamente pelo CEP"
      disabled
    />

    <div class="city-state-row">
      <FormField
        v-model="city"
        label="Cidade"
        placeholder="Cidade do CEP"
        disabled
        class="field-cell"
      />
      <FormField
        v-model="state"
        label="UF"
        placeholder="UF"
        disabled
        class="field-cell"
      />
    </div>

    <div class="address-row">
      <FormField
        v-model="number"
        label="Número"
        placeholder="Nº"
        :disabled="disabled"
        class="field-cell"
      />
      <FormField
        v-model="complement"
        label="Complemento"
        :placeholder="complementPlaceholder"
        :disabled="disabled"
        class="field-cell"
      />
    </div>

    <div
      :class="['map-section', { fullscreen: isFullscreen }]"
      :role="isFullscreen ? 'dialog' : undefined"
      :aria-modal="isFullscreen ? 'true' : undefined"
      :aria-label="isFullscreen ? 'Localização do seu Endereço em tela cheia' : undefined"
    >
      <div class="map-header">
        <div class="map-title-group">
          <span class="map-label">{{ mapLabel }}</span>
          <span v-if="hasCoordinates" class="coords-badge">
            {{ Number(latitude).toFixed(5) }}, {{ Number(longitude).toFixed(5) }}
          </span>
        </div>

        <button
          type="button"
          class="btn-fullscreen"
          :aria-label="isFullscreen ? 'Sair da tela cheia' : 'Abrir mapa em tela cheia'"
          @click="toggleFullscreen"
        >
          <span
            class="mdi"
            :class="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
            aria-hidden="true"
          ></span>
          <span>{{ isFullscreen ? 'Reduzir' : 'Tela cheia' }}</span>
        </button>
      </div>

      <p class="map-hint">
        Clique no mapa ou arraste o pino para salvar as coordenadas exatas do endereço.
      </p>

      <div ref="mapContainer" class="leaflet-canvas"></div>

      <button
        v-if="isFullscreen"
        type="button"
        class="btn-confirm-fullscreen"
        @click="toggleFullscreen"
      >
        Confirmar localização no mapa
      </button>
    </div>
  </div>
</template>

<style scoped>
.address-cep-map {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.cep-status,
.cep-feedback {
  margin: -6px 0 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.city-state-row {
  display: grid;
  grid-template-columns: 1fr 88px;
  gap: 10px;
}

.address-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 10px;
}

.field-cell {
  min-width: 0;
}

.map-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.map-section.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 200;
  margin: 0;
  padding: 14px;
  background: var(--bg);
  box-sizing: border-box;
}

.map-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.map-title-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.map-label {
  font-size: 0.92rem;
  font-weight: 700;
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

.btn-fullscreen {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1.5px solid var(--border-primary);
  background: var(--superfice);
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-fullscreen:hover {
  background: rgba(223, 128, 26, 0.1);
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

.map-section.fullscreen .leaflet-canvas {
  flex: 1;
  height: auto;
  min-height: 0;
}

.btn-confirm-fullscreen {
  width: 100%;
  min-height: 48px;
  margin-top: 6px;
  border: none;
  border-radius: 12px;
  background: var(--primary-orange);
  color: #ffffff;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
