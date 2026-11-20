<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'

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

function emptyPoint() {
  return {
    name: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    latitude: '',
    longitude: '',
  }
}

const store = useTransporteStore()
const scope = useAccountScope()

const mapContainer = ref(null)
const form = ref(emptyPoint())
const editingId = ref(null)
const saving = ref(false)
const error = ref('')
const notice = ref('')

let map = null
let tileLayer = null
let themeObserver = null
let selectionMarker = null
let existingMarkersLayer = null

function applyTileLayer(theme) {
  if (!map) return
  if (tileLayer) map.removeLayer(tileLayer)
  tileLayer = L.tileLayer(TILE_URLS[theme], {
    maxZoom: 18,
    maxNativeZoom: 16,
    attribution: TILE_ATTRIBUTION,
  }).addTo(map)
}

function updateSelectionMarker(lat, lng, pan = false) {
  if (!map) return
  const parsedLat = Number(lat)
  const parsedLng = Number(lng)
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    if (selectionMarker) {
      map.removeLayer(selectionMarker)
      selectionMarker = null
    }
    return
  }

  if (!selectionMarker) {
    selectionMarker = L.marker([parsedLat, parsedLng], { draggable: true })
      .addTo(map)
      .bindPopup('Coordenada selecionada')
    selectionMarker.on('dragend', () => {
      const pos = selectionMarker.getLatLng()
      form.value.latitude = pos.lat.toFixed(6)
      form.value.longitude = pos.lng.toFixed(6)
    })
  } else {
    selectionMarker.setLatLng([parsedLat, parsedLng])
  }

  if (pan) {
    map.panTo([parsedLat, parsedLng])
  }
}

function renderExistingPoints() {
  if (!map) return
  if (existingMarkersLayer) {
    existingMarkersLayer.clearLayers()
  } else {
    existingMarkersLayer = L.layerGroup().addTo(map)
  }

  for (const ponto of store.pontosDestino || []) {
    const lat = Number(ponto.latitude)
    const lng = Number(ponto.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    L.circleMarker([lat, lng], {
      radius: 7,
      color: '#df801a',
      fillColor: '#f48a1d',
      fillOpacity: 0.85,
      weight: 2,
    })
      .bindPopup(`<strong>${ponto.name}</strong><br>${ponto.city}/${ponto.state}`)
      .addTo(existingMarkersLayer)
  }
}

function initMap() {
  if (map || !mapContainer.value) return

  map = L.map(mapContainer.value, {
    zoomControl: true,
    attributionControl: true,
  }).setView(DEFAULT_CENTER, 13)

  applyTileLayer(currentTheme())

  map.on('click', (event) => {
    const { lat, lng } = event.latlng
    form.value.latitude = lat.toFixed(6)
    form.value.longitude = lng.toFixed(6)
    updateSelectionMarker(lat, lng, false)
  })

  themeObserver = new MutationObserver(() => applyTileLayer(currentTheme()))
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  renderExistingPoints()
}

function startEdit(ponto) {
  editingId.value = ponto.id
  error.value = ''
  notice.value = ''
  form.value = {
    name: ponto.name || '',
    street: ponto.street || '',
    number: ponto.number || '',
    complement: ponto.complement || '',
    neighborhood: ponto.neighborhood || '',
    city: ponto.city || '',
    state: ponto.state || '',
    cep: ponto.cep || '',
    latitude: String(ponto.latitude ?? ''),
    longitude: String(ponto.longitude ?? ''),
  }
  updateSelectionMarker(ponto.latitude, ponto.longitude, true)
}

function resetForm() {
  editingId.value = null
  error.value = ''
  form.value = emptyPoint()
  updateSelectionMarker(null, null)
}

async function handleSubmit() {
  if (!scope.current() || saving.value) return
  error.value = ''
  notice.value = ''

  const lat = Number(form.value.latitude)
  const lng = Number(form.value.longitude)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    error.value = 'Clique no mapa ou informe latitude (-90 a 90) e longitude (-180 a 180) válidas.'
    return
  }

  saving.value = true
  const payload = {
    point_type: 'destination',
    name: form.value.name.trim(),
    street: form.value.street.trim(),
    number: form.value.number.trim(),
    complement: form.value.complement.trim(),
    neighborhood: form.value.neighborhood.trim(),
    city: form.value.city.trim(),
    state: form.value.state.trim().toUpperCase(),
    cep: form.value.cep.replace(/\D/g, ''),
    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6),
  }

  const saved = editingId.value
    ? await store.atualizarPontoOperacional(editingId.value, payload, { signal: scope.signal })
    : await store.adicionarPontoOperacional(payload, { signal: scope.signal })

  if (!scope.current()) return
  saving.value = false

  if (!saved) {
    error.value = typeof store.error === 'string' ? store.error : 'Não foi possível salvar o ponto de destino.'
    return
  }

  notice.value = editingId.value
    ? 'Ponto de destino atualizado com sucesso.'
    : 'Ponto de destino cadastrado com sucesso.'
  resetForm()
  renderExistingPoints()
}

watch(
  () => store.pontosOperacionais,
  () => renderExistingPoints(),
  { deep: true },
)

onMounted(async () => {
  await nextTick()
  initMap()
  await store.fetchPontosOperacionais({ signal: scope.signal })
  if (!scope.current()) return
  renderExistingPoints()
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
    selectionMarker = null
    existingMarkersLayer = null
  }
})
</script>

<template>
  <div class="points-page">
    <div class="page-header">
      <div>
        <h1>Pontos Operacionais de Destino</h1>
        <p class="subtitle">
          Cadastre os pontos de destino para vincular aos grupos de atendimento. Clique no mapa para capturar latitude e longitude automaticamente.
          As garagens ficam na seção de Veículos.
        </p>
      </div>
      <div class="header-links">
        <RouterLink to="/transporte" class="btn-outline">Frota e Garagens</RouterLink>
        <RouterLink to="/lista" class="btn-outline">Grupos e Rotas</RouterLink>
      </div>
    </div>

    <p v-if="notice" class="notice-banner" role="status">{{ notice }}</p>
    <p v-if="error || store.error" class="error-banner" role="alert">{{ error || store.error }}</p>

    <div class="layout-grid">
      <section class="panel map-panel">
        <h2>Seleção no Mapa</h2>
        <p class="hint">Clique em qualquer local do mapa (ou arraste o marcador) para definir as coordenadas.</p>
        <div ref="mapContainer" class="leaflet-canvas"></div>
      </section>

      <section class="panel form-panel">
        <h2>{{ editingId ? 'Editar Ponto de Destino' : 'Novo Ponto de Destino' }}</h2>
        <form class="point-form" @submit.prevent="handleSubmit">
          <div class="field full">
            <label for="op-name">Nome do destino *</label>
            <input id="op-name" v-model="form.name" required placeholder="Ex.: IFC Campus Araquari" :disabled="saving" />
          </div>

          <div class="field">
            <label for="op-cep">CEP *</label>
            <input id="op-cep" v-model="form.cep" required inputmode="numeric" placeholder="89245000" :disabled="saving" />
          </div>

          <div class="field">
            <label for="op-state">UF *</label>
            <input id="op-state" v-model="form.state" required maxlength="2" placeholder="SC" :disabled="saving" />
          </div>

          <div class="field full">
            <label for="op-city">Cidade *</label>
            <input id="op-city" v-model="form.city" required placeholder="Araquari" :disabled="saving" />
          </div>

          <div class="field">
            <label for="op-street">Rua / Logradouro *</label>
            <input id="op-street" v-model="form.street" required placeholder="BR-280, km 27" :disabled="saving" />
          </div>

          <div class="field">
            <label for="op-number">Número *</label>
            <input id="op-number" v-model="form.number" required placeholder="S/N" :disabled="saving" />
          </div>

          <div class="field">
            <label for="op-neighborhood">Bairro *</label>
            <input id="op-neighborhood" v-model="form.neighborhood" required placeholder="Colégio Agrícola" :disabled="saving" />
          </div>

          <div class="field">
            <label for="op-complement">Complemento</label>
            <input id="op-complement" v-model="form.complement" placeholder="Portão principal" :disabled="saving" />
          </div>

          <div class="field">
            <label for="op-lat">Latitude *</label>
            <input
              id="op-lat"
              v-model="form.latitude"
              required
              placeholder="-26.394120"
              :disabled="saving"
              @change="updateSelectionMarker(form.latitude, form.longitude, true)"
            />
          </div>

          <div class="field">
            <label for="op-lng">Longitude *</label>
            <input
              id="op-lng"
              v-model="form.longitude"
              required
              placeholder="-48.738510"
              :disabled="saving"
              @change="updateSelectionMarker(form.latitude, form.longitude, true)"
            />
          </div>

          <div class="form-actions full">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Ponto' }}
            </button>
            <button v-if="editingId" type="button" class="btn-outline" :disabled="saving" @click="resetForm">
              Cancelar edição
            </button>
          </div>
        </form>
      </section>
    </div>

    <section class="panel list-panel">
      <h2>Pontos de Destino Cadastrados ({{ store.pontosDestino.length }})</h2>
      <p v-if="store.pointsLoading" class="hint">Carregando pontos de destino...</p>
      <p v-else-if="!store.pontosDestino.length" class="hint">
        Nenhum ponto de destino cadastrado ainda. Clique no mapa e preencha o formulário acima para criar o primeiro destino.
      </p>
      <div v-else class="points-list">
        <article v-for="ponto in store.pontosDestino" :key="ponto.id" class="point-card">
          <div>
            <h3>{{ ponto.name }}</h3>
            <p class="point-address">
              {{ ponto.street }}, {{ ponto.number }} — {{ ponto.neighborhood }}, {{ ponto.city }}/{{ ponto.state }} (CEP {{ ponto.cep }})
            </p>
            <p class="point-coords">Lat {{ ponto.latitude }} · Lng {{ ponto.longitude }}</p>
          </div>
          <div class="point-card-actions">
            <RouterLink :to="{ path: '/cadastro-rota', query: { destination: ponto.id } }" class="btn-outline">
              <span class="mdi mdi-routes" aria-hidden="true"></span>
              Vincular grupo
            </RouterLink>
            <button type="button" class="btn-outline" @click="startEdit(ponto)">
              <span class="mdi mdi-pencil-outline" aria-hidden="true"></span>
              Editar
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.points-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 20px 16px 40px;
  color: var(--text);
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0 0 6px;
  font-size: 1.6rem;
}

.subtitle,
.hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.header-links {
  display: flex;
  gap: 8px;
}

.notice-banner,
.error-banner {
  padding: 12px 14px;
  border-radius: 10px;
  margin: 0 0 14px;
  font-size: 0.92rem;
}

.notice-banner {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: var(--text);
}

.error-banner {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: var(--danger);
}

.layout-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
}

.panel {
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
  box-shadow: var(--shadow);
}

.panel h2 {
  margin: 0 0 8px;
  font-size: 1.15rem;
}

.leaflet-canvas {
  width: 100%;
  height: 360px;
  margin-top: 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  z-index: 1;
}

.point-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field.full,
.form-actions.full {
  grid-column: 1 / -1;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.field input {
  padding: 9px 11px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 0.92rem;
}

.field input:focus {
  outline: none;
  border-color: var(--primary);
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.btn-primary,
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  color: #ffffff;
  border: 1px solid var(--primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-outline:hover {
  background: var(--altbg);
}

.points-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.point-card {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
}

.point-card h3 {
  margin: 0 0 4px;
  font-size: 1rem;
}

.point-address {
  margin: 0 0 4px;
  font-size: 0.88rem;
  color: var(--text);
}

.point-coords {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.point-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 860px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }

  .point-form {
    grid-template-columns: 1fr;
  }
}
</style>
