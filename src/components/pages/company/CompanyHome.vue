<script setup>
import { computed } from 'vue'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { Bar } from 'vue-chartjs'
import { state } from '@/stores/state'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
)

const chartData = {
  labels: ['08:00', '12:00', '17:00'],
  datasets: [
    {
      data: [22, 5, 19],
      backgroundColor: '#df801a',
      borderRadius: 0,
      barThickness: 38
    }
  ]
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#666', font: { size: 16, weight: '600' } },
      border: { color: '#666' }
    },
    y: {
      min: 0,
      max: 22,
      ticks: { stepSize: 2, color: '#666' },
      grid: { color: '#bbb', lineWidth: 1 },
      border: { display: false }
    }
  }
}

const store = useTransporteStore()

const data = computed(() => {
  const hoje = new Date()
  return hoje.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  })
})

const passageirosHoje = computed(() => {
  return store.veiculos.reduce((total, veiculo) => total + veiculo.capacidade, 0)
})

const ativos = computed(() => {
  return store.veiculos.filter(v => v.status === 'Ativo').length
})

const total = computed(() => store.veiculos.length)
</script>

<template>
  <div class="content">

    <div class="titulo">
      <h2>Gerenciamento: {{ state.user.company_name }}</h2>
      <span>{{ data }}</span>
    </div>

    <div class="cards-row">
      <div class="info-card">
        <span class="mdi mdi-account-group card-icon"></span>
        <div>
          <h4>Passageiros Hoje:</h4>
          <p>{{ passageirosHoje }}</p>
        </div>
      </div>

      <div class="info-card">
        <span class="mdi mdi-map-marker-path card-icon"></span>
        <div>
          <h4>Rotas Hoje:</h4>
          <p>8</p>
        </div>
      </div>
    </div>

    <div class="info-card grande">
      <span class="mdi mdi-van-passenger card-icon"></span>
      <div>
        <h4>Transportes Ativos:</h4>
        <p>{{ ativos }} / {{ total }}</p>
      </div>
    </div>

    <div class="grafico-card">
      <h2>Questionário 30/06</h2>
      <div class="chart-container">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
      <button class="btn-detalhes">
        VER DETALHES
      </button>
    </div>

  </div>
</template>

<style scoped>
.content {
  margin: 0 auto;
  max-width: 600px;
  padding: 18px 18px 120px;
}

.titulo h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.titulo span {
  font-size: 1.3rem;
}

.cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.info-card {
  min-width: 100%;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--superfice);
  box-shadow: var(--shadow);
}

.grande {
  margin-top: 18px;
}

.card-icon {
  color: var(--primary);
  font-size: 46px;
}

.info-card h4 {
  margin: 0;
  font-size: 18px;
}

.info-card p {
  margin-top: 8px;
  font-size: 22px;
}

.grafico-card {
  margin-top: 28px;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--superfice);
  box-shadow: var(--shadow);
}

.chart-container {
  height: 280px;
  margin: 25px 0;
}

.grafico-card h2 {
  margin: 30px 0 30px 0;
}

.btn-detalhes {
  margin-top: 40px;
  float: right;
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.btn-detalhes:hover {
  opacity: 0.9;
}

@media (min-width: 900px) {
  .info-card {
    flex: 1 1 160px;
    min-width: 140px;
  }
}
</style>
