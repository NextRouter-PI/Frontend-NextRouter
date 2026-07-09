<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client.js'

const router = useRouter()
const transport = ref(null)
const loading = ref(true)
const error = ref(null)

const progressPercentage = computed(() => {
  if (!transport.value?.veiculo?.capacidade) return 0
  return (transport.value.passageirosAtuais / transport.value.veiculo.capacidade) * 100
})

const goToPassengerHome = () => {
  router.push({ name: 'PassengerHome' })
}

const fetchTransportData = async () => {
  try {
    loading.value = true
    const response = await api.get('/passenger/transport')
    transport.value = response.data
  } catch (err) {
    console.error('Erro ao carregar transporte:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTransportData()
})
</script>

<template>
  <div class="transport-container">
    <h2 class="page-title">Meu Transporte</h2>

    <div v-if="transport" class="card vehicle-card">
      <div class="vehicle-header">
        <span class="vehicle-model">{{ transport.veiculo?.modelo || 'Carregando...' }}</span>
        <span class="vehicle-plate">{{ transport.veiculo?.placa || '---' }}</span>
      </div>

      <div class="vehicle-stats">
        <div class="stat-item">
          <span class="stat-icon">👥</span>
          <span>{{ transport.veiculo?.capacidade || 0 }} Lugares</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">👤</span>
          <span>{{ transport.motorista?.nome || 'Motorista' }}</span>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-text">{{ transport.passageirosAtuais || 0 }} | {{ transport.veiculo?.capacidade || 0 }}</div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>

      <button class="btn-primary" @click="goToPassengerHome">
        Acompanhar Rota <span class="arrow-icon">›</span>
      </button>
    </div>

    <div v-else class="card vehicle-card loading-card">
      <p>Carregando dados do transporte...</p>
    </div>

    <div v-if="transport" class="card info-card">
      <h2 class="card-title">Informações do Motorista</h2>

      <ul class="info-list">
        <li class="info-item">
          <span class="info-icon">👤</span>
          <div>
            <span class="info-value font-bold">{{ transport.motorista?.nome || 'Motorista' }}</span>
          </div>
        </li>
        <li class="info-item">
          <span class="info-icon">✉️</span>
          <div>
            <span class="info-value">{{ transport.motorista?.email || 'email@exemplo.com' }}</span>
          </div>
        </li>
      </ul>
    </div>

    <button class="fab-button">+</button>
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

.loading-card p {
  text-align: center;
  color: var(--text-muted);
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.vehicle-model {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.vehicle-plate {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--text);
}

.vehicle-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
}

.stat-item {
  font-size: 0.85rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 1.1rem;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-text {
  text-align: right;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text);
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
  background: var(--primary);
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

.arrow-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.info-card {
  position: relative;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary);
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-icon {
  font-size: 1.4rem;
}

.info-value {
  font-size: 0.95rem;
  color: var(--text);
}

.font-bold {
  font-weight: 700;
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
