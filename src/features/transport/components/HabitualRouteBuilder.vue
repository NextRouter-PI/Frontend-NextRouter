<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useRouteBuilderMap } from '@/features/transport/composables/useRouteBuilderMap'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

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
const candidates = ref([])

const selectedCandidates = computed(() => candidates.value.filter((c) => c.selected))

const { formatAddress, renderMarkers, focusPassenger, getCenterCoords, invalidateSize } = useRouteBuilderMap({
  mapContainer,
  candidates,
  getDestinationCoords: () => props.destinationCoords,
  onTogglePassenger: togglePassenger,
})

function togglePassenger(item) {
  item.selected = !item.selected
  if (item.selected && (!Number.isFinite(Number(item.latitude)) || !Number.isFinite(Number(item.longitude)))) {
    const center = getCenterCoords()
    item.latitude = center.lat
    item.longitude = center.lng
  }
  renderMarkers()
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
  invalidateSize()
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
    { signal: scope.signal },
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
  },
)

onMounted(() => loadUnassigned([]))
</script>

<template>
  <div class="routes-builder">
    <BaseCard
      title="Rotas Habituais (com pontos dos passageiros)"
      subtitle="Cada passageiro do grupo pode estar vinculado a apenas uma rota habitual. Selecione-os no mapa ou na lista e arraste os pinos para ajuste fino antes de confirmar."
    >
      <div v-if="habitualRoutes.length" class="route-list">
        <article v-for="route in habitualRoutes" :key="route.id" class="route-card">
          <div class="route-card-head">
            <div>
              <strong>{{ route.name }}</strong>
              <span class="route-badge">{{ route.passengers?.length || 0 }} passageiro(s)</span>
            </div>
            <BaseButton variant="outline" size="sm" @click="startEditRoute(route)">Editar rota</BaseButton>
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
          <h4>
            Passageiros disponíveis no grupo ({{ candidates.length }}) · Selecionados
            ({{ selectedCandidates.length }})
          </h4>
          <p v-if="loadingCandidates" class="empty-hint">Carregando passageiros sem rota...</p>
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
              <BaseButton
                v-if="item.latitude != null && item.longitude != null"
                variant="outline"
                size="sm"
                @click="focusPassenger(item)"
              >
                Ver no mapa
              </BaseButton>
            </li>
          </ul>
        </div>

        <StatusBanner variant="danger" :message="habitualError" />
        <StatusBanner variant="success" :message="habitualNotice" />

        <div class="action-row">
          <BaseButton size="sm" :loading="savingHabitual" @click="saveHabitualRoute">
            {{
              savingHabitual
                ? 'Confirmando...'
                : editingRouteId
                  ? 'Salvar alterações da rota'
                  : 'Confirmar criação da rota'
            }}
          </BaseButton>
          <BaseButton
            v-if="editingRouteId"
            variant="outline"
            size="sm"
            :disabled="savingHabitual"
            @click="cancelEditRoute"
          >
            Cancelar edição
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard
      title="Serviços Compartilhados"
      subtitle="Viagens intermediárias compartilhadas são configuradas na aba 1. Configurações do Grupo → Serviços Compartilhados e não possuem rotas fixas, pois os passageiros variam a cada atendimento."
    />
  </div>
</template>

<style lang="scss" scoped>
.routes-builder,
.route-list,
.builder-box,
.candidates-box,
.candidate-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.route-card {
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-2;

  &-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-2;
  }
}

.route-badge {
  margin-left: $space-2;
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: $text-xs;
  font-weight: $font-bold;
}

.passenger-summary {
  font-size: $text-xs;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.builder-box {
  padding-top: $space-3;
  border-top: 1px solid var(--border);
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  label {
    font-size: $text-sm;
    font-weight: $font-semibold;
    color: var(--primary);
  }

  input {
    padding: 10px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.map-caption,
.empty-hint {
  font-size: $text-xs;
  color: var(--text-muted);
  margin-bottom: $space-2;
}

.leaflet-canvas {
  width: 100%;
  height: 320px;
  border-radius: $radius-md;
  border: 1px solid var(--border);
  z-index: $z-base;
}

.candidate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);

  &.selected {
    border-color: var(--primary);
    background: var(--color-primary-soft);
  }
}

.candidate-check {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  cursor: pointer;
  flex: 1;
  min-width: 200px;
}

.candidate-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: $text-sm;
}

.candidate-addr,
.candidate-coords {
  font-size: $text-xs;
  color: var(--text-muted);

  &.missing {
    color: var(--danger);
  }
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
