<script setup>
import { computed, reactive, shallowRef } from 'vue'
import { formatDateTimeBr } from '@/utils/formatters'
import BaseButton from '@/components/ui/BaseButton.vue'
import RouteMapSnapshot from '@/features/transport/components/RouteMapSnapshot.vue'

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
const veiculoSubstituto = shallowRef('')
const convite = reactive({ driverMembershipId: '', expiresAt: '' })

function submitVehicle() {
  if (!veiculoSubstituto.value) return
  emit('assign-vehicle', {
    travel: props.travel,
    vehicleId: veiculoSubstituto.value,
    onSuccess: () => {
      veiculoSubstituto.value = ''
    },
  })
}

function submitInvite() {
  emit('invite-driver', {
    travel: props.travel,
    driverMembershipId: convite.driverMembershipId,
    expiresAt: convite.expiresAt,
    onSuccess: () => {
      convite.driverMembershipId = ''
      convite.expiresAt = ''
    },
  })
}
</script>

<template>
  <div class="travel-box">
    <div class="travel-header">
      <div>
        <strong>Viagem #{{ travel.id }} · {{ serviceName }}</strong>
        <p class="sub-meta">
          Execução: <strong>{{ travel.status }}</strong> · Planejamento:
          <strong>{{ travel.planning_status }}</strong> · Revisão:
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
        estado <strong>{{ snapshot.state }}</strong>
        <template v-if="snapshot.distance_meters != null">
          · {{ (snapshot.distance_meters / 1000).toFixed(1) }} km ·
          {{ Math.round((snapshot.duration_seconds || 0) / 60) }} min
        </template>
      </span>
      <span v-if="job">
        · Job #{{ job.id }}: <strong>{{ job.status }}</strong> (tentativas: {{ job.attempts }})
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
    </div>

    <div v-if="travel.status === 'scheduled'" class="sub-actions">
      <div class="op-grid">
        <select v-model="veiculoSubstituto" :disabled="busy">
          <option value="">Substituir veículo...</option>
          <option v-for="v in veiculosAtivos" :key="v.id" :value="v.id">
            {{ v.plate }} ({{ v.capacity }} lug.)
          </option>
        </select>
        <BaseButton variant="outline" size="sm" :disabled="busy" @click="submitVehicle">
          Designar veículo
        </BaseButton>
      </div>

      <div class="op-grid">
        <select v-model="convite.driverMembershipId" :disabled="busy">
          <option value="">Convidar motorista substituto...</option>
          <option v-for="m in motoristasAtivos" :key="m.id" :value="m.id">
            {{ m.applicant_name }} (vínculo #{{ m.id }})
          </option>
        </select>
        <input v-model="convite.expiresAt" type="datetime-local" :disabled="busy" aria-label="Prazo do convite" />
        <BaseButton variant="outline" size="sm" :disabled="busy" @click="submitInvite">
          Convidar motorista
        </BaseButton>
      </div>
    </div>
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
</style>
