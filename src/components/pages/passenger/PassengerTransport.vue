<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransportState } from '@/stores/useTransportState'
import LiveLocationMap from '@/components/ui/LiveLocationMap.vue'
import RouteMapSnapshot from '@/components/transport/RouteMapSnapshot.vue'
import TransportHistoryNotifications from '@/components/transport/TransportHistoryNotifications.vue'

const router = useRouter()
const { state, loadPassengerData } = useTransportState()

const transport = computed(() => state.passenger)

const participationStatusLabel = {
  allocated: 'Alocado na viagem',
  on_board: 'Embarcado',
  dropped_off: 'Desembarcado',
  no_show: 'Ausente registrado',
  withdrawn: 'Desistência registrada',
}

const goToPassengerHome = () => {
  router.push({ name: 'home' })
}

onMounted(() => {
  loadPassengerData()
})
</script>

<template>
  <div class="transport-container">
    <div class="header-row">
      <h2 class="page-title">Meu Transporte</h2>
      <button
        type="button"
        class="btn-outline"
        :disabled="state.loading"
        @click="loadPassengerData(transport?.travelId)"
      >
        Atualizar
      </button>
    </div>

    <p v-if="state.error" class="error-banner" role="alert">{{ state.error }}</p>

    <div v-if="state.loading" class="card loading-card">
      <p>Carregando dados do transporte...</p>
    </div>

    <div v-else-if="transport && !transport.attached" class="card loading-card">
      <div>
        <p>Você ainda não possui participação ativa em grupo de atendimento.</p>
        <p class="sub-text">
          Estar vinculado a uma empresa não atribui grupo, ponto operacional, serviços autorizados ou viagem automaticamente.
        </p>
        <RouterLink to="/vinculos" class="link-action">Consultar meu vínculo empresarial</RouterLink>
      </div>
    </div>

    <template v-else-if="transport">
      <!-- Seletor de participações em viagens -->
      <div v-if="transport.participations.length" class="travel-chips" role="tablist" aria-label="Suas participações em viagens">
        <button
          v-for="p in transport.participations"
          :key="p.id"
          type="button"
          :class="['travel-chip', { active: p.travel === transport.travelId }]"
          @click="loadPassengerData(p.travel)"
        >
          Viagem #{{ p.travel }} · {{ p.date }} ({{ p.direction === 'outbound' ? 'Ida' : 'Retorno' }}) · {{ p.status }}
        </button>
      </div>

      <template v-if="transport.currentParticipation && transport.travel">
        <div class="card vehicle-card">
          <div class="vehicle-header">
            <div>
              <span class="vehicle-model">
                Viagem #{{ transport.travel.id }} · {{ transport.travel.date }} ({{ transport.travel.direction === 'outbound' ? 'Ida' : 'Retorno' }})
              </span>
              <span class="vehicle-year">
                Sua participação: {{ participationStatusLabel[transport.currentParticipation.status] || transport.currentParticipation.status }}
              </span>
            </div>
            <span class="vehicle-plate">{{ transport.travel.status }}</span>
          </div>

          <div class="publication-box">
            <p v-if="transport.publicationCurrent">
              <strong>Viagem publicada:</strong> Revisão publicada vigente ({{ transport.publishedRevision }}).
            </p>
            <p v-else-if="transport.publishedRevision != null" class="warning-text">
              <strong>Publicação anterior ({{ transport.publishedRevision }}):</strong> A revisão atual ({{ transport.travel.revision }}) aguarda novo cálculo/publicação pela empresa.
            </p>
            <p v-else class="warning-text">
              <strong>Aguardando publicação:</strong> Você está alocado, mas o cálculo não publica a viagem automaticamente.
            </p>
          </div>

          <div class="vehicle-stats">
            <div class="stat-item">
              <span class="mdi mdi-bus"></span>
              <span>Veículo: {{ transport.travel.vehicle ? `#${transport.travel.vehicle}` : 'A definir' }}</span>
            </div>
            <div class="stat-item">
              <span class="mdi mdi-account-tie"></span>
              <span>Motorista: {{ transport.travel.driver ? `#${transport.travel.driver}` : 'A definir' }}</span>
            </div>
          </div>

          <button type="button" class="btn-primary" @click="goToPassengerHome">
            Acompanhar no Mapa Principal <span class="mdi mdi-arrow-right"></span>
          </button>
        </div>

        <div
          v-if="
            transport.travelStatus === 'in_progress' &&
            ['allocated', 'on_board'].includes(transport.currentParticipation.status)
          "
          class="card info-card"
        >
          <h3 class="card-title">Localização do motorista ao vivo</h3>
          <LiveLocationMap
            :travel-id="transport.travelId"
            auto-start-viewer
            marker-label="Motorista"
          />
        </div>

        <div class="card info-card">
          <h3 class="card-title">Seu Trecho e Ponto Operacional</h3>
          <div class="route-info">
            <div class="route-point">
              <span class="route-dot origin"></span>
              <div>
                <span class="route-label">Saída</span>
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
          <RouteMapSnapshot
            v-if="transport.snapshot"
            :snapshot="transport.snapshot"
            :stops="transport.stops"
            title="Traçado Publicado da Viagem"
          />
        </div>
      </template>

      <div v-else class="card loading-card">
        <div>
          <p>Você está atribuído a {{ transport.activeGroups.length }} grupo(s), mas ainda não possui alocação em viagem publicada.</p>
          <p class="sub-text">
            Responda aos atendimentos abertos na aba Lista e aguarde o fechamento da janela, o cálculo e a publicação da viagem pela empresa.
          </p>
          <RouterLink to="/lista" class="link-action">Responder atendimentos por data</RouterLink>
        </div>
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
  max-width: 680px;
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
  text-align: center;
  min-height: 130px;
  color: var(--text-muted);
}

.sub-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 8px 0;
}

.link-action {
  display: inline-block;
  margin-top: 8px;
  color: var(--primary);
  font-weight: 700;
  text-decoration: underline;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
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

.vehicle-plate {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--primary);
  text-transform: uppercase;
}

.publication-box {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg);
  font-size: 0.85rem;
  margin-bottom: 14px;
}

.publication-box p {
  margin: 0;
}

.warning-text {
  color: var(--danger, #dc2626);
}

.vehicle-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 16px;
}

.stat-item {
  font-size: 0.86rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-item .mdi {
  font-size: 1.1rem;
  color: var(--primary);
}

.btn-primary {
  width: 100%;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 0.92rem;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.btn-outline {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary);
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
