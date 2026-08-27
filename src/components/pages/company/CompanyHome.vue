<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { Bar } from 'vue-chartjs'
import { state } from '@/stores/state'
import api from '@/api/client'

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

const routesToday = ref(null)
const questionnaireSlots = ref([])
const statsLoading = ref(false)
const companyData = ref(null)
const companyLoading = ref(false)

const NOT_IN_DB = 'Nao add no Banco'

function orNotInDb(value) {
  return value === null || value === undefined || value === '' ? NOT_IN_DB : value
}

function formatCNPJDisplay(cnpj) {
  if (!cnpj) return NOT_IN_DB
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function formatAddress(data) {
  if (!data) return NOT_IN_DB
  return [
    data.street,
    data.number && `nº ${data.number}`,
    data.complement,
    data.neighborhood,
    data.city && data.state && `${data.city} - ${data.state}`,
  ].filter(Boolean).join(', ') || NOT_IN_DB
}

const chartData = computed(() => ({
  labels: questionnaireSlots.value.map((slot) => slot.label),
  datasets: [
    {
      data: questionnaireSlots.value.map((slot) => slot.confirmed),
      backgroundColor: '#df801a',
      borderRadius: 0,
      barThickness: 38
    }
  ]
}))

const chartMax = computed(() => {
  const max = Math.max(2, ...questionnaireSlots.value.map((slot) => slot.confirmed))
  return Math.ceil(max / 2) * 2
})

const chartOptions = computed(() => ({
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
      max: chartMax.value,
      ticks: { stepSize: Math.max(1, Math.round(chartMax.value / 10)), color: '#666' },
      grid: { color: '#bbb', lineWidth: 1 },
      border: { display: false }
    }
  }
}))

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

async function fetchStats() {
  statsLoading.value = true
  try {
    const { data: stats } = await api.get('/companies/me/stats/')
    routesToday.value = stats.routes_today
    questionnaireSlots.value = stats.questionnaire_by_slot || []
  } catch {
    routesToday.value = null
    questionnaireSlots.value = []
  } finally {
    statsLoading.value = false
  }
}

async function fetchCompany() {
  companyLoading.value = true
  try {
    const { data } = await api.get('/companies/me/')
    companyData.value = data
  } catch {
    companyData.value = null
  } finally {
    companyLoading.value = false
  }
}

onMounted(() => {
  fetchStats()
  fetchCompany()
})
</script>

<template>
  <div class="content">

    <div class="titulo">
      <h2>Gerenciamento: {{ companyData?.trade_name || state.user.name }}</h2>
      <span>{{ data }}</span>
    </div>

    <div class="profile-card">
      <div class="profile-card-header">
        <span class="mdi mdi-domain card-icon"></span>
        <h3>Dados da Empresa</h3>
        <span
          v-if="companyData"
          class="approval-badge"
          :class="{ approved: companyData.is_approved }"
        >
          {{ companyData.is_approved ? 'Aprovada' : 'Pendente' }}
        </span>
      </div>
      <p v-if="companyLoading" class="status-message">Carregando dados da empresa...</p>
      <div v-else class="profile-info-grid">
        <div
          v-for="item in [
            { label: 'Nome Fantasia', value: orNotInDb(companyData?.trade_name) },
            { label: 'Razão Social', value: orNotInDb(companyData?.legal_name) },
            { label: 'CNPJ', value: companyData?.cnpj ? formatCNPJDisplay(companyData.cnpj) : NOT_IN_DB },
            { label: 'Endereço', value: formatAddress(companyData) },
          ]"
          :key="item.label"
          class="profile-info-item"
        >
          <span class="profile-info-label">{{ item.label }}</span>
          <span class="profile-info-value">{{ item.value }}</span>
        </div>
      </div>
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
          <p>{{ routesToday ?? '—' }}</p>
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
      <h2>Questionário {{ data }}</h2>
      <div class="chart-container">
        <p v-if="statsLoading">Carregando...</p>
        <p v-else-if="!questionnaireSlots.length">Nenhum horário de rota cadastrado ainda.</p>
        <Bar v-else :data="chartData" :options="chartOptions" />
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

.profile-card {
  margin-top: 24px;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--superfice);
  box-shadow: var(--shadow);
}

.profile-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.profile-card-header h3 {
  margin: 0;
  font-size: 18px;
  flex: 1;
}

.approval-badge {
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(220, 38, 38, 0.1);
  color: var(--danger);
}

.approval-badge.approved {
  background: rgba(5, 150, 105, 0.1);
  color: var(--success);
}

.profile-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.profile-info-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.profile-info-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.profile-info-value {
  font-size: 0.92rem;
  color: var(--text);
  font-weight: 500;
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

  .profile-info-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
