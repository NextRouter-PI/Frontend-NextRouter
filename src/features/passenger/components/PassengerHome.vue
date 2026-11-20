<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { state } from '@/stores/state'
import { useTransportState } from '@/stores/useTransportState'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import { useAccountScope } from '@/composables/useAccountScope'
import { loadMemberships } from '@/api/memberships'
import MapBackground from '@/components/ui/MapBackground.vue'

const userLogged = computed(() => state.user)
const { state: transportState, loadPassengerData } = useTransportState()
const { state: tracking, startViewerTracking, stopTracking } = useTravelTracking()
const scope = useAccountScope()

const sheetExpanded = ref(true)
const membershipLoaded = ref(false)
const openMembership = ref(null)
const openCompany = ref(null)

const isSharing = computed(() => tracking.tracking && tracking.role === 'viewer')
const activeTravel = computed(() => transportState.passenger?.travel || null)
const mapsUrl = computed(() => {
  if (tracking.latitude == null || tracking.longitude == null) return null
  return `https://www.google.com/maps?q=${tracking.latitude},${tracking.longitude}`
})
const updatedAtLabel = computed(() => {
  if (!tracking.updatedAt) return ''
  return new Date(tracking.updatedAt).toLocaleTimeString('pt-BR')
})
const locationSummary = computed(() => {
  const parts = [userLogged.value?.city, userLogged.value?.neighborhood].filter(Boolean)
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

async function fetchMembershipStatus() {
  const passengerId = state.profiles?.passenger?.id
  if (!passengerId) {
    membershipLoaded.value = true
    return
  }
  try {
    const res = await loadMemberships({ passenger: passengerId }, { page: 1, signal: scope.signal })
    if (!scope.current()) return
    openMembership.value = res.openMembership
    openCompany.value = res.openCompany
  } catch {
    // Falha silenciosa: a tela de vínculos oferece diagnóstico detalhado
  } finally {
    if (scope.current()) membershipLoaded.value = true
  }
}

watch(
  () => transportState.passenger,
  (passenger) => {
    const partStatus = passenger?.currentParticipation?.status
    if (
      passenger?.travelId &&
      passenger.travelStatus === 'in_progress' &&
      ['allocated', 'on_board'].includes(partStatus)
    ) {
      startViewerTracking(passenger.travelId)
    } else {
      stopTracking()
    }
  },
)

onMounted(() => {
  loadPassengerData()
  fetchMembershipStatus()
})

onUnmounted(() => {
  stopTracking()
})
</script>

<template>
  <div class="home-page">
    <MapBackground
      self-marker-label="Você"
      tracking-marker-label="Motorista"
      tracking-marker-icon="mdi-bus"
    />

    <section class="map-sheet" :class="{ collapsed: !sheetExpanded }" aria-label="Resumo da viagem e vínculo">
      <button
        type="button"
        class="sheet-handle-btn"
        :aria-expanded="sheetExpanded"
        @click="sheetExpanded = !sheetExpanded"
      >
        <span class="sheet-pill" aria-hidden="true"></span>
        <div class="sheet-summary-row">
          <div class="sheet-location">
            <span class="mdi mdi-map-marker-outline" aria-hidden="true"></span>
            <span>{{ locationSummary }}</span>
          </div>
          <div class="sheet-status-right">
            <span class="status-dot" :class="statusDotClass" aria-hidden="true"></span>
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
              <span class="mdi mdi-account" aria-hidden="true"></span>
            </div>
            <div class="sheet-user-info">
              <h1>Olá, {{ userLogged?.name }}</h1>
              <span class="sheet-role-badge">
                <span class="mdi mdi-seat-passenger" aria-hidden="true"></span>
                Passageiro
              </span>
            </div>
          </div>

          <div v-if="isSharing" class="sheet-panel live-panel">
            <div class="tracking-header">
              <span class="pulse-dot"></span>
              Motorista em rota (ao vivo)
            </div>
            <p v-if="tracking.latitude != null" class="panel-meta">
              {{ tracking.latitude.toFixed(6) }}, {{ tracking.longitude.toFixed(6) }}
              <span v-if="updatedAtLabel"> · {{ updatedAtLabel }}</span>
              <span v-if="tracking.stale"> (desatualizado)</span>
            </p>
            <p v-else class="panel-meta">Aguardando localização do motorista...</p>
            <p v-if="tracking.error" class="panel-error" role="alert">{{ tracking.error }}</p>
            <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener noreferrer" class="sheet-cta">
              Abrir no Google Maps <span class="mdi mdi-open-in-new" aria-hidden="true"></span>
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
                Pesquise uma empresa aprovada e envie seu pedido de vínculo para acessar atendimentos e rotas.
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
              <p v-if="activeTravel" class="panel-meta">
                Próxima viagem #{{ activeTravel.id }} · {{ activeTravel.date }}
                ({{ activeTravel.direction === 'outbound' ? 'Ida' : 'Retorno' }})
              </p>
              <p v-else class="panel-meta">Vínculo ativo. Responda aos atendimentos abertos na aba Lista.</p>
              <div class="sheet-actions">
                <RouterLink to="/lista" class="sheet-cta">Responder atendimentos</RouterLink>
                <RouterLink to="/historico" class="sheet-cta-outline">Histórico</RouterLink>
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
  gap: 12px;
}

.sheet-location {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-on-primary);
  min-width: 0;
}

.sheet-location .mdi {
  color: var(--primary);
  font-size: 1.15rem;
}

.sheet-status-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.status-dot.live,
.status-dot.active {
  background: var(--success);
}

.status-dot.pending {
  background: var(--warning);
}

.status-dot.idle {
  background: var(--chrome-muted);
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
  font-size: 1.5rem;
  flex-shrink: 0;
}

.sheet-user-info h1 {
  margin: 0 0 3px;
  font-size: 1.12rem;
  color: var(--color-on-primary);
}

.sheet-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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

/* Desktop: card flutuante no canto inferior direito sobre o mapa (Passageiro Desktop.png) */
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
