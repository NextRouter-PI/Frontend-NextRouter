<template>
  <div class="transport-container">
    <h2 class="page-title">Meu Transporte</h2>

    <div class="card vehicle-card" v-if="transport">
      <div class="vehicle-header">
        <span class="vehicle-model">{{ transport.veiculo?.modelo || 'Carregando...' }}</span>
        <span class="vehicle-plate">{{ transport.veiculo?.placa || '---' }}</span>
      </div>

      <div class="vehicle-stats">
        <div class="capacity">
          <span class="icon-users">👥</span> {{ transport.veiculo?.capacidade || 0 }} Lugares
        </div>
        <div class="status-badge">{{ transport.veiculo?.ativo ? 'Ativa' : 'Inativa' }}</div>
      </div>

      <div class="progress-section">
        <div class="progress-text">{{ transport.passageirosAtuais || 0 }}|{{ transport.veiculo?.capacidade || 0 }}</div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>

      <button class="btn-start-route" @click="goToDriverHome">
        Iniciar Rota <span class="arrow-icon">›</span>
      </button>
    </div>

    <div v-else class="card vehicle-card">
      <p style="text-align: center; color: #999;">Carregando dados do transporte...</p>
    </div>

    <div class="card features-card" v-if="transport">
      <h2 class="card-title">Características do Veículo</h2>

      <ul class="features-list" v-if="transport.veiculo?.caracteristicas?.length">
        <li class="feature-item" v-for="caracteristica in transport.veiculo.caracteristicas" :key="caracteristica">
          {{ caracteristica }} <span class="check-icon">✓</span>
        </li>
      </ul>
      <p v-else style="color: #999;">Nenhuma característica disponível</p>
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
  name: 'DriverTransport',
  setup() {
    const router = useRouter();
    const transport = ref(null);
    const loading = ref(true);
    const error = ref(null);

    const progressPercentage = computed(() => {
      if (!transport.value?.veiculo?.capacidade) return 0;
      return (transport.value.passageirosAtuais / transport.value.veiculo.capacidade) * 100;
    });

    const goToDriverHome = () => {
      router.push({ name: 'DriverHome' });
    };

    const fetchTransportData = async () => {
      try {
        loading.value = true;
        const response = await api.get('/driver/transport');
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
      goToDriverHome,
    };
  },
};
</script>

<style scoped>
.transport-container {
  padding: 20px;
  background-color: #fafafa;
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
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.vehicle-model {
  font-size: 0.95rem;
  color: #666;
}

.vehicle-plate {
  font-size: 1.2rem;
  font-weight: 900;
  color: #000;
}

.vehicle-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.capacity {
  font-size: 0.85rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-badge {
  background-color: #bbf7d0;
  color: #166534;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
}

.progress-section {
  margin-bottom: 25px;
}

.progress-text {
  text-align: right;
  font-size: 0.8rem;
  font-weight: bold;
  color: #000;
  margin-bottom: 5px;
}

.progress-track {
  width: 100%;
  height: 8px;
  border: 1px solid #f48a1d;
  border-radius: 10px;
  background-color: transparent;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #f48a1d;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.btn-start-route {
  width: 100%;
  background-color: #f48a1d;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-start-route:active {
  opacity: 0.8;
}

.card-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #000;
  margin-bottom: 15px;
  text-align: left;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: #333;
}

.check-icon {
  background-color: #22c55e;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
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
