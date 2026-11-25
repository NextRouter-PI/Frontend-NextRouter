<script setup>
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import L from 'leaflet'
import api from '@/api/client'
import { attachThemedTileLayer, createPinIcon, DEFAULT_MAP_CENTER } from '@/utils/leafletTiles'
import { escapeHtml } from '@/utils/leafletMarkers'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

// Mapa geral da empresa: todas as viagens em andamento, com posição, progresso e atraso.
const POLL_MS = 10000
const COLORS = ['#ec8314', '#2563eb', '#16a34a', '#9333ea', '#dc2626', '#0891b2', '#ca8a04']

const travels = shallowRef([])
const loading = shallowRef(true)
const error = shallowRef('')
const selectedId = shallowRef(null)
const mapEl = useTemplateRef('mapEl')
let map = null
let layer = null
let cleanupTiles = null
let timer = 0
let fitted = false

const hhmm = (iso) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—')
const colorOf = (index) => COLORS[index % COLORS.length]

const totals = computed(() => ({
  active: travels.value.length,
  boarded: travels.value.reduce((sum, t) => sum + t.boarded, 0),
  waiting: travels.value.reduce((sum, t) => sum + t.waiting, 0),
  late: travels.value.filter((t) => t.delay_seconds >= 300).length,
}))

async function load() {
  try {
    const { data } = await api.get('/travels/live/')
    travels.value = Array.isArray(data) ? data : []
    error.value = ''
  } catch {
    error.value = 'Não foi possível carregar as viagens em andamento.'
  } finally {
    loading.value = false
  }
}

function render() {
  if (!map) return
  if (layer) layer.clearLayers()
  else layer = L.layerGroup().addTo(map)
  const bounds = []
  travels.value.forEach((travel, index) => {
    const color = colorOf(index)
    const faded = selectedId.value && selectedId.value !== travel.id
    if (travel.geometry?.coordinates?.length) {
      const geo = L.geoJSON(travel.geometry, { style: { color, weight: faded ? 3 : 5, opacity: faded ? 0.3 : 0.9 } })
      geo.addTo(layer)
      const b = geo.getBounds()
      if (b.isValid()) bounds.push(b.getSouthWest(), b.getNorthEast())
    }
    if (travel.latitude != null && travel.longitude != null) {
      const at = [travel.latitude, travel.longitude]
      bounds.push(at)
      L.marker(at, { icon: createPinIcon({ variant: 'primary', icon: 'mdi-bus', size: 'md' }), zIndexOffset: 500 })
        .bindTooltip(`${escapeHtml(travel.vehicle_plate || 'Veículo')} · ${escapeHtml(travel.driver_name || '')}`, {
          direction: 'top',
          offset: [0, -10],
        })
        .on('click', () => (selectedId.value = travel.id))
        .addTo(layer)
    }
  })
  if (!fitted && bounds.length >= 2) {
    map.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 15 })
    fitted = true
  }
}

function focus(travel) {
  selectedId.value = selectedId.value === travel.id ? null : travel.id
  if (map && travel.latitude != null) map.setView([travel.latitude, travel.longitude], 15, { animate: true })
}

watch([travels, selectedId], render)

onMounted(async () => {
  await load()
  await nextTick()
  if (mapEl.value) {
    map = L.map(mapEl.value, { zoomControl: true, scrollWheelZoom: true }).setView(DEFAULT_MAP_CENTER, 12)
    cleanupTiles = attachThemedTileLayer(map)
    render()
  }
  timer = setInterval(load, POLL_MS)
})

onUnmounted(() => {
  clearInterval(timer)
  cleanupTiles?.()
  map?.remove()
  map = null
})
</script>

<template>
  <div class="live-page">
    <PageHeader
      title="Operação ao vivo"
      highlight="ao vivo"
      eyebrow="Painel da empresa"
      icon="mdi-radar"
      subtitle="Todas as viagens em andamento no mapa, com quem já embarcou, quem espera e os atrasos."
    >
      <template #actions>
        <BaseButton variant="outline" size="sm" icon="mdi-refresh" @click="load">Atualizar</BaseButton>
      </template>
    </PageHeader>

    <div class="stat-grid">
      <StatTile icon="mdi-bus" tone="orange" label="Em andamento" :value="totals.active" hint="Viagens agora" />
      <StatTile icon="mdi-check-circle-outline" tone="green" label="Embarcados" :value="totals.boarded" hint="Já no veículo" />
      <StatTile icon="mdi-account-clock-outline" tone="blue" label="Aguardando" :value="totals.waiting" hint="Ainda no ponto" />
      <StatTile icon="mdi-clock-alert-outline" tone="gray" label="Com atraso" :value="totals.late" hint="5 min ou mais" />
    </div>

    <p v-if="error" class="live-error" role="alert">{{ error }}</p>

    <div class="live-layout">
      <div ref="mapEl" class="live-map" aria-label="Mapa das viagens em andamento"></div>

      <aside class="live-list" aria-label="Viagens em andamento">
        <p v-if="loading" class="live-empty">Carregando viagens...</p>
        <p v-else-if="!travels.length" class="live-empty">
          <BaseIcon name="mdi-bus-clock" /> Nenhuma viagem em andamento agora.
        </p>
        <button
          v-for="(travel, index) in travels"
          :key="travel.id"
          type="button"
          class="live-card"
          :class="{ active: selectedId === travel.id }"
          @click="focus(travel)"
        >
          <span class="live-color" :style="{ background: colorOf(index) }"></span>
          <span class="live-body">
            <strong>{{ travel.group_name || travel.service_name || `Viagem #${travel.id}` }}</strong>
            <small>
              {{ travel.direction === 'outbound' ? 'Ida' : 'Volta' }} · {{ travel.vehicle_plate || 'sem veículo' }} ·
              {{ travel.driver_name || 'sem motorista' }}
            </small>
            <span class="live-progress" aria-hidden="true">
              <span :style="{ width: `${travel.stops_total ? (travel.stops_done / travel.stops_total) * 100 : 0}%` }"></span>
            </span>
            <small>
              {{ travel.stops_done }}/{{ travel.stops_total }} paradas · {{ travel.boarded }} embarcados ·
              {{ travel.waiting }} aguardando
            </small>
            <small v-if="travel.next_stop_name">
              Próxima: {{ travel.next_stop_name }} às {{ hhmm(travel.next_stop_expected_at) }}
            </small>
            <span v-if="travel.delay_seconds >= 60" class="live-late">
              <BaseIcon name="mdi-clock-alert-outline" /> {{ Math.round(travel.delay_seconds / 60) }} min de atraso
            </span>
            <span v-else class="live-ok"><BaseIcon name="mdi-check-circle-outline" /> No horário</span>
            <small v-if="!travel.location_updated_at" class="live-muted">Sem localização do motorista ainda</small>
          </span>
        </button>
      </aside>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.live-page {
  --page-max: 1240px;
  @include section-container(120px);
}

.live-error {
  color: var(--danger);
}

.live-layout {
  display: grid;
  gap: $space-4;

  @include from(1100px) {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}

.live-map {
  height: 460px;
  border-radius: $radius-xl;
  outline: 1px solid var(--border);
  overflow: hidden;
  z-index: 0;

  @include from(1100px) {
    height: 620px;
  }
}

.live-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  max-height: 620px;
  overflow-y: auto;
}

.live-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: $space-5;
  border-radius: $radius-lg;
  border: 1.5px dashed var(--border);
  color: var(--text-muted);
}

.live-card {
  display: flex;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-lg;
  background: var(--color-surface);
  outline: 1px solid var(--border);
  outline-offset: -1px;
  text-align: left;
  color: var(--text);
  @include hover-card;

  &.active {
    outline: 2px solid var(--primary);
  }
}

.live-color {
  flex-shrink: 0;
  width: 6px;
  border-radius: 999px;
}

.live-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  small {
    color: var(--text-muted);
    font-size: $text-xs;
  }
}

.live-progress {
  height: 6px;
  border-radius: 999px;
  background: var(--altbg);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: var(--gradient-brand);
    transition: width 0.6s $ease-fluid;
  }
}

.live-late,
.live-ok {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: $text-xs;
  font-weight: $font-bold;
}

.live-late {
  color: #d97706;
}

.live-ok {
  color: var(--success);
}

.live-muted {
  font-style: italic;
}
</style>
