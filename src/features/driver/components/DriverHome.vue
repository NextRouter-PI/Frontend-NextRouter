<script setup>
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { state } from '@/stores/state'
import { useTransportState } from '@/stores/useTransportState'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import { useAccountScope } from '@/composables/useAccountScope'
import { useToast } from '@/composables/useToast'
import { loadMemberships } from '@/api/memberships'
import { estimateEtaMinutes, formatDistanceLabel, haversineMeters } from '@/utils/geo'
import DriverNavigationMap3D from '@/features/driver/components/DriverNavigationMap3D.vue'

const userLogged = computed(() => state.user)
const { state: transportState, loadDriverData, registrarPresencaParticipante } = useTransportState()
const { state: tracking, startViewerTracking, stopTracking } = useTravelTracking()
const scope = useAccountScope()
const { showToast } = useToast()

const sheetExpanded = ref(true)
const is3dMode = shallowRef(true)
const membershipLoaded = ref(false)
const openMembership = ref(null)
const openCompany = ref(null)
const dismissedPromptId = shallowRef(null)

const driverTransport = computed(() => transportState.driver)
const isTravelActive = computed(() => driverTransport.value?.travelStatus === 'in_progress')
const pendingBoardingPassengers = computed(() =>
  (driverTransport.value?.participations || []).filter((p) => p.status === 'allocated'),
)
const onBoardPassengers = computed(() =>
  (driverTransport.value?.participations || []).filter((p) => p.status === 'on_board'),
)
const nextPendingStop = computed(() =>
  (driverTransport.value?.stops || []).find((s) => s.state !== 'handled' && s.state !== 'completed') || null,
)
const nextStopDistanceMeters = computed(() => {
  const pt = nextPendingStop.value?.point_snapshot
  if (
    tracking.latitude == null ||
    tracking.longitude == null ||
    pt?.latitude == null ||
    pt?.longitude == null
  ) {
    return null
  }
  return haversineMeters(tracking.latitude, tracking.longitude, Number(pt.latitude), Number(pt.longitude))
})
const nextStopHud = computed(() => {
  if (!nextPendingStop.value) return null
  const names = (nextPendingStop.value.participants || [])
    .map((p) => p.passenger_name)
    .filter(Boolean)
    .join(', ')
  const dist = nextStopDistanceMeters.value
  return {
    title: nextPendingStop.value.point_snapshot?.name || `Parada #${nextPendingStop.value.position}`,
    subtitle: names || `Parada #${nextPendingStop.value.position}`,
    distanceLabel: dist != null ? formatDistanceLabel(dist) : '',
    etaLabel: dist != null ? `${estimateEtaMinutes(dist)} min` : '',
  }
})

// Prompt automático de confirmação de embarque ao aproximar (via WS ou distância <= 150m)
const approachingPassenger = computed(() => {
  if (!isTravelActive.value) return null
  const wsId = tracking.lastApproaching?.participationId
  if (wsId) {
    const found = pendingBoardingPassengers.value.find((p) => p.id === wsId)
    if (found && dismissedPromptId.value !== found.id) {
      return {
        participation: found,
        distanceMeters: tracking.lastApproaching.distanceMeters,
      }
    }
  }
  if (tracking.latitude != null && tracking.longitude != null) {
    for (const p of pendingBoardingPassengers.value) {
      if (dismissedPromptId.value === p.id) continue
      const pt = p.point_snapshot
      if (pt?.latitude == null || pt?.longitude == null) continue
      const dist = haversineMeters(tracking.latitude, tracking.longitude, Number(pt.latitude), Number(pt.longitude))
      if (dist <= 150) {
        return { participation: p, distanceMeters: Math.round(dist) }
      }
    }
  }
  return null
})

async function quickPresence(participation, kind) {
  if (transportState.busy || !isTravelActive.value) return
  const ok = await registrarPresencaParticipante(participation, kind)
  if (ok) {
    showToast(
      kind === 'boarded'
        ? `Embarque de ${participation.name || 'passageiro'} confirmado!`
        : `Ausência de ${participation.name || 'passageiro'} registrada.`,
      'success',
    )
    await loadDriverData(driverTransport.value?.travelId)
  }
}

watch(
  () => [driverTransport.value?.travelId, driverTransport.value?.travelStatus],
  ([travelId, status]) => {
    if (travelId && status === 'in_progress' && !tracking.tracking) {
      startViewerTracking(travelId)
    }
  },
)

watch(
  () => tracking.lastPresence?.at,
  () => {
    if (scope.current() && driverTransport.value?.travelId) {
      loadDriverData(driverTransport.value.travelId)
    }
  },
)

const isSharing = computed(() => tracking.tracking && tracking.role === 'driver')
const mapsUrl = computed(() => {
  if (tracking.latitude == null || tracking.longitude == null) return null
  return `https://www.google.com/maps?q=${tracking.latitude},${tracking.longitude}`
})
const updatedAtLabel = computed(() => {
  if (!tracking.updatedAt) return ''
  return new Date(tracking.updatedAt).toLocaleTimeString('pt-BR')
})
const routeStatusLabel = computed(() =>
  isSharing.value ? 'Rota em andamento' : 'Rota não iniciada',
)

async function fetchMembershipStatus() {
  const driverId = state.profiles?.driver?.id
  if (!driverId) {
    membershipLoaded.value = true
    return
  }
  try {
    const res = await loadMemberships({ driver: driverId }, { page: 1, signal: scope.signal })
    if (!scope.current()) return
    openMembership.value = res.openMembership
    openCompany.value = res.openCompany
  } catch {
    // Falha silenciosa: a tela de vínculos oferece diagnóstico detalhado
  } finally {
    if (scope.current()) membershipLoaded.value = true
  }
}

let driverPollTimer = null

onMounted(() => {
  fetchMembershipStatus()
  loadDriverData()
  driverPollTimer = setInterval(() => {
    if (scope.current() && !transportState.loading) {
      loadDriverData(driverTransport.value?.travelId)
    }
  }, 6000)
})

onUnmounted(() => {
  if (driverPollTimer) {
    clearInterval(driverPollTimer)
    driverPollTimer = null
  }
  if (tracking.role === 'viewer') stopTracking()
})
</script>

<template>
  <div class="home-page">
    <DriverNavigationMap3D
      :snapshot="driverTransport?.snapshot || null"
      :stops="driverTransport?.stops || []"
      :is3d="is3dMode"
    />

    <div v-if="nextStopHud" class="gps-top-hud" role="status" aria-label="Próxima parada GPS">
      <div class="gps-hud-icon">
        <span class="mdi mdi-navigation-variant" aria-hidden="true"></span>
      </div>
      <div class="gps-hud-info">
        <strong class="gps-hud-title">{{ nextStopHud.title }}</strong>
        <span class="gps-hud-sub">
          {{ nextStopHud.subtitle }}
          <template v-if="nextStopHud.distanceLabel"> · {{ nextStopHud.distanceLabel }}</template>
          <template v-if="nextStopHud.etaLabel"> ({{ nextStopHud.etaLabel }})</template>
        </span>
      </div>
      <button
        type="button"
        class="gps-mode-toggle"
        :aria-pressed="is3dMode"
        @click="is3dMode = !is3dMode"
      >
        {{ is3dMode ? '3D' : '2D' }}
      </button>
    </div>

    <Transition name="fade-slide">
      <div v-if="approachingPassenger" class="approaching-prompt" role="alert">
        <div class="approaching-header">
          <img
            v-if="approachingPassenger.participation.profile_picture_url"
            :src="approachingPassenger.participation.profile_picture_url"
            :alt="approachingPassenger.participation.name"
            class="approaching-avatar"
          />
          <span v-else class="approaching-avatar-fallback">
            {{ (approachingPassenger.participation.name || 'P').charAt(0).toUpperCase() }}
          </span>
          <div class="approaching-info">
            <span class="approaching-badge">
              Chegando ao embarque · {{ approachingPassenger.distanceMeters }} m
            </span>
            <strong>{{ approachingPassenger.participation.name || 'Passageiro' }}</strong>
          </div>
          <button
            type="button"
            class="approaching-dismiss"
            aria-label="Dispensar"
            @click="dismissedPromptId = approachingPassenger.participation.id"
          >
            <span class="mdi mdi-close" aria-hidden="true"></span>
          </button>
        </div>
        <div class="approaching-actions">
          <button
            type="button"
            class="approaching-confirm-btn"
            :disabled="transportState.busy"
            @click="quickPresence(approachingPassenger.participation, 'boarded')"
          >
            <span class="mdi mdi-check-circle-outline" aria-hidden="true"></span>
            Confirmar Embarque
          </button>
          <button
            type="button"
            class="approaching-noshow-btn"
            :disabled="transportState.busy"
            @click="quickPresence(approachingPassenger.participation, 'no_show')"
          >
            Ausente
          </button>
        </div>
      </div>
    </Transition>

    <section class="map-sheet" :class="{ collapsed: !sheetExpanded }" aria-label="Resumo operacional do motorista">
      <button
        type="button"
        class="sheet-handle-btn"
        :aria-expanded="sheetExpanded"
        @click="sheetExpanded = !sheetExpanded"
      >
        <span class="sheet-pill" aria-hidden="true"></span>
        <div class="sheet-summary-row">
          <div class="sheet-location">
            <span class="mdi mdi-steering" aria-hidden="true"></span>
            <span>{{ openCompany?.trade_name || 'Painel do Motorista' }}</span>
          </div>
          <div class="sheet-status-right">
            <span class="route-status-pill" :class="isSharing ? 'live' : 'stopped'">
              <span class="status-dot" aria-hidden="true"></span>
              {{ routeStatusLabel }}
            </span>
            <span
              class="mdi mdi-chevron-up chevron-icon"
              :class="{ rotated: sheetExpanded }"
              aria-hidden="true"
            ></span>
          </div>
        </div>
      </button>

      <div
        class="sheet-body-collapse"
        :class="{ open: sheetExpanded }"
        :aria-hidden="!sheetExpanded"
        :inert="!sheetExpanded || undefined"
      >
        <div class="sheet-body-inner">
          <div class="sheet-body">
          <div class="sheet-user-row">
            <div class="sheet-avatar">
              <span class="mdi mdi-steering" aria-hidden="true"></span>
            </div>
            <div class="sheet-user-info">
              <h1>Olá, {{ userLogged?.name }}</h1>
              <span class="sheet-role-badge">Motorista</span>
            </div>
          </div>

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

          <Transition name="fade-slide" mode="out-in">
            <div v-if="!membershipLoaded" key="loading" class="sheet-panel sheet-skeleton" role="status" aria-label="Carregando vínculo">
              <span class="sheet-skeleton-bar title"></span>
              <span class="sheet-skeleton-bar line"></span>
              <span class="sheet-skeleton-bar line short"></span>
            </div>

            <div v-else-if="!openMembership" key="none" class="sheet-panel">
              <p class="panel-title">Sem vínculo empresarial</p>
              <p class="panel-meta">
                Pesquise uma empresa aprovada e envie seu pedido de vínculo para receber viagens designadas.
              </p>
              <div class="sheet-actions">
                <RouterLink to="/empresas" class="sheet-cta">Buscar empresas</RouterLink>
                <RouterLink to="/vinculos" class="sheet-cta-outline">Meus vínculos</RouterLink>
              </div>
            </div>

            <div v-else-if="openMembership?.status === 'pending'" key="pending" class="sheet-panel pending">
              <p class="panel-title">Solicitação pendente</p>
              <p class="panel-meta">
                Aguardando aprovação de <strong>{{ openCompany?.trade_name || `Empresa #${openMembership.company}` }}</strong>.
              </p>
              <div class="sheet-actions">
                <RouterLink to="/vinculos" class="sheet-cta-outline">Acompanhar pedido</RouterLink>
              </div>
            </div>

            <div v-else-if="openMembership?.status === 'active'" key="active" class="sheet-panel active">
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
                <RouterLink to="/historico" class="sheet-cta">Minhas viagens</RouterLink>
                <RouterLink to="/lista" class="sheet-cta-outline">Lista operacional</RouterLink>
              </div>
            </div>
          </Transition>
          </div>
        </div>
      </div>
    </section>
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

.map-sheet {
  position: relative;
  z-index: 2;
  width: 100%;
  background: var(--chrome-bg);
  color: var(--chrome-text);
  border-top: 2px solid var(--primary);
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.35);
  animation: sheet-slide-up 0.34s $ease-fluid;
}

@keyframes sheet-slide-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sheet-body-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.34s $ease-fluid,
    opacity 0.24s $ease-fluid;

  &.open {
    grid-template-rows: 1fr;
    opacity: 1;
  }
}

.sheet-body-inner {
  overflow: hidden;
  min-height: 0;
}

.sheet-handle-btn {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 18px 12px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
}

.sheet-pill {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
}

.sheet-summary-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sheet-location {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-on-primary);
}

.sheet-location .mdi {
  color: var(--primary);
  font-size: 1.15rem;
}

.sheet-status-right {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.route-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  font-weight: 600;
}

.route-status-pill .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.route-status-pill.live {
  color: var(--success);
}

.route-status-pill.live .status-dot {
  background: var(--success);
}

.route-status-pill.stopped {
  color: var(--danger);
}

.route-status-pill.stopped .status-dot {
  background: var(--danger);
}

.chevron-icon {
  font-size: 1.25rem;
  color: var(--chrome-muted);
  transition: transform $duration-normal $ease-fluid;

  &.rotated {
    transform: rotate(180deg);
  }
}

.sheet-skeleton {
  min-height: 92px;
  justify-content: center;
}

.sheet-skeleton-bar {
  display: block;
  height: 11px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.14) 50%, rgba(255, 255, 255, 0.06) 75%);
  background-size: 200% 100%;
  animation: sheet-shimmer 1.35s ease-in-out infinite;

  &.title {
    width: 46%;
    height: 14px;
  }

  &.line {
    width: 90%;
  }

  &.short {
    width: 64%;
  }
}

@keyframes sheet-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.sheet-body {
  padding: 2px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sheet-user-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sheet-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-primary-tint);
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
  flex-shrink: 0;
}

.sheet-user-info h1 {
  margin: 0 0 2px;
  font-size: 1.12rem;
  color: var(--color-on-primary);
}

.sheet-role-badge {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--primary);
}

.sheet-panel {
  padding: 14px;
  border-radius: 14px;
  background: var(--chrome-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sheet-panel.pending {
  border-color: rgba(234, 179, 8, 0.4);
}

.sheet-panel.active,
.sheet-panel.live-panel {
  border-color: rgba(34, 197, 94, 0.35);
}

.panel-title {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--color-on-primary);
}

.panel-meta {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--chrome-muted);
}

.panel-meta strong {
  color: var(--color-on-primary);
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

.sheet-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.sheet-cta,
.sheet-cta-outline {
  flex: 1 1 130px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.2s var(--ease-fluid), transform 0.16s var(--ease-fluid);
}

.sheet-cta {
  background: var(--primary);
  color: var(--color-on-primary);
}

.sheet-cta:hover {
  background: var(--primary-hover);
}

.sheet-cta-outline {
  background: transparent;
  color: var(--color-on-primary);
  border: 1.5px solid rgba(255, 255, 255, 0.25);
}

.sheet-cta-outline:hover {
  border-color: var(--primary);
  color: var(--primary);
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

.gps-top-hud {
  position: fixed;
  top: calc(var(--header-height) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  width: min(92vw, 480px);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(18, 18, 22, 0.92);
  color: #ffffff;
  border: 1.5px solid rgba(236, 131, 20, 0.55);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(8px);
}

.gps-hud-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.gps-hud-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gps-hud-title {
  font-size: 0.94rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gps-hud-sub {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.76);
}

.gps-mode-toggle {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
}

.approaching-prompt {
  position: fixed;
  top: calc(var(--header-height) + 86px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  width: min(92vw, 420px);
  padding: 14px;
  border-radius: 18px;
  background: rgba(20, 20, 24, 0.96);
  color: #ffffff;
  border: 2px solid var(--primary);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.approaching-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.approaching-avatar,
.approaching-avatar-fallback {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  flex-shrink: 0;
}

.approaching-avatar {
  object-fit: cover;
  border: 2px solid var(--primary);
}

.approaching-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: #ffffff;
  font-weight: 800;
}

.approaching-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.approaching-badge {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.approaching-dismiss {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  font-size: 1.2rem;
  cursor: pointer;
}

.approaching-actions {
  display: flex;
  gap: 8px;
}

.approaching-confirm-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: var(--success);
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
  }
}

.approaching-noshow-btn {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

@media (min-width: 901px) {
  .home-page {
    min-height: calc(100vh - var(--header-height));
    margin-bottom: -$space-6;
    align-items: flex-end;
    padding: 24px;
  }

  .map-sheet {
    max-width: 390px;
    border: 1.5px solid rgba(236, 131, 20, 0.45);
    border-radius: 20px;
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.42);
  }
}
</style>
