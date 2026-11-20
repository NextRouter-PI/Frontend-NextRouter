<script setup>
import { computed, onMounted } from 'vue'
import { useTransportState } from '@/stores/useTransportState'
import { useTravelTracking } from '@/composables/useTravelTracking'
import LiveLocationMap from '@/components/ui/LiveLocationMap.vue'
import RouteMapSnapshot from '@/components/transport/RouteMapSnapshot.vue'
import TransportHistoryNotifications from '@/components/transport/TransportHistoryNotifications.vue'

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

const statusLabel = {
  allocated: 'Alocado (aguardando embarque)',
  on_board: 'Embarcado',
  dropped_off: 'Desembarcado',
  no_show: 'Ausente (no-show)',
  withdrawn: 'Desistiu antes do embarque',
}

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
  <div class="transport-container">
    <div class="header-row">
      <h2 class="page-title">Minhas Viagens e Execução</h2>
      <button type="button" class="btn-outline" :disabled="state.loading || state.busy" @click="loadDriverData(transport?.travelId)">
        Atualizar
      </button>
    </div>

    <p v-if="state.notice" class="notice-banner" role="status">{{ state.notice }}</p>
    <p v-if="state.error" class="error-banner" role="alert">{{ state.error }}</p>

    <div v-if="state.loading" class="card loading-card">
      <p>Carregando viagens e convites do motorista...</p>
    </div>

    <template v-else-if="transport">
      <!-- Convites vigentes de substituição (6.3) -->
      <div v-if="pendingInvitations.length" class="card info-card">
        <h3 class="card-title">Convites de Substituição Pendentes ({{ pendingInvitations.length }})</h3>
        <p class="sub-text">
          O convite não concede acesso ao percurso nem aos participantes antes do seu aceite explícito.
        </p>
        <div v-for="inv in pendingInvitations" :key="inv.id" class="inv-item">
          <div>
            <strong>Convite #{{ inv.id }} · Viagem #{{ inv.travel }}</strong>
            <p class="sub-text">
              Período planejado: {{ new Date(inv.planned_start).toLocaleString('pt-BR') }} até
              {{ new Date(inv.planned_end).toLocaleString('pt-BR') }} ·
              Expira em {{ new Date(inv.expires_at).toLocaleString('pt-BR') }}
            </p>
          </div>
          <div class="action-row">
            <button type="button" class="btn-small-primary" :disabled="state.busy" @click="responderConviteMotorista(inv.id, true)">
              Aceitar convite
            </button>
            <button type="button" class="btn-small-outline" :disabled="state.busy" @click="responderConviteMotorista(inv.id, false)">
              Recusar
            </button>
          </div>
        </div>
      </div>

      <!-- Seletor de viagens designadas -->
      <div v-if="transport.travels.length" class="travel-chips" role="tablist" aria-label="Viagens designadas">
        <button
          v-for="t in transport.travels"
          :key="t.id"
          type="button"
          :class="['travel-chip', { active: t.id === transport.travelId }]"
          :disabled="state.busy"
          @click="loadDriverData(t.id)"
        >
          #{{ t.id }} · {{ t.date }} ({{ t.direction === 'outbound' ? 'Ida' : 'Retorno' }}) · {{ t.status }}
        </button>
      </div>

      <template v-if="transport.travel">
        <div class="card vehicle-card">
          <div class="vehicle-header">
            <div>
              <span class="vehicle-model">
                Viagem #{{ transport.travel.id }} · {{ transport.travel.date }} ({{ transport.travel.direction === 'outbound' ? 'Ida' : 'Retorno' }})
              </span>
              <span class="vehicle-year">
                Revisão {{ transport.revision }} · Publicada: {{ transport.publishedRevision ?? 'nenhuma' }} ·
                Planejamento: {{ transport.planningStatus }}
              </span>
            </div>
            <span class="status-badge" :class="isInProgress ? 'active' : 'inactive'">
              {{ transport.travelStatus }}
            </span>
          </div>

          <p class="sub-text">
            Veículo designado: <strong>{{ transport.vehicleId ? `#${transport.vehicleId}` : 'Não atribuído' }}</strong> ·
            Participantes: <strong>{{ transport.passageirosNaRota }}</strong> ·
            Embarcados: <strong>{{ transport.passageirosEmbarcados }}</strong> ·
            Pendentes: <strong>{{ transport.passageirosPendentes }}</strong>
          </p>

          <p v-if="!isInProgress && !transport.publicationCurrent" class="warning-text">
            Bloqueio de início: a revisão atual ({{ transport.revision }}) ainda não está pronta e publicada pela empresa (`publication_current = false`).
          </p>
          <p v-if="isInProgress && (transport.passageirosEmbarcados > 0 || transport.passageirosPendentes > 0)" class="warning-text">
            Para finalizar a viagem, registre embarque/ausência de todos os participantes alocados e o desembarque de quem está a bordo.
          </p>

          <div class="action-row">
            <button
              v-if="transport.travelStatus === 'scheduled' || isInProgress"
              type="button"
              class="btn-primary"
              :class="{ 'btn-danger': isInProgress }"
              :disabled="state.busy || (!isInProgress && !transport.publicationCurrent)"
              @click="handleStartOrFinish"
            >
              <template v-if="isInProgress">Finalizar Viagem <span class="mdi mdi-flag-checkered"></span></template>
              <template v-else>Iniciar Viagem Publicada (Revisão {{ transport.revision }}) <span class="mdi mdi-arrow-right"></span></template>
            </button>

            <button
              v-if="transport.travelStatus === 'scheduled'"
              type="button"
              class="btn-outline"
              :disabled="state.busy"
              @click="informarIndisponibilidade(transport.travel)"
            >
              Informar Indisponibilidade
            </button>
          </div>
        </div>

        <div v-if="isInProgress" class="card info-card">
          <h3 class="card-title">Localização ao Vivo (Mesma Origem)</h3>
          <LiveLocationMap marker-label="Você" />
          <p v-if="tracking.error" class="warning-text" role="alert">{{ tracking.error }}</p>
        </div>

        <div class="card info-card">
          <h3 class="card-title">Percurso Calculado (Snapshot)</h3>
          <div class="route-info">
            <div class="route-point">
              <span class="route-dot origin"></span>
              <div>
                <span class="route-label">Origem</span>
                <span class="route-value">{{ transport.rota.ponto_origem }}</span>
                <span class="route-time">{{ transport.rota.horario_saida }}</span>
              </div>
            </div>
            <div class="route-line"></div>
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
        </div>

        <!-- Paradas do snapshot (5.2) -->
        <div class="card info-card">
          <h3 class="card-title">Paradas na Ordem do Percurso ({{ transport.stops.length }})</h3>
          <p v-if="!transport.stops.length" class="sub-text">Nenhuma parada materializada para este percurso.</p>
          <ul v-else class="stop-list">
            <li v-for="stop in transport.stops" :key="stop.id" class="stop-item">
              <div class="stop-header">
                <strong>{{ stop.position }}. {{ stop.pointLabel }}</strong>
                <span class="stop-state">{{ stop.state }}</span>
              </div>
              <p v-if="stop.enrichedParticipants.length" class="sub-text">
                Atendimentos nesta parada:
                <span v-for="sp in stop.enrichedParticipants" :key="`${stop.id}-${sp.participation}-${sp.operation}`">
                  {{ sp.name }} ({{ sp.operation === 'board' ? 'Embarque' : 'Desembarque' }} — {{ sp.status }}) ·
                </span>
              </p>
              <div v-if="isInProgress && stop.state === 'waiting'" class="action-row">
                <button type="button" class="btn-small-primary" :disabled="state.busy" @click="tratarParadaPercurso(stop.id, false)">
                  Concluir parada
                </button>
                <button type="button" class="btn-small-outline" :disabled="state.busy" @click="tratarParadaPercurso(stop.id, true)">
                  Ignorar parada (`skipped`)
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- Participações e registro de presença (5.2) -->
        <div class="card info-card">
          <h3 class="card-title">Participações e Presença ({{ transport.participations.length }})</h3>
          <p class="sub-text">
            Participações contêm apenas o nome do passageiro e o estado operacional; dados cadastrais e endereço pessoal não são expostos.
          </p>
          <p v-if="!transport.participations.length" class="sub-text">Nenhum participante alocado nesta viagem.</p>
          <ul v-else class="passenger-list">
            <li v-for="part in transport.participations" :key="part.id" class="passenger-item">
              <div class="passenger-avatar">{{ (part.name || 'P').charAt(0) }}</div>
              <div class="passenger-info">
                <span class="passenger-name">{{ part.name || `Participante #${part.id}` }}</span>
                <span class="passenger-stops">{{ statusLabel[part.status] || part.status }}</span>
              </div>
              <div v-if="isInProgress" class="action-row">
                <button
                  v-if="part.status === 'allocated'"
                  type="button"
                  class="btn-small-primary"
                  :disabled="state.busy"
                  @click="registrarPresencaParticipante(part.id, 'boarded')"
                >
                  Embarcou
                </button>
                <button
                  v-if="part.status === 'allocated'"
                  type="button"
                  class="btn-small-outline"
                  :disabled="state.busy"
                  @click="registrarPresencaParticipante(part.id, 'no_show')"
                >
                  Ausente
                </button>
                <button
                  v-if="part.status === 'on_board'"
                  type="button"
                  class="btn-small-primary"
                  :disabled="state.busy"
                  @click="registrarPresencaParticipante(part.id, 'dropped_off')"
                >
                  Desembarcou
                </button>
              </div>
            </li>
          </ul>
        </div>
      </template>

      <div v-else class="card loading-card">
        <p>Você não possui viagens designadas no momento.</p>
      </div>

      <TransportHistoryNotifications />
    </template>
  </div>
</template>

<style scoped>
.transport-container {
  padding: 20px 20px 140px;
  background: var(--bg);
  min-height: 100vh;
  max-width: 720px;
  margin: 0 auto;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text);
  margin: 0;
}

.notice-banner {
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(5, 150, 105, 0.12);
  color: var(--success, #059669);
  font-weight: 600;
  margin-bottom: 14px;
}

.error-banner {
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(220, 38, 38, 0.12);
  color: var(--danger, #dc2626);
  font-weight: 600;
  margin-bottom: 14px;
}

.travel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.travel-chip {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--superfice);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.travel-chip.active {
  border-color: var(--primary);
  background: rgba(223, 128, 26, 0.12);
  color: var(--primary);
}

.card {
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}

.loading-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 110px;
  color: var(--text-muted);
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.vehicle-header div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vehicle-model {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}

.vehicle-year {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
}

.status-badge.inactive {
  background: rgba(223, 128, 26, 0.12);
  color: var(--primary);
}

.sub-text {
  font-size: 0.84rem;
  color: var(--text-muted);
  line-height: 1.45;
  margin: 6px 0;
}

.warning-text {
  font-size: 0.83rem;
  color: var(--danger, #dc2626);
  font-weight: 600;
  margin: 10px 0;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.btn-primary {
  flex: 1 1 220px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 700;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.btn-primary.btn-danger {
  background: var(--danger, #dc2626);
}

.btn-outline {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-small-primary {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: var(--primary);
  color: white;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-small-outline {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary);
}

.inv-item,
.stop-item {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  margin-bottom: 10px;
}

.stop-list,
.passenger-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.stop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.stop-state {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--primary);
}

.passenger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.passenger-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.passenger-info {
  flex: 1 1 180px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.passenger-name {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text);
}

.passenger-stops {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.route-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.route-point {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.route-point div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.route-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
}

.route-dot.origin {
  background: var(--success);
}

.route-dot.destination {
  background: var(--primary);
}

.route-line {
  width: 2px;
  height: 16px;
  background: var(--border);
  margin-left: 5px;
}

.route-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.route-value {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text);
}

.route-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
