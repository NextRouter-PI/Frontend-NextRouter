<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { state } from '@/stores/state'
import api from '@/api/client'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { useInputFormat } from '@/composables/useInputFormat'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import '@/assets/css/profile.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const TILE_URLS = {
  light: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
}
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'

function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

const route = useRoute()
const { formatPhone, formatCEP } = useInputFormat()
const driver = computed(() => route.name === 'usuario-motorista')
const profile = ref(null)
const loading = ref(false)
const error = ref('')
const reload = ref(0)
const mapContainer = ref(null)

let map = null
let tileLayer = null
let themeObserver = null

const hasCoordinates = computed(() => {
  const lat = Number(profile.value?.latitude)
  const lng = Number(profile.value?.longitude)
  return (
    profile.value?.latitude != null &&
    profile.value?.longitude != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  )
})

const formattedAddress = computed(() => {
  if (!profile.value) return ''
  const parts = [
    [profile.value.street, profile.value.number].filter(Boolean).join(', '),
    profile.value.complement,
    profile.value.neighborhood,
    [profile.value.city, profile.value.state].filter(Boolean).join('/'),
  ].filter(Boolean)
  return parts.join(' — ')
})

const avatarUrl = computed(() => profile.value?.profile_picture_url || '')
const initials = computed(() =>
  (profile.value?.name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join(''),
)

function destroyMap() {
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }
  if (map) {
    map.remove()
    map = null
    tileLayer = null
  }
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

async function renderMap() {
  destroyMap()
  if (driver.value || !hasCoordinates.value) return
  await nextTick()
  if (!mapContainer.value) return

  const lat = Number(profile.value.latitude)
  const lng = Number(profile.value.longitude)
  map = L.map(mapContainer.value, {
    zoomControl: true,
    attributionControl: true,
  }).setView([lat, lng], 15)

  applyTileLayer(currentTheme())

  const popupText = [
    `<strong>${profile.value.name || 'Passageiro'}</strong>`,
    formattedAddress.value,
  ]
    .filter(Boolean)
    .join('<br>')

  L.marker([lat, lng]).addTo(map).bindPopup(popupText).openPopup()

  themeObserver = new MutationObserver(() => applyTileLayer(currentTheme()))
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
}

watch(
  [() => route.params.id, driver, () => `${state.logged}:${state.role}:${state.user?.id}`, reload],
  async (_value, _old, onCleanup) => {
    destroyMap()
    profile.value = null
    error.value = ''
    loading.value = false
    if (!state.logged || state.role !== 'company') return
    const id = String(route.params.id)
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      error.value = 'Identificador de perfil inválido.'
      return
    }
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    loading.value = true
    try {
      const { data } = await api.get(`/${driver.value ? 'drivers' : 'passengers'}/${id}/`, {
        signal: controller.signal,
      })
      if (!controller.signal.aborted) {
        const userData = data.user_data || {}
        profile.value = {
          id: data.id,
          name: userData.name || '',
          phone: userData.phone || '',
          profile_picture_url: userData.profile_picture_data?.url || '',
          cep: userData.cep || '',
          street: userData.street || '',
          number: userData.number || '',
          complement: userData.complement || '',
          neighborhood: userData.neighborhood || '',
          city: userData.city || '',
          state: userData.state || '',
          latitude: userData.latitude ?? null,
          longitude: userData.longitude ?? null,
          average: data.average_rating,
          ratings: data.ratings_count,
        }
        await renderMap()
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        error.value = sessionError(cause, formatApiError(cause, 'O perfil não está disponível para esta empresa.'))
      }
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true, flush: 'sync' },
)

onUnmounted(destroyMap)
</script>

<template>
  <div class="account-workspace" :class="{ authenticated: state.logged }">
    <div class="account-content">
      <div class="profile-topbar">
        <h1>Perfil do titular vinculado</h1>
        <RouterLink to="/usuarios" class="back-btn">
          <span class="mdi mdi-arrow-left" aria-hidden="true"></span>
          <span>Voltar aos vínculos</span>
        </RouterLink>
      </div>

      <p v-if="loading" role="status">Consultando perfil autorizado...</p>
      <div role="alert"><ErrorMessage :message="error" /></div>

      <template v-if="profile">
        <section class="account-section identity-card">
          <div class="identity-header">
            <img v-if="avatarUrl" :src="avatarUrl" :alt="`Foto de ${profile.name || 'usuário'}`" class="identity-avatar" />
            <div v-else class="identity-avatar identity-fallback" aria-hidden="true">{{ initials }}</div>
            <div>
              <h2>{{ profile.name || 'Nome não disponível' }}</h2>
              <p class="identity-role">
                {{ driver ? 'Motorista' : 'Passageiro' }} · perfil nº {{ profile.id }}
              </p>
              <p v-if="profile.phone" class="identity-meta">
                <span class="mdi mdi-phone-outline" aria-hidden="true"></span>
                <span>{{ formatPhone(profile.phone) }}</span>
              </p>
              <p v-if="driver && profile.ratings != null" class="identity-meta">
                {{ profile.ratings }} avaliações · média {{ profile.average ?? 'não disponível' }}
              </p>
            </div>
          </div>
        </section>

        <section v-if="!driver" class="account-section">
          <h2>Endereço do passageiro</h2>
          <dl class="account-grid">
            <div>
              <dt>Rua / Logradouro</dt>
              <dd>{{ profile.street || 'Não informado' }}</dd>
            </div>
            <div>
              <dt>Número</dt>
              <dd>{{ profile.number || 'Não informado' }}</dd>
            </div>
            <div>
              <dt>Complemento</dt>
              <dd>{{ profile.complement || '—' }}</dd>
            </div>
            <div>
              <dt>Bairro</dt>
              <dd>{{ profile.neighborhood || 'Não informado' }}</dd>
            </div>
            <div>
              <dt>Cidade</dt>
              <dd>{{ profile.city || 'Não informada' }}</dd>
            </div>
            <div>
              <dt>Estado (UF)</dt>
              <dd>{{ profile.state || 'Não informado' }}</dd>
            </div>
            <div>
              <dt>CEP</dt>
              <dd>{{ profile.cep ? formatCEP(profile.cep) : 'Não informado' }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="!driver" class="account-section">
          <h2>Localização no mapa</h2>
          <template v-if="hasCoordinates">
            <p class="coords-hint">
              Latitude {{ Number(profile.latitude).toFixed(6) }} · Longitude {{ Number(profile.longitude).toFixed(6) }}
            </p>
            <div ref="mapContainer" class="profile-map"></div>
          </template>
          <p v-else class="account-hint">Coordenadas de localização não cadastradas para este passageiro.</p>
        </section>
      </template>

      <div class="account-actions">
        <BaseButton v-if="state.role === 'company'" type="button" variant="outline" :disabled="loading" @click="reload++">
          Atualizar consulta
        </BaseButton>
      </div>
      <p v-if="state.role !== 'company'">Somente uma empresa autorizada pode consultar esta tela.</p>
    </div>
  </div>
</template>

<style scoped>
.profile-topbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.profile-topbar h1 {
  margin: 0;
  font-size: 1.5rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--superfice);
  color: var(--text);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.back-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.identity-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.identity-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary);
  flex-shrink: 0;
}

.identity-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  color: #ffffff;
  font-weight: 700;
  font-size: 1.35rem;
}

.identity-card h2 {
  margin: 0 0 4px;
  font-size: 1.25rem;
}

.identity-role {
  margin: 0 0 6px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.identity-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.9rem;
  color: var(--text);
}

.coords-hint {
  margin: 0 0 10px;
  font-size: 0.84rem;
  color: var(--text-muted);
}

.profile-map {
  width: 100%;
  height: 320px;
  border-radius: 12px;
  border: 1px solid var(--border);
  z-index: 1;
}
</style>
