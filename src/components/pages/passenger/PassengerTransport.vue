<template>
  <div class="transport-container">
    <h2 class="page-title">Meu Transporte</h2>

    <div class="card vehicle-card" v-if="transport">
      <div class="vehicle-header">
        <span class="vehicle-model">{{ transport.veiculo?.modelo || 'Carregando...' }}</span>
        <span class="vehicle-plate">{{ transport.veiculo?.placa || '---' }}</span>
      </div>

      <div class="vehicle-stats">
        <div class="stat-item">
          <span class="icon">👥</span> {{ transport.veiculo?.capacidade || 0 }} Lugares
        </div>
        <div class="stat-item">
          <span class="icon">👤</span> {{ transport.motorista?.nome || 'Motorista' }}
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-text">{{ transport.passageirosAtuais || 0 }}|{{ transport.veiculo?.capacidade || 0 }}</div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>

      <button class="btn-track-route" @click="goToPassengerHome">
        ACOMPANHAR ROTA <span class="arrow-icon">›</span>
      </button>
    </div>

    <div v-else class="card vehicle-card">
      <p style="text-align: center; color: #999;">Carregando dados do transporte...</p>
    </div>

    <div class="card driver-card" v-if="transport">
      <h2 class="card-title">Informações do Motorista</h2>

      <ul class="driver-info-list">
        <li class="info-item">
          <span class="icon-orange">👤</span>
          <span class="info-text font-bold">{{ transport.motorista?.nome || 'Motorista' }}</span>
        </li>
        <li class="info-item">
          <span class="icon-orange">✉️</span>
          <span class="info-text">{{ transport.motorista?.email || 'email@exemplo.com' }}</span>
        </li>
      </ul>
    </div>

    <button class="fab-button">
      +
    </button>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/client.js';

export default {
  name: 'PassengerTransport',
  setup() {
    const router = useRouter();
    const transport = ref(null);
    const loading = ref(true);
    const error = ref(null);

    const progressPercentage = computed(() => {
      if (!transport.value?.veiculo?.capacidade) return 0;
      return (transport.value.passageirosAtuais / transport.value.veiculo.capacidade) * 100;
    });

    const goToPassengerHome = () => {
      router.push({ name: 'PassengerHome' });
    };

    const fetchTransportData = async () => {
      try {
        loading.value = true;
        const response = await api.get('/passenger/transport');
        transport.value = response.data;
      } catch (err) {
        console.error('Erro ao carregar transporte:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchTransportData();
    });

    return {
      transport,
      loading,
      error,
      progressPercentage,
      goToPassengerHome,
    };
  },
};
</script>

<style scoped>
.transport-container {
  padding: 20px;
  background-color: #ffffff;
  min-height: 100vh;
  position: relative;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #000;
  margin-bottom: 20px;
  text-align: left;
}

.card {
  background: #eae8e3;
  border: 1px solid #dcdcdc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.vehicle-model {
  font-size: 0.95rem;
  color: #333;
}

.vehicle-plate {
  font-size: 1.2rem;
  font-weight: 900;
  color: #000;
}

.vehicle-stats {
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  margin-bottom: 25px;
}

.stat-item {
  font-size: 0.75rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-text {
  text-align: right;
  font-size: 0.75rem;
  font-weight: bold;
  color: #000;
  margin-bottom: 5px;
}

.progress-track {
  width: 100%;
  height: 6px;
  border: 1px solid #f48a1d;
  border-radius: 10px;
  background-color: transparent;
}

.progress-fill {
  height: 100%;
  background-color: #f48a1d;
  border-radius: 10px;
}

.btn-track-route {
  width: 100%;
  background-color: #f48a1d;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 0.9rem;
  font-weight: bold;
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-track-route:active {
  opacity: 0.8;
}

.driver-card {
  position: relative;
}

.card-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #000;
  margin-bottom: 10px;
  border-bottom: 1px solid #f48a1d;
  padding-bottom: 5px;
  text-align: left;
}

.driver-info-list {
  list-style: none;
  padding: 0;
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 1rem;
  color: #000;
}

.icon-orange {
  color: #f48a1d;
  font-size: 1.5rem;
}

.font-bold {
  font-weight: bold;
}

.fab-button {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 60px;
  height: 60px;
  background-color: #f48a1d;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(244, 138, 29, 0.4);
  cursor: pointer;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.fab-button:active {
  opacity: 0.8;
}

@media (min-width: 768px) {
  .transport-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  }
}
</style>
