<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { state } from '@/stores/state'
import { useTransportState } from '@/stores/useTransportState'
import { useTravelTracking } from '@/composables/useTravelTracking'
import MapBackground from '@/components/ui/MapBackground.vue'

const userLogged = computed(() => state.user)
const { state: transportState, loadPassengerData } = useTransportState()
const { state: tracking, startViewerTracking, stopTracking } = useTravelTracking()

const isSharing = computed(() => tracking.tracking && tracking.role === 'viewer')
const mapsUrl = computed(() => {
  if (tracking.latitude == null || tracking.longitude == null) return null
  return `https://www.google.com/maps?q=${tracking.latitude},${tracking.longitude}`
})
const updatedAtLabel = computed(() => {
  if (!tracking.updatedAt) return ''
  return new Date(tracking.updatedAt).toLocaleTimeString('pt-BR')
})

watch(
  () => transportState.passenger,
  (passenger) => {
    if (passenger?.travelId && passenger.travelStatus === 'in_progress') {
      startViewerTracking(passenger.travelId)
    } else {
      stopTracking()
    }
  },
)

onMounted(() => {
  loadPassengerData()
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
        {{ userLogged.type === 'passenger' ? 'Passageiro' : 'Motorista' }}
      </div>

      <div v-if="isSharing" class="tracking-card">
        <div class="tracking-header">
          <span class="pulse-dot"></span>
          Localização do motorista em tempo real
        </div>
        <p v-if="tracking.latitude != null" class="tracking-coords">
          {{ tracking.latitude.toFixed(6) }}, {{ tracking.longitude.toFixed(6) }}
          <span v-if="updatedAtLabel" class="tracking-time">· atualizado às {{ updatedAtLabel }}</span>
        </p>
        <p v-else class="tracking-coords">Aguardando localização do motorista...</p>
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
</style>
