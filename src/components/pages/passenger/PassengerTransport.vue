<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransportState } from '@/stores/useTransportState'

const router = useRouter()
const { state, loadPassengerData } = useTransportState()

const transport = computed(() => state.passenger)

const progressPercentage = computed(() => {
  if (!transport.value?.veiculo?.capacidade) return 0
  return (transport.value.passageirosAtuais / transport.value.veiculo.capacidade) * 100
})

const fullStars = computed(() => {
  if (!transport.value?.motorista?.avaliacao) return 0
  return Math.floor(transport.value.motorista.avaliacao)
})

const goToPassengerHome = () => {
  router.push({ name: 'home' })
}

onMounted(() => {
  loadPassengerData()
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
        </div>

        <div class="vehicle-stats">
          <div class="stat-item">
            <span class="mdi mdi-seat"></span>
            <span>{{ transport.veiculo.capacidade }} lugares</span>
          </div>
          <div class="stat-item">
            <span class="mdi mdi-account"></span>
            <span>{{ transport.motorista.nome }}</span>
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

        <button class="btn-primary" @click="goToPassengerHome">
          Acompanhar Rota <span class="mdi mdi-arrow-right"></span>
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
        <h2 class="card-title">Motorista</h2>
        <div class="driver-info">
          <div class="driver-avatar">{{ transport.motorista.nome.charAt(0) }}</div>
          <div class="driver-details">
            <span class="driver-name">{{ transport.motorista.nome }}</span>
            <div class="driver-rating">
              <span v-for="i in 5" :key="i" class="mdi mdi-star" :class="{ filled: i <= fullStars }"></span>
              <span class="rating-value">{{ transport.motorista.avaliacao }}</span>
            </div>
          </div>
        </div>
        <div class="driver-contact">
          <div class="contact-item">
            <span class="mdi mdi-email-outline"></span>
            <span>{{ transport.motorista.email }}</span>
          </div>
          <div class="contact-item">
            <span class="mdi mdi-phone-outline"></span>
            <span>{{ transport.motorista.telefone }}</span>
          </div>
        </div>
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

.driver-info {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.driver-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
  flex-shrink: 0;
}

.driver-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.driver-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}

.driver-rating {
  display: flex;
  align-items: center;
  gap: 2px;
}

.mdi-star {
  font-size: 1.1rem;
  color: var(--border);
}

.mdi-star.filled {
  color: #f59e0b;
}

.rating-value {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-left: 4px;
  font-weight: 600;
}

.driver-contact {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  color: var(--text);
}

.contact-item .mdi {
  font-size: 1.1rem;
  color: var(--primary);
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
