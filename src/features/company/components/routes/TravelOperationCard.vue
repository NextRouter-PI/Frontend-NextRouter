<script setup>
import { computed, shallowRef, watch } from 'vue'
import {
  JOB_STATUS_LABELS,
  PLANNING_STATUS_LABELS,
  SNAPSHOT_STATE_LABELS,
  TRAVEL_STATUS_LABELS,
} from '@/constants'
import { formatDateTimeBr } from '@/utils/formatters'
import BaseButton from '@/components/ui/BaseButton.vue'
import RouteMapSnapshot from '@/features/transport/components/RouteMapSnapshot.vue'
import TravelAssignmentControls from './TravelAssignmentControls.vue'
import { listRouteStops } from '@/api/transport/operation/travelsAndExecution'

const props = defineProps({
  travel: { type: Object, required: true },
  serviceName: { type: String, required: true },
  dayWindow: { type: String, default: '' },
  participantsCount: { type: Number, default: 0 },
  snapshot: { type: Object, default: null },
  job: { type: Object, default: null },
  veiculosAtivos: { type: Array, required: true },
  motoristasAtivos: { type: Array, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['open-calculate', 'publish', 'cancel', 'assign-vehicle', 'invite-driver'])

const isJobRunning = computed(
  () => props.job?.status === 'pending' || props.job?.status === 'running',
)
const canCalculate = computed(
  () =>
    !props.busy &&
    props.participantsCount > 0 &&
    !isJobRunning.value &&
    (props.dayWindow === 'closed' || props.dayWindow === 'extension'),
)
const calculateBlockedTitle = computed(() => {
  if (props.dayWindow === 'not_open' || props.dayWindow === 'normal') {
    return 'Aguarde o fechamento da janela e a consolidação das respostas para calcular.'
  }
  if (props.participantsCount === 0) {
    return 'É necessário ao menos 1 passageiro alocado para calcular a rota.'
  }
  if (isJobRunning.value) {
    return 'Cálculo de rota em andamento no worker...'
  }
  return 'Abrir mapa com passageiros confirmados e calcular rota'
})

const mapaAberto = shallowRef(false)

// Paradas com horário previsto (da rota) e esperado (com o atraso atual), ao abrir o mapa.
const stops = shallowRef([])
const hhmm = (iso) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—')
watch(mapaAberto, async (open) => {
  if (!open || !props.snapshot) return
  try {
    stops.value = await listRouteStops({ snapshot: props.snapshot.id })
  } catch {
    stops.value = []
  }
})
</script>

<template>
  <div class="travel-box">
    <div class="travel-header">
      <div>
        <strong>Viagem #{{ travel.id }} · {{ serviceName }}</strong>
        <p class="sub-meta">
          Execução: <strong>{{ TRAVEL_STATUS_LABELS[travel.status] || travel.status }}</strong> · Planejamento:
          <strong>{{ PLANNING_STATUS_LABELS[travel.planning_status] || travel.planning_status }}</strong> · Revisão:
          <strong>{{ travel.revision }}</strong> · Publicada:
          <strong>{{ travel.published_revision ?? 'nenhuma' }}</strong> · Vigente:
          <strong>{{ travel.publication_current ? 'Sim' : 'Não' }}</strong>
        </p>
        <p class="sub-meta">
          Início: {{ formatDateTimeBr(travel.planned_start) }} · Fim:
          {{ formatDateTimeBr(travel.planned_end) }} · Alocados: {{ participantsCount }}
        </p>
      </div>

      <div v-if="travel.status === 'scheduled'" class="inline-actions">
        <BaseButton
          variant="outline"
          size="sm"
          icon="mdi-map-marker-path"
          :disabled="!canCalculate"
          :title="calculateBlockedTitle"
          @click="emit('open-calculate', travel)"
        >
          {{ isJobRunning ? 'Calculando...' : 'Calcular rota' }}
        </BaseButton>
        <BaseButton
          size="sm"
          :disabled="busy || travel.planning_status !== 'ready'"
          @click="emit('publish', travel)"
        >
          Publicar viagem
        </BaseButton>
        <BaseButton variant="outline" size="sm" :disabled="busy" @click="emit('cancel', travel)">
          Cancelar viagem
        </BaseButton>
      </div>
    </div>

    <div v-if="snapshot || job" class="sub-meta snapshot-row">
      Snapshot #{{ snapshot?.id ?? travel.current_snapshot }}:
      <span v-if="snapshot">
        estado <strong>{{ SNAPSHOT_STATE_LABELS[snapshot.state] || snapshot.state }}</strong>
        <template v-if="snapshot.distance_meters != null">
          · {{ (snapshot.distance_meters / 1000).toFixed(1) }} km ·
          {{ Math.round((snapshot.duration_seconds || 0) / 60) }} min
        </template>
      </span>
      <span v-if="job">
        · Job #{{ job.id }}: <strong>{{ JOB_STATUS_LABELS[job.status] || job.status }}</strong> (tentativas: {{ job.attempts }})
        <strong v-if="job.error" class="error-inline"> · erro: {{ job.error }}</strong>
      </span>
      <div>
        <BaseButton v-if="snapshot" variant="outline" size="sm" @click="mapaAberto = !mapaAberto">
          {{ mapaAberto ? 'Ocultar mapa' : 'Ver traçado no mapa' }}
        </BaseButton>
      </div>
      <RouteMapSnapshot
        v-if="mapaAberto && snapshot"
        :snapshot="snapshot"
        title="Prévia do Traçado Calculado"
        height="240px"
      />
      <ol v-if="mapaAberto && stops.length" class="stop-times" aria-label="Horários das paradas">
        <li v-for="stop in stops" :key="stop.id" :class="{ done: stop.handled_at }">
          <span class="stop-pos">{{ stop.position }}</span>
          <span class="stop-name">{{ stop.point_snapshot?.name || `Parada ${stop.position}` }}</span>
          <span class="stop-time">
            {{ stop.handled_at ? `feito ${hhmm(stop.handled_at)}` : `previsto ${hhmm(stop.planned_at)}` }}
            <strong v-if="!stop.handled_at && stop.delay_seconds > 59" class="stop-late">
              → {{ hhmm(stop.expected_at) }}
            </strong>
          </span>
        </li>
      </ol>
    </div>

    <TravelAssignmentControls
      v-if="travel.status === 'scheduled'"
      :travel="travel"
      :veiculos-ativos="veiculosAtivos"
      :motoristas-ativos="motoristasAtivos"
      :busy="busy"
      @assign-vehicle="emit('assign-vehicle', $event)"
      @invite-driver="emit('invite-driver', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
.travel-box {
  padding: $space-4;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.travel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: $space-3;
}

.inline-actions,
.op-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  input,
  select {
    flex: 1 1 160px;
    padding: 9px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
  }
}

.sub-actions,
.snapshot-row {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.sub-meta {
  font-size: $text-xs;
  color: var(--text-muted);
  line-height: 1.5;

  strong {
    color: var(--text);
  }
}

.error-inline {
  color: var(--danger);
}

.stop-times {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: 26px 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 8px;
    background: var(--altbg);
    font-size: 0.85rem;

    &.done {
      opacity: 0.65;
    }
  }
}

.stop-pos {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
}

.stop-time {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.stop-late {
  color: #d97706;
}
</style>
