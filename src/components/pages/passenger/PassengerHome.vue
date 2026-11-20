<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { state } from '@/stores/state'
import { useTransportState } from '@/stores/useTransportState'
import { useTravelTracking } from '@/composables/useTravelTracking'
import { useAccountScope } from '@/composables/useAccountScope'
import { loadMemberships } from '@/api/memberships'
import MapBackground from '@/components/ui/MapBackground.vue'

const userLogged = computed(() => state.user)
const { state: transportState, loadPassengerData } = useTransportState()
const { state: tracking, startViewerTracking, stopTracking } = useTravelTracking()
const scope = useAccountScope()

const membershipLoaded = ref(false)
const openMembership = ref(null)
const openCompany = ref(null)

const isSharing = computed(() => tracking.tracking && tracking.role === 'viewer')
const mapsUrl = computed(() => {
  if (tracking.latitude == null || tracking.longitude == null) return null
  return `https://www.google.com/maps?q=${tracking.latitude},${tracking.longitude}`
})
const updatedAtLabel = computed(() => {
  if (!tracking.updatedAt) return ''
  return new Date(tracking.updatedAt).toLocaleTimeString('pt-BR')
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
    <MapBackground self-marker-label="Você" tracking-marker-label="Motorista" tracking-marker-icon="mdi-bus" />
    <div class="welcome-card">
      <div class="icon-wrap">
        <span class="mdi mdi-account-circle-outline"></span>
      </div>
      <h1>Olá, {{ userLogged.name }}</h1>
      <p class="subtitle">Bem-vindo ao NextRouter</p>
      <div class="badge">
        <span class="mdi mdi-account-check"></span>
        Passageiro
      </div>

      <div v-if="membershipLoaded && !openMembership" class="onboarding-card">
        <p class="onboarding-title">Você ainda não possui vínculo com uma empresa</p>
        <p class="onboarding-desc">
          Pesquise uma empresa de transporte aprovada e envie seu pedido de vínculo para ter acesso aos atendimentos e rotas.
        </p>
        <div class="onboarding-actions">
          <RouterLink to="/empresas" class="btn-primary">Buscar empresas</RouterLink>
          <RouterLink to="/vinculos" class="btn-outline">Meus vínculos</RouterLink>
        </div>
      </div>

      <div v-else-if="membershipLoaded && openMembership?.status === 'pending'" class="onboarding-card pending">
        <p class="onboarding-title">Solicitação de vínculo pendente</p>
        <p class="onboarding-desc">
          Aguardando aprovação de <strong>{{ openCompany?.trade_name || `Empresa #${openMembership.company}` }}</strong>.
        </p>
        <div class="onboarding-actions">
          <RouterLink to="/vinculos" class="btn-outline">Acompanhar pedido</RouterLink>
        </div>
      </div>

      <div v-else-if="membershipLoaded && openMembership?.status === 'active'" class="onboarding-card active">
        <p class="onboarding-title">
          Vinculado a {{ openCompany?.trade_name || `Empresa #${openMembership.company}` }}
        </p>
        <div class="onboarding-actions">
          <RouterLink to="/lista" class="btn-primary">Responder atendimentos</RouterLink>
          <RouterLink to="/historico" class="btn-outline">Histórico</RouterLink>
        </div>
      </div>

      <div v-if="isSharing" class="tracking-card">
        <div class="tracking-header">
          <span class="pulse-dot"></span>
          Localização do motorista em tempo real
        </div>
        <p v-if="tracking.latitude != null" class="tracking-coords">
          {{ tracking.latitude.toFixed(6) }}, {{ tracking.longitude.toFixed(6) }}
          <span v-if="updatedAtLabel" class="tracking-time">· atualizado às {{ updatedAtLabel }}</span>
          <span v-if="tracking.stale" class="tracking-time"> (posição desatualizada)</span>
        </p>
        <p v-else class="tracking-coords">Aguardando localização do motorista...</p>
        <p v-if="tracking.error" class="tracking-time" role="alert">{{ tracking.error }}</p>
        <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener noreferrer" class="tracking-link">
          Ver no mapa <span class="mdi mdi-open-in-new"></span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  position: relative;
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
}

.welcome-card {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 360px;
  width: 100%;
  padding: 40px 24px;
  background: var(--superfice);
  border: 1px solid rgba(223, 128, 26, 0.12);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(6px);
}

.dark .welcome-card {
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
}

.icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(223,128,26,0.1);
  margin-bottom: 20px;
}

.icon-wrap .mdi {
  font-size: 2.5rem;
  color: var(--primary);
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 6px;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0 0 16px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 16px;
  background: rgba(223,128,26,0.1);
  color: var(--primary);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.tracking-card {
  margin-top: 20px;
  padding: 16px;
  border-radius: 14px;
  background: var(--bg);
  border: 1px solid rgba(34, 197, 94, 0.25);
  text-align: left;
}

.tracking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--success, #22c55e);
  margin-bottom: 8px;
}

.pulse-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--success, #22c55e);
  animation: pulse 1.5s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
  70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.tracking-coords {
  font-size: 0.85rem;
  color: var(--text);
  margin: 0 0 8px;
}

.tracking-time {
  color: var(--text-muted);
  font-weight: 400;
}

.tracking-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
}

.onboarding-card {
  margin-top: 20px;
  padding: 16px;
  border-radius: 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  text-align: left;
}

.onboarding-card.pending {
  border-color: rgba(234, 179, 8, 0.45);
}

.onboarding-card.active {
  border-color: rgba(34, 197, 94, 0.35);
}

.onboarding-title {
  margin: 0 0 6px;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text);
}

.onboarding-desc {
  margin: 0 0 12px;
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.onboarding-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-primary,
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 600;
  text-decoration: none;
}

.btn-primary {
  background: var(--primary);
  color: #ffffff;
  border: 1px solid var(--primary);
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-outline {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-outline:hover {
  background: var(--altbg);
}
</style>
