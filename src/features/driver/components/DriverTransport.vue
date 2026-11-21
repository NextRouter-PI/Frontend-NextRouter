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
import TransportHistoryNotifications from '@/features/transport/components/TransportHistoryNotifications.vue'
import DriverInvitationsCard from '@/features/driver/components/transport/DriverInvitationsCard.vue'
import DriverTravelStopsCard from '@/features/driver/components/transport/DriverTravelStopsCard.vue'
import DriverActiveTravelCard from '@/features/driver/components/transport/DriverActiveTravelCard.vue'
import DriverRouteSnapshotCard from '@/features/driver/components/transport/DriverRouteSnapshotCard.vue'

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

    <Transition name="fade-slide" mode="out-in">
      <EmptyState
        v-if="state.loading"
        key="loading"
        loading
        description="Carregando viagens e convites do motorista..."
      />

      <div v-else-if="transport" key="content" class="transport-stack">
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
          <DriverActiveTravelCard
            :transport="transport"
            :busy="state.busy"
            @toggle-travel="handleStartOrFinish"
            @unavailable="informarIndisponibilidade"
          />

          <BaseCard v-if="isInProgress" title="Localização ao Vivo (Mesma Origem)">
            <LiveLocationMap marker-label="Você" />
            <StatusBanner v-if="tracking.error" variant="danger" :message="tracking.error" />
          </BaseCard>

          <DriverRouteSnapshotCard :transport="transport" />

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
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.driver-transport-page,
.transport-stack {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.driver-transport-page {
  @include section-container(120px);
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
</style>
