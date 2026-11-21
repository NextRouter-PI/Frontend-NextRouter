<script setup>
import { onMounted, shallowRef } from 'vue'
import { useAccountScope } from '@/composables/useAccountScope'
import { useOpenMembershipSummary } from '@/features/memberships/composables/useOpenMembershipSummary'
import { useDriverHomeLive } from '@/features/driver/composables/useDriverHomeLive'
import DriverNavigationMap3D from '@/features/driver/components/DriverNavigationMap3D.vue'
import DriverGpsHud from '@/features/driver/components/DriverGpsHud.vue'
import DriverApproachingPrompt from '@/features/driver/components/DriverApproachingPrompt.vue'
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
} = useOpenMembershipSummary({ roleKey: 'driver', scope })

const {
  transportState,
  tracking,
  is3dMode,
  dismissedPromptId,
  driverTransport,
  isTravelActive,
  pendingBoardingPassengers,
  onBoardPassengers,
  nextStopHud,
  approachingPassenger,
  isSharing,
  mapsUrl,
  updatedAtLabel,
  routeStatusLabel,
  quickPresence,
  startLivePolling,
} = useDriverHomeLive({ scope })

onMounted(() => {
  fetchMembershipStatus()
  startLivePolling()
})
</script>

<template>
  <div class="home-page">
    <DriverNavigationMap3D
      :snapshot="driverTransport?.snapshot || null"
      :stops="driverTransport?.stops || []"
      :is3d="is3dMode"
    />

    <DriverGpsHud :hud="nextStopHud" :is3d="is3dMode" @toggle-3d="is3dMode = !is3dMode" />

    <DriverApproachingPrompt
      :approaching="approachingPassenger"
      :busy="transportState.busy"
      @dismiss="dismissedPromptId = $event"
      @presence="quickPresence"
    />

    <HomeMapSheet
      v-model:expanded="sheetExpanded"
      aria-label="Resumo operacional do motorista"
      header-icon="mdi-steering"
      :header-title="openCompany?.trade_name || 'Painel do Motorista'"
      :user-name="auth.user?.name"
      avatar-icon="mdi-steering"
      role-label="Motorista"
    >
      <template #summary-status>
        <span class="route-status-pill" :class="isSharing ? 'live' : 'stopped'">
          <span class="status-dot" aria-hidden="true"></span>
          {{ routeStatusLabel }}
        </span>
      </template>

      <div v-if="isSharing" class="sheet-panel live-panel">
        <div class="tracking-header">
          <span class="pulse-dot"></span>
          Compartilhando localização ao vivo
        </div>
        <p v-if="tracking.latitude != null" class="panel-meta">
          {{ tracking.latitude.toFixed(6) }}, {{ tracking.longitude.toFixed(6) }}
          <span v-if="updatedAtLabel"> · {{ updatedAtLabel }}</span>
        </p>
        <p v-else class="panel-meta">Obtendo localização...</p>
        <p v-if="tracking.error" class="panel-error">{{ tracking.error }}</p>
        <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener noreferrer" class="sheet-cta-outline">
          Ver no Google Maps <span class="mdi mdi-open-in-new" aria-hidden="true"></span>
        </a>
      </div>

      <HomeMembershipStatusPanel
        :loaded="membershipLoaded"
        :membership="openMembership"
        :company="openCompany"
        none-description="Pesquise uma empresa aprovada e envie seu pedido de vínculo para receber viagens designadas."
      >
        <template #active>
          <p class="panel-title">
            {{ openCompany?.trade_name || `Empresa #${openMembership.company}` }}
          </p>
          <div v-if="pendingBoardingPassengers.length" class="pending-boarding-box">
            <p class="pending-boarding-title">
              Faltam embarcar ({{ pendingBoardingPassengers.length }}):
            </p>
            <ul class="pending-boarding-list">
              <li v-for="p in pendingBoardingPassengers" :key="p.id">
                <span class="pending-passenger-name">
                  <span class="mdi mdi-account-clock-outline" aria-hidden="true"></span>
                  <span>{{ p.name || `Passageiro #${p.eligibility}` }}</span>
                </span>
                <button
                  v-if="isTravelActive"
                  type="button"
                  class="quick-board-btn"
                  :disabled="transportState.busy"
                  @click="quickPresence(p, 'boarded')"
                >
                  Embarcou
                </button>
              </li>
            </ul>
          </div>
          <p v-else-if="onBoardPassengers.length" class="panel-meta">
            Todos os passageiros já embarcaram ({{ onBoardPassengers.length }} a bordo).
          </p>
          <p v-else class="panel-meta">Acesse suas viagens designadas para iniciar a rota e registrar embarques.</p>
          <div class="sheet-actions">
            <RouterLink to="/history" class="sheet-cta">Minhas viagens</RouterLink>
            <RouterLink to="/list" class="sheet-cta-outline">Lista operacional</RouterLink>
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

.route-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  font-weight: 600;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  &.live {
    color: var(--success);

    .status-dot {
      background: var(--success);
    }
  }

  &.stopped {
    color: var(--danger);

    .status-dot {
      background: var(--danger);
    }
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
}

.panel-error {
  margin: 0;
  font-size: 0.78rem;
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

.sheet-cta-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  background: transparent;
  color: var(--color-on-primary);
  border: 1.5px solid rgba(255, 255, 255, 0.25);

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
}

.pending-boarding-box {
  margin: 6px 0 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(236, 131, 20, 0.12);
  border: 1px solid rgba(236, 131, 20, 0.3);
}

.pending-boarding-title {
  margin: 0 0 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--primary);
}

.pending-boarding-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.84rem;
    color: var(--chrome-text);
  }
}

.pending-passenger-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.quick-board-btn {
  padding: 4px 10px;
  border-radius: 999px;
  border: none;
  background: var(--primary);
  color: var(--color-on-primary);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
</style>
