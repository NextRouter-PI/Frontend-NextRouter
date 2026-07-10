<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransportState } from '@/stores/useTransportState'

const router = useRouter()
const { state, loadDriverData } = useTransportState()

const transport = computed(() => state.driver)

const progressPercentage = computed(() => {
  if (!transport.value?.veiculo?.capacidade) return 0
  return (transport.value.passageirosAtuais / transport.value.veiculo.capacidade) * 100
})

const visibleCount = ref(3)
const showAllPassengers = ref(false)

const displayedPassengers = computed(() => {
  if (!transport.value?.passageiros) return []
  if (showAllPassengers.value) return transport.value.passageiros
  return transport.value.passageiros.slice(0, visibleCount.value)
})

const hiddenCount = computed(() => {
  if (!transport.value?.passageiros) return 0
  return transport.value.passageiros.length - visibleCount.value
})

const goToDriverHome = () => {
  router.push({ name: 'home' })
}

onMounted(() => {
  loadDriverData()
})
</script>

<template>
  <div class="transport-container">
    <h2 class="page-title">Meu Transporte</h2>

    <div v-if="state.loading" class="card loading-card">
      <p>Carregando dados do transporte...</p>
    </div>

    <template v-else-if="transport">
      <div class="card vehicle-card">
        <div class="vehicle-header">
          <div>
            <span class="vehicle-model">{{ transport.veiculo.modelo }}</span>
            <span class="vehicle-year">{{ transport.veiculo.ano }}</span>
          </div>
          <span class="vehicle-plate">{{ transport.veiculo.placa }}</span>
        </div>

        <div class="vehicle-details">
          <span class="detail-tag">{{ transport.veiculo.cor }}</span>
          <span class="status-badge" :class="transport.veiculo.ativo ? 'active' : 'inactive'">
            {{ transport.veiculo.ativo ? 'Ativa' : 'Inativa' }}
          </span>
        </div>

        <div class="vehicle-stats">
          <div class="stat-item">
            <span class="mdi mdi-seat"></span>
            <span>{{ transport.veiculo.capacidade }} lugares</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-text">
            {{ transport.passageirosAtuais }} / {{ transport.veiculo.capacidade }} ocupados
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
        </div>

        <button class="btn-primary" @click="goToDriverHome">
          Iniciar Rota <span class="mdi mdi-arrow-right"></span>
        </button>
      </div>

      <div class="card info-card">
        <h2 class="card-title">Rota</h2>
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
      </div>

      <div class="card info-card">
        <h2 class="card-title">Passageiros ({{ transport.passageiros.length }})</h2>
        <ul class="passenger-list">
          <li v-for="(passageiro, index) in displayedPassengers" :key="index" class="passenger-item">
            <div class="passenger-avatar">{{ passageiro.nome.charAt(0) }}</div>
            <div class="passenger-info">
              <span class="passenger-name">{{ passageiro.nome }}</span>
              <span class="passenger-stops">
                {{ passageiro.embarque }} <span class="mdi mdi-arrow-right"></span> {{ passageiro.desembarque }}
              </span>
            </div>
          </li>
        </ul>
        <button
          v-if="transport.passageiros.length > visibleCount"
          class="btn-toggle"
          @click="showAllPassengers = !showAllPassengers"
        >
          {{ showAllPassengers ? 'Ver menos' : `Ver mais (${hiddenCount})` }}
          <span class="mdi" :class="showAllPassengers ? 'mdi-chevron-up' : 'mdi-chevron-down'"></span>
        </button>
      </div>

      <div class="card info-card">
        <h2 class="card-title">Características do Veículo</h2>
        <ul v-if="transport.veiculo.caracteristicas?.length" class="features-list">
          <li v-for="caracteristica in transport.veiculo.caracteristicas" :key="caracteristica" class="feature-item">
            <span>{{ caracteristica }}</span>
            <span class="check-icon mdi mdi-check"></span>
          </li>
        </ul>
        <p v-else class="empty-text">Nenhuma característica disponível</p>
      </div>
    </template>

    <div v-else class="card loading-card">
      <p>Nenhum dado de transporte disponível.</p>
    </div>

  </div>
</template>

<style scoped>
.transport-container {
  padding: 20px;
  background: var(--bg);
  min-height: 100vh;
  position: relative;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 20px;
}

.card {
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow);
}

.loading-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.loading-card p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.vehicle-header div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.vehicle-model {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}

.vehicle-year {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.vehicle-plate {
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--text);
  letter-spacing: 0.5px;
}

.vehicle-details {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.detail-tag {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--primary);
  background: rgba(223, 128, 26, 0.1);
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: uppercase;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.vehicle-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.stat-item {
  font-size: 0.85rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-item .mdi {
  font-size: 1.1rem;
  color: var(--primary);
}

.progress-section {
  margin-bottom: 20px;
}

.progress-text {
  text-align: right;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.progress-track {
  width: 100%;
  height: 8px;
  border: 1px solid var(--primary);
  border-radius: 10px;
  background: transparent;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.btn-primary {
  width: 100%;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: var(--shadow-primary);
}

.btn-primary:active {
  opacity: 0.85;
}

.info-card {
  position: relative;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary);
}

.route-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 8px;
}

.route-point {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.route-point div {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-bottom: 8px;
}

.route-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.route-dot.origin {
  background: var(--success);
  border: 2px solid rgba(34, 197, 94, 0.3);
}

.route-dot.destination {
  background: var(--primary);
  border: 2px solid rgba(223, 128, 26, 0.3);
}

.route-line {
  width: 2px;
  height: 20px;
  background: var(--border);
  margin-left: 14px;
}

.route-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.route-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
}

.route-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.passenger-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.passenger-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.passenger-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}

.passenger-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.passenger-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
}

.passenger-stops {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.btn-toggle {
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--primary);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s, border-color 0.2s;
}

.btn-toggle:hover {
  background: rgba(223, 128, 26, 0.06);
  border-color: var(--primary);
}

.btn-toggle .mdi {
  font-size: 1.1rem;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.92rem;
  color: var(--text);
}

.check-icon {
  background: var(--success);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.empty-text {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.fab-button {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 56px;
  height: 56px;
  background: var(--gradient-primary);
  border: none;
  border-radius: 50%;
  box-shadow: var(--shadow-primary);
  cursor: pointer;
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, opacity 0.2s;
}

.fab-button:active {
  transform: scale(0.92);
  opacity: 0.85;
}

@media (min-width: 768px) {
  .transport-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  }
}
</style>
