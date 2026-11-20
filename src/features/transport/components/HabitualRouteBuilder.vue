<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'

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

const props = defineProps({
  groupId: { type: Number, required: true },
  destinationCoords: { type: Array, default: null },
  habitualRoutes: { type: Array, default: () => [] },
  sharedRoutes: { type: Array, default: () => [] },
})

const emit = defineEmits(['updated'])

const store = useRotasStore()
const scope = useAccountScope()
const mapContainer = useTemplateRef('mapEl')

const routeName = shallowRef('')
const editingRouteId = shallowRef(null)
const savingHabitual = shallowRef(false)
const habitualError = shallowRef('')
const habitualNotice = shallowRef('')
const loadingCandidates = shallowRef(false)

// Candidatos no mapa: { group_membership_id, passenger_name, street, number, complement, neighborhood, city, state, cep, latitude, longitude, selected }
const candidates = ref([])

let map = null
let tileLayer = null
let themeObserver = null
let markersLayer = null

const selectedCandidates = computed(() => candidates.value.filter((c) => c.selected))

function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function initialCenter() {
  if (Array.isArray(props.destinationCoords) && props.destinationCoords.length === 2) {
    return props.destinationCoords
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

function formatAddress(item) {
  const streetLine = [item.street, item.number].filter(Boolean).join(', ')
  const extra = [item.complement, item.neighborhood].filter(Boolean).join(' · ')
  const cityLine = [item.city, item.state].filter(Boolean).join('/')
  return [streetLine, extra, cityLine].filter(Boolean).join(' — ') || 'Endereço não informado'
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function passengerTooltipHtml(item) {
  const safeName = escapeHtml(item.passenger_name || 'Passageiro')
  const avatar = item.profile_picture_url
    ? `<img src="${escapeHtml(item.profile_picture_url)}" alt="${safeName}" class="pmap-tip-avatar" />`
    : `<span class="pmap-tip-fallback">${escapeHtml((item.passenger_name || 'P').trim().charAt(0).toUpperCase())}</span>`
  return `<div class="pmap-tip">${avatar}<span class="pmap-tip-name">${safeName}</span></div>`
}

function renderMarkers() {
  if (!map) return
  if (markersLayer) {
    markersLayer.clearLayers()
  } else {
    markersLayer = L.layerGroup().addTo(map)
  }

  const bounds = []
  for (const item of candidates.value) {
    const lat = Number(item.latitude)
    const lng = Number(item.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    bounds.push([lat, lng])

    const tooltipHtml = passengerTooltipHtml(item)

    if (item.selected) {
      const marker = L.marker([lat, lng], { draggable: true })
        .bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -14], opacity: 0.98, className: 'passenger-map-tooltip' })
        .bindPopup(
          `<strong>${escapeHtml(item.passenger_name)}</strong> (selecionado)<br>${escapeHtml(formatAddress(item))}<br><small>Arraste o pino para ajustar o ponto exato.</small>`
        )
        .addTo(markersLayer)

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        item.latitude = Number(pos.lat.toFixed(6))
        item.longitude = Number(pos.lng.toFixed(6))
      })
    } else {
      const circle = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#df801a',
        fillColor: '#f48a1d',
        fillOpacity: 0.75,
        weight: 2,
      })
        .bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -10], opacity: 0.98, className: 'passenger-map-tooltip' })
        .bindPopup(
          `<strong>${escapeHtml(item.passenger_name)}</strong><br>${escapeHtml(formatAddress(item))}<br><small>Clique na lista para incluir na rota.</small>`
        )
        .addTo(markersLayer)

      circle.on('click', () => {
        togglePassenger(item)
      })
    }
  }

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 })
  }
}

function initMap() {
  if (map || !mapContainer.value) return
  map = L.map(mapContainer.value, { zoomControl: true, attributionControl: true }).setView(initialCenter(), 13)
  applyTileLayer(currentTheme())
  themeObserver = new MutationObserver(() => applyTileLayer(currentTheme()))
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  renderMarkers()
}

function togglePassenger(item) {
  item.selected = !item.selected
  if (item.selected && (!Number.isFinite(Number(item.latitude)) || !Number.isFinite(Number(item.longitude)))) {
    const center = map ? map.getCenter() : { lat: initialCenter()[0], lng: initialCenter()[1] }
    item.latitude = Number(center.lat.toFixed(6))
    item.longitude = Number(center.lng.toFixed(6))
  }
  renderMarkers()
}

function focusPassenger(item) {
  if (!map) return
  const lat = Number(item.latitude)
  const lng = Number(item.longitude)
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    map.setView([lat, lng], 16)
  }
}

async function loadUnassigned(extraSelected = []) {
  loadingCandidates.value = true
  const rows = await store.carregarPassageirosSemRota(props.groupId, { signal: scope.signal })
  if (!scope.current()) return
  const byId = new Map()
  for (const existing of extraSelected) {
    byId.set(existing.group_membership_id, { ...existing, selected: true })
  }
  for (const row of rows) {
    if (!byId.has(row.group_membership_id)) {
      byId.set(row.group_membership_id, { ...row, selected: false })
    }
  }
  candidates.value = Array.from(byId.values())
  loadingCandidates.value = false
  await nextTick()
  if (map) map.invalidateSize()
  renderMarkers()
}

function startEditRoute(route) {
  editingRouteId.value = route.id
  routeName.value = route.name
  habitualError.value = ''
  habitualNotice.value = ''
  loadUnassigned(route.passengers || [])
}

function cancelEditRoute() {
  editingRouteId.value = null
  routeName.value = ''
  habitualError.value = ''
  loadUnassigned([])
}

async function saveHabitualRoute() {
  if (!scope.current() || savingHabitual.value) return
  habitualError.value = ''
  habitualNotice.value = ''

  if (!routeName.value.trim()) {
    habitualError.value = 'Informe o nome da rota habitual.'
    return
  }
  if (!selectedCandidates.value.length) {
    habitualError.value = 'Selecione ao menos um passageiro no mapa ou na lista antes de confirmar a rota.'
    return
  }

  for (const p of selectedCandidates.value) {
    const lat = Number(p.latitude)
    const lng = Number(p.longitude)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      habitualError.value = `Defina ou ajuste as coordenadas de ${p.passenger_name} no mapa.`
      return
    }
  }

  savingHabitual.value = true
  const result = await store.salvarRotaHabitual(
    props.groupId,
    {
      name: routeName.value,
      kind: 'habitual',
      passengers: selectedCandidates.value.map((p) => ({
        group_membership_id: p.group_membership_id,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      })),
    },
    editingRouteId.value,
    { signal: scope.signal }
  )
  if (!scope.current()) return
  savingHabitual.value = false

  if (!result) {
    habitualError.value = store.error || 'Não foi possível salvar a rota habitual.'
    return
  }

  habitualNotice.value = editingRouteId.value
    ? 'Rota habitual atualizada com sucesso.'
    : 'Rota habitual criada com sucesso.'
  editingRouteId.value = null
  routeName.value = ''
  emit('updated')
  await loadUnassigned([])
}

watch(
  () => props.groupId,
  () => {
    editingRouteId.value = null
    routeName.value = ''
    loadUnassigned([])
  }
)

onMounted(async () => {
  await nextTick()
  initMap()
  await loadUnassigned([])
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
    markersLayer = null
  }
})
</script>

<template>
  <div class="routes-builder">
    <!-- 2A. Rotas Habituais com Mapa -->
    <section class="panel-section">
      <h2>Rotas Habituais (com pontos dos passageiros)</h2>
      <p class="hint">
        Cada passageiro do grupo pode estar vinculado a apenas uma rota habitual. Os passageiros ainda sem rota aparecem no mapa com base no CEP cadastrado — selecione-os e arraste os pinos para ajuste fino (número/bloco) antes de confirmar.
      </p>

      <div v-if="habitualRoutes.length" class="route-list">
        <article v-for="route in habitualRoutes" :key="route.id" class="route-card">
          <div class="route-card-head">
            <div>
              <strong>{{ route.name }}</strong>
              <span class="route-badge">{{ route.passengers?.length || 0 }} passageiro(s)</span>
            </div>
            <button type="button" class="btn-outline-sm" @click="startEditRoute(route)">
              Editar rota
            </button>
          </div>
          <ul v-if="route.passengers?.length" class="passenger-summary">
            <li v-for="p in route.passengers" :key="p.group_membership_id">
              <strong>{{ p.passenger_name }}</strong> — {{ formatAddress(p) }}
            </li>
          </ul>
        </article>
      </div>
      <p v-else class="empty-hint">Nenhuma rota habitual cadastrada neste grupo ainda.</p>

      <div class="builder-box">
        <h3>{{ editingRouteId ? 'Editar rota habitual' : 'Nova rota habitual' }}</h3>

        <div class="field-block">
          <label for="habitual-route-name">Nome da rota habitual<span>*</span></label>
          <input
            id="habitual-route-name"
            v-model="routeName"
            placeholder="Ex.: Rota Zona Norte — Manhã"
            :disabled="savingHabitual"
          />
        </div>

        <div class="map-wrap">
          <p class="map-caption">
            Clique nos marcadores ou marque os passageiros abaixo. Passageiros selecionados exibem pino azul arrastável para ajuste manual.
          </p>
          <div ref="mapEl" class="leaflet-canvas"></div>
        </div>

        <div class="candidates-box">
          <h4>Passageiros disponíveis no grupo ({{ candidates.length }}) · Selecionados ({{ selectedCandidates.length }})</h4>
          <p v-if="loadingCandidates" class="hint">Carregando passageiros sem rota...</p>
          <p v-else-if="!candidates.length" class="empty-hint">
            Todos os passageiros deste grupo já possuem rota habitual (ou nenhum passageiro foi atribuído ao grupo ainda).
          </p>
          <ul v-else class="candidate-list">
            <li
              v-for="item in candidates"
              :key="item.group_membership_id"
              :class="['candidate-item', { selected: item.selected }]"
            >
              <label class="candidate-check">
                <input
                  type="checkbox"
                  :checked="item.selected"
                  :disabled="savingHabitual"
                  @change="togglePassenger(item)"
                />
                <div class="candidate-info">
                  <strong>{{ item.passenger_name }}</strong>
                  <span class="candidate-addr">{{ formatAddress(item) }}</span>
                  <span v-if="item.latitude != null && item.longitude != null" class="candidate-coords">
                    Ponto: {{ Number(item.latitude).toFixed(5) }}, {{ Number(item.longitude).toFixed(5) }}
                  </span>
                  <span v-else class="candidate-coords missing">
                    Sem coordenadas do CEP — ao selecionar, um pino arrastável será colocado no mapa.
                  </span>
                </div>
              </label>
              <button
                v-if="item.latitude != null && item.longitude != null"
                type="button"
                class="btn-locate"
                @click="focusPassenger(item)"
              >
                Ver no mapa
              </button>
            </li>
          </ul>
        </div>

        <p v-if="habitualError" class="erro" role="alert">{{ habitualError }}</p>
        <p v-if="habitualNotice" class="aviso" role="status">{{ habitualNotice }}</p>

        <div class="action-row">
          <button type="button" class="btn-primary-inline" :disabled="savingHabitual" @click="saveHabitualRoute">
            {{ savingHabitual ? 'Confirmando...' : editingRouteId ? 'Salvar alterações da rota' : 'Confirmar criação da rota' }}
          </button>
          <button v-if="editingRouteId" type="button" class="btn-outline-sm" :disabled="savingHabitual" @click="cancelEditRoute">
            Cancelar edição
          </button>
        </div>
      </div>
    </section>

    <!-- Nota sobre Serviços Compartilhados -->
    <section class="panel-section">
      <h2>Serviços Compartilhados</h2>
      <p class="hint">
        Viagens intermediárias compartilhadas são configuradas na aba <strong>1. Configurações do Grupo → Serviços Compartilhados</strong> e não possuem rotas fixas, pois os passageiros variam a cada atendimento.
      </p>
    </section>
  </div>
</template>

<style scoped>
.routes-builder {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-section {
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
}

.panel-section h2 {
  margin: 0 0 8px;
  font-size: 1.1rem;
  color: var(--text);
}

.hint,
.empty-hint,
.map-caption {
  margin: 0 0 12px;
  font-size: 0.86rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.route-card {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
}

.route-card-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.route-badge {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(223, 128, 26, 0.14);
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 600;
}

.passenger-summary {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 0.84rem;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.builder-box {
  border-top: 1px solid var(--border);
  padding-top: 14px;
  margin-top: 10px;
}

.builder-box h3 {
  margin: 0 0 10px;
  font-size: 1rem;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.field-block label {
  font-size: 0.84rem;
  font-weight: 600;
}

.field-block label span {
  color: var(--primary);
}

.field-block input,
.shared-form input {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;
}

.leaflet-canvas {
  width: 100%;
  height: 320px;
  border-radius: 12px;
  border: 1px solid var(--border);
  margin-bottom: 14px;
  z-index: 1;
}

.candidates-box h4 {
  margin: 0 0 8px;
  font-size: 0.9rem;
}

.candidate-list {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.candidate-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
}

.candidate-item.selected {
  border-color: var(--primary);
  background: rgba(223, 128, 26, 0.08);
}

.candidate-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 200px;
  cursor: pointer;
}

.candidate-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.candidate-addr {
  font-size: 0.82rem;
  color: var(--text);
}

.candidate-coords {
  font-size: 0.76rem;
  color: var(--text-muted);
}

.candidate-coords.missing {
  color: var(--primary);
}

.btn-locate,
.btn-outline-sm {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary-inline {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: var(--gradient-primary);
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary-inline:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.shared-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.shared-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(223, 128, 26, 0.12);
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 600;
}

.shared-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.shared-form input {
  flex: 1;
  min-width: 200px;
}

.erro {
  color: var(--danger);
  font-size: 0.85rem;
  margin: 8px 0;
}

.aviso {
  color: var(--success);
  font-size: 0.85rem;
  margin: 8px 0;
}
</style>
