<script setup>
import { computed, onMounted, shallowRef } from 'vue'
import { useAccountScope } from '@/composables/useAccountScope'
import { useOpenMembershipSummary } from '@/features/memberships/composables/useOpenMembershipSummary'
import { usePassengerHomeLive } from '@/features/passenger/composables/usePassengerHomeLive'
import MapBackground from '@/components/ui/MapBackground.vue'
import HomeMapSheet from '@/features/transport/components/HomeMapSheet.vue'
import HomeMembershipStatusPanel from '@/features/transport/components/HomeMembershipStatusPanel.vue'

const scope = useAccountScope()
const sheetExpanded = shallowRef(true)

const {
  auth,
  membershipLoaded,
  openMembership,
  openCompany,
  fetchMembershipStatus,
} = useOpenMembershipSummary({ roleKey: 'passenger', scope })

const {
  transportState,
  tracking,
  isSharing,
  activeTravel,
  participationStatus,
  participationStatusLabel,
  passengerPoint,
  etaSummary,
  timingInfo,
  mapsUrl,
  updatedAtLabel,
  startLivePolling,
} = usePassengerHomeLive({ scope })

const locationSummary = computed(() => {
  const parts = [auth.user?.city, auth.user?.neighborhood].filter(Boolean)
  if (parts.length) return parts.join(', ')
  if (openCompany.value?.trade_name) return openCompany.value.trade_name
  return 'Sua localização'
})

const statusDotClass = computed(() => {
  if (isSharing.value) return 'live'
  if (openMembership.value?.status === 'active') return 'active'
  if (openMembership.value?.status === 'pending') return 'pending'
  return 'idle'
})

onMounted(() => {
  startLivePolling()
  fetchMembershipStatus()
})
</script>

<template>
  <div class="home-page">
    <MapBackground
      self-marker-label="Seu ponto"
      tracking-marker-label="Motorista"
      tracking-marker-icon="mdi-bus"
      :snapshot="transportState.passenger?.snapshot || null"
      :stops="transportState.passenger?.stops || []"
      :target-point="passengerPoint"
    />

    <HomeMapSheet
      v-model:expanded="sheetExpanded"
      aria-label="Resumo da viagem e vínculo"
      header-icon="mdi-map-marker-outline"
      :header-title="locationSummary"
      :user-name="auth.user?.name"
      avatar-icon="mdi-account"
      role-label="Passageiro"
      role-icon="mdi-seat-passenger"
    >
      <template #summary-status>
        <span class="status-dot" :class="statusDotClass" aria-hidden="true"></span>
      </template>

      <div v-if="isSharing" class="sheet-panel live-panel">
        <div class="tracking-header">
          <span class="pulse-dot"></span>
          Motorista em rota (ao vivo)
        </div>
        <p v-if="etaSummary" class="eta-highlight">
          <BaseIcon name="mdi-clock-fast" />
          <span>{{ etaSummary }}</span>
        </p>
        <div class="trip-steps" aria-label="Etapas da viagem">
          <span class="trip-step done">Em rota</span>
          <span class="trip-step" :class="{ done: ['on_board', 'dropped_off'].includes(participationStatus) }">
            A bordo
          </span>
          <span class="trip-step" :class="{ done: participationStatus === 'dropped_off' }">
            Concluída
          </span>
        </div>
        <p v-if="participationStatusLabel" class="panel-meta">
          Seu embarque: <strong>{{ participationStatusLabel }}</strong>
        </p>
        <p v-if="timingInfo?.delayMinutes > 0" class="panel-meta delay-note">
          <BaseIcon name="mdi-clock-alert-outline" /> Atraso de cerca de {{ timingInfo.delayMinutes }} min, previsões já atualizadas
        </p>
        <p v-if="timingInfo?.arrival" class="panel-meta">Chegada prevista ao destino: <strong>{{ timingInfo.arrival }}</strong></p>
        <p v-if="tracking.latitude != null" class="panel-meta">
          {{ tracking.latitude.toFixed(6) }}, {{ tracking.longitude.toFixed(6) }}
          <span v-if="updatedAtLabel"> · {{ updatedAtLabel }}</span>
          <span v-if="tracking.stale"> (desatualizado)</span>
        </p>
        <p v-else class="panel-meta">Aguardando localização do motorista...</p>
        <p v-if="tracking.error" class="panel-error" role="alert">{{ tracking.error }}</p>
        <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener noreferrer" class="sheet-cta">
          Abrir no Google Maps <BaseIcon name="mdi-open-in-new" />
        </a>
      </div>

      <HomeMembershipStatusPanel
        :loaded="membershipLoaded"
        :membership="openMembership"
        :company="openCompany"
        none-description="Pesquise uma empresa aprovada e envie seu pedido de vínculo para acessar atendimentos e rotas."
      >
        <template #active>
          <p class="panel-title">
            {{ openCompany?.trade_name || `Empresa #${openMembership.company}` }}
          </p>
          <p v-if="activeTravel" class="panel-meta">
            Próxima viagem #{{ activeTravel.id }} · {{ activeTravel.date }}
            ({{ activeTravel.direction === 'outbound' ? 'Ida' : 'Retorno' }})
          </p>
          <p v-if="activeTravel && timingInfo?.planned" class="panel-meta">
            Embarque previsto às <strong>{{ timingInfo.planned }}</strong>
            <template v-if="timingInfo.arrival"> · chegada às <strong>{{ timingInfo.arrival }}</strong></template>
          </p>
          <p v-else class="panel-meta">Vínculo ativo. Responda aos atendimentos abertos na aba Lista.</p>
          <div class="sheet-actions">
            <RouterLink to="/list" class="sheet-cta">Responder atendimentos</RouterLink>
            <RouterLink to="/history" class="sheet-cta-outline">Histórico</RouterLink>
          </div>
        </template>
      </HomeMembershipStatusPanel>
    </HomeMapSheet>
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  position: relative;
  min-height: calc(100vh - var(--header-height) - var(--bottom-nav-height));
  margin-bottom: -$space-4;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;

  &.live,
  &.active {
    background: var(--success);
  }

  &.pending {
    background: var(--warning);
  }

  &.idle {
    background: var(--chrome-muted);
  }
}

.sheet-panel.live-panel {
  padding: 14px;
  border-radius: 14px;
  background: var(--chrome-surface);
  border: 1px solid rgba(34, 197, 94, 0.35);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-meta {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--chrome-muted);

  strong {
    color: var(--color-on-primary);
  }
}

.panel-error {
  margin: 0;
  font-size: 0.8rem;
  color: var(--danger);
}

.tracking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--success);
}

.pulse-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--success);
  animation: pulse 1.5s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
  70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.sheet-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  background: var(--primary);
  color: var(--color-on-primary);

  &:hover {
    background: var(--primary-hover);
  }
}

.eta-highlight {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(236, 131, 20, 0.16);
  color: var(--primary);
  font-size: 0.84rem;
  font-weight: 700;
}

.trip-steps {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0;
}

.trip-step {
  flex: 1;
  text-align: center;
  padding: 4px 6px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  color: var(--chrome-muted);

  &.done {
    background: var(--primary);
    color: var(--color-on-primary);
  }
}

@media (min-width: 901px) {
  .home-page {
    min-height: calc(100vh - var(--header-height));
    margin-bottom: -$space-6;
    align-items: flex-end;
    padding: 24px;
  }
}

.delay-note {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #d97706;
  font-weight: 600;
}
</style>
