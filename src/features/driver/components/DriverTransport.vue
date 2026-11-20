<script setup>
import { computed, onMounted } from 'vue'
import { SERVICE_DIRECTIONS } from '@/constants'
import { useTransportState } from '@/stores/useTransportState'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LiveLocationMap from '@/components/ui/LiveLocationMap.vue'
import RouteMapSnapshot from '@/features/transport/components/RouteMapSnapshot.vue'
import TransportHistoryNotifications from '@/features/transport/components/TransportHistoryNotifications.vue'
import DriverInvitationsCard from '@/features/driver/components/transport/DriverInvitationsCard.vue'
import DriverTravelStopsCard from '@/features/driver/components/transport/DriverTravelStopsCard.vue'

const {
  state,
  loadDriverData,
  iniciarViagemDesignada,
  finalizarViagemDesignada,
  informarIndisponibilidade,
  registrarPresencaParticipante,
  tratarParadaPercurso,
  responderConviteMotorista,
} = useTransportState()
const { state: tracking, startDriverTracking, stopTracking } = useTravelTracking()

const transport = computed(() => state.driver)
const isInProgress = computed(() => transport.value?.travelStatus === 'in_progress')

const pendingInvitations = computed(() =>
  (transport.value?.invitations || []).filter((inv) => inv.status === 'pending' && inv.is_current),
)

async function handleStartOrFinish() {
  const travel = transport.value?.travel
  if (!travel || state.busy) return

  if (isInProgress.value) {
    const ok = await finalizarViagemDesignada(travel)
    if (ok) stopTracking()
  } else {
    const ok = await iniciarViagemDesignada(travel)
    if (ok) startDriverTracking(travel.id)
  }
}

onMounted(async () => {
  await loadDriverData()
  if (transport.value?.travelStatus === 'in_progress' && transport.value?.travelId) {
    startDriverTracking(transport.value.travelId)
  }
})
</script>

<template>
  <div class="driver-transport-page">
    <PageHeader title="Minhas Viagens e Execução" accent>
      <template #actions>
        <BaseButton
          variant="outline"
          size="sm"
          icon="mdi-refresh"
          :disabled="state.loading || state.busy"
          @click="loadDriverData(transport?.travelId)"
        >
          Atualizar
        </BaseButton>
      </template>
    </PageHeader>

    <StatusBanner variant="success" :message="state.notice" />
    <StatusBanner variant="danger" :message="state.error" />

    <EmptyState
      v-if="state.loading"
      loading
      description="Carregando viagens e convites do motorista..."
    />

    <template v-else-if="transport">
      <DriverInvitationsCard
        :invitations="pendingInvitations"
        :busy="state.busy"
        @respond="responderConviteMotorista"
      />

      <div v-if="transport.travels.length" class="travel-chips" role="tablist" aria-label="Viagens designadas">
        <button
          v-for="t in transport.travels"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="t.id === transport.travelId"
          :class="['travel-chip', { active: t.id === transport.travelId }]"
          :disabled="state.busy"
          @click="loadDriverData(t.id)"
        >
          #{{ t.id }} · {{ t.date }} ({{ t.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }}) · {{ t.status }}
        </button>
      </div>

      <template v-if="transport.travel">
        <BaseCard
          :title="`Viagem #${transport.travel.id} · ${transport.travel.date} (${transport.travel.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno'})`"
          :subtitle="`Revisão ${transport.revision} · Publicada: ${transport.publishedRevision ?? 'nenhuma'} · Planejamento: ${transport.planningStatus}`"
        >
          <template #actions>
            <span class="status-badge" :class="isInProgress ? 'active' : 'inactive'">
              {{ transport.travelStatus }}
            </span>
          </template>

          <p class="sub-text">
            Veículo designado: <strong>{{ transport.vehicleId ? `#${transport.vehicleId}` : 'Não atribuído' }}</strong> ·
            Participantes: <strong>{{ transport.passageirosNaRota }}</strong> ·
            Embarcados: <strong>{{ transport.passageirosEmbarcados }}</strong> ·
            Pendentes: <strong>{{ transport.passageirosPendentes }}</strong>
          </p>

          <StatusBanner
            v-if="!isInProgress && !transport.publicationCurrent"
            variant="warning"
            :message="`Bloqueio de início: a revisão atual (${transport.revision}) ainda não está pronta e publicada pela empresa.`"
          />

          <StatusBanner
            v-if="isInProgress && (transport.passageirosEmbarcados > 0 || transport.passageirosPendentes > 0)"
            variant="warning"
            message="Para finalizar a viagem, registre embarque/ausência de todos os participantes alocados e o desembarque de quem está a bordo."
          />

          <div class="action-row">
            <BaseButton
              v-if="transport.travelStatus === 'scheduled' || isInProgress"
              :icon="isInProgress ? 'mdi-flag-checkered' : 'mdi-arrow-right'"
              :disabled="state.busy || (!isInProgress && !transport.publicationCurrent)"
              @click="handleStartOrFinish"
            >
              {{ isInProgress ? 'Finalizar Viagem' : `Iniciar Viagem Publicada (Revisão ${transport.revision})` }}
            </BaseButton>

            <BaseButton
              v-if="transport.travelStatus === 'scheduled'"
              variant="outline"
              :disabled="state.busy"
              @click="informarIndisponibilidade(transport.travel)"
            >
              Informar Indisponibilidade
            </BaseButton>
          </div>
        </BaseCard>

        <BaseCard v-if="isInProgress" title="Localização ao Vivo (Mesma Origem)">
          <LiveLocationMap marker-label="Você" />
          <StatusBanner v-if="tracking.error" variant="danger" :message="tracking.error" />
        </BaseCard>

        <BaseCard title="Percurso Calculado (Snapshot)">
          <div class="route-info">
            <div class="route-point">
              <span class="route-dot origin"></span>
              <div>
                <span class="route-label">Origem</span>
                <span class="route-value">{{ transport.rota.ponto_origem }}</span>
                <span class="route-time">{{ transport.rota.horario_saida }}</span>
              </div>
            </div>
            <div class="route-point">
              <span class="route-dot destination"></span>
              <div>
                <span class="route-label">Destino</span>
                <span class="route-value">{{ transport.rota.ponto_destino }}</span>
                <span class="route-time">{{ transport.rota.horario_chegada }}</span>
              </div>
            </div>
          </div>

          <p v-if="transport.rota.distanciaKm" class="sub-text">
            Distância estimada: {{ transport.rota.distanciaKm }} km · Duração: {{ transport.rota.duracaoMin }} min
          </p>

          <RouteMapSnapshot
            v-if="transport.snapshot"
            :snapshot="transport.snapshot"
            :stops="transport.stops"
            title="Mapa do Percurso e Paradas"
          />
        </BaseCard>

        <DriverTravelStopsCard
          :stops="transport.stops"
          :participations="transport.participations"
          :is-in-progress="isInProgress"
          :busy="state.busy"
          @handle-stop="tratarParadaPercurso"
          @record-presence="registrarPresencaParticipante"
        />
      </template>

      <EmptyState
        v-else
        icon="mdi-bus-clock"
        title="Sem viagens designadas"
        description="Você não possui viagens designadas no momento."
      />

      <TransportHistoryNotifications />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.driver-transport-page {
  padding: $space-5 $space-4 120px;
  min-height: 100vh;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.travel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.travel-chip {
  padding: $space-2 $space-3;
  border-radius: $radius-pill;
  background: var(--color-surface);
  color: var(--text);
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  font-size: $text-sm;
  font-weight: $font-semibold;
  transition: all $duration-normal $ease-fluid;

  &.active {
    background: var(--primary);
    color: var(--color-on-primary);
    outline-color: var(--primary);
  }
}

.status-badge {
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  font-size: $text-xs;
  font-weight: $font-bold;

  &.active {
    background: var(--success-soft);
    color: var(--success);
  }

  &.inactive {
    background: var(--color-primary-soft);
    color: var(--primary);
  }
}

.sub-text {
  font-size: $text-sm;
  color: var(--text-muted);
  line-height: 1.5;

  strong {
    color: var(--text);
  }
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.route-info {
  display: grid;
  gap: $space-3;
}

.route-point {
  display: flex;
  align-items: flex-start;
  gap: $space-3;

  > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}

.route-dot {
  width: 12px;
  height: 12px;
  border-radius: $radius-round;
  margin-top: 4px;
  flex-shrink: 0;

  &.origin {
    background: var(--primary);
  }

  &.destination {
    background: var(--success);
  }
}

.route-label {
  font-size: $text-xs;
  font-weight: $font-bold;
  color: var(--primary);
  text-transform: uppercase;
}

.route-value {
  font-size: $text-md;
  font-weight: $font-semibold;
  color: var(--text);
}

.route-time {
  font-size: $text-xs;
  color: var(--text-muted);
}
</style>
