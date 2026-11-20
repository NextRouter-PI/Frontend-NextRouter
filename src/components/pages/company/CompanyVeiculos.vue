<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useRouter } from 'vue-router'

const store = useTransporteStore()
const scope = useAccountScope()
const router = useRouter()

const abaAtiva = ref('frota') // 'frota' | 'garagens'
const busca = ref('')
const filtroAtivo = ref('Todas')
const menuAberto = ref(null)

const editandoPontoId = ref(null)
const salvandoPonto = ref(false)
const erroPonto = ref('')
const avisoPonto = ref('')
const pontoForm = ref(emptyPoint())

function emptyPoint() {
  return {
    point_type: 'garage',
    name: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    latitude: '',
    longitude: '',
  }
}

onMounted(async () => {
  await store.fetchVeiculos({ signal: scope.signal })
})

const alterarStatus = async (id) => {
  await store.alterarStatus(id, { signal: scope.signal })
  menuAberto.value = null
}

const veiculosFiltrados = computed(() => {
  const lista = store.veiculos || []
  return lista.filter((v) => {
    const correspondeBusca =
      v.placa.toLowerCase().includes(busca.value.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busca.value.toLowerCase())

    const statusParaFiltro = filtroAtivo.value === 'Ativas' ? 'Ativo' : filtroAtivo.value
    const correspondeFiltro = filtroAtivo.value === 'Todas' || v.status === statusParaFiltro

    return correspondeBusca && correspondeFiltro
  })
})

const toggleMenu = (id) => {
  menuAberto.value = menuAberto.value === id ? null : id
}

function iniciarEdicaoPonto(ponto) {
  editandoPontoId.value = ponto.id
  erroPonto.value = ''
  avisoPonto.value = ''
  pontoForm.value = {
    point_type: 'garage',
    name: ponto.name || '',
    street: ponto.street || '',
    number: ponto.number || '',
    complement: ponto.complement || '',
    neighborhood: ponto.neighborhood || '',
    city: ponto.city || '',
    state: ponto.state || '',
    cep: ponto.cep || '',
    latitude: String(ponto.latitude ?? ''),
    longitude: String(ponto.longitude ?? ''),
  }
}

function cancelarEdicaoPonto() {
  editandoPontoId.value = null
  erroPonto.value = ''
  pontoForm.value = emptyPoint()
}

function veiculosDaGaragem(garageId) {
  return (store.veiculos || []).filter((v) => v.garagePointId === garageId)
}

async function salvarPonto() {
  if (!scope.current() || salvandoPonto.value) return
  erroPonto.value = ''
  avisoPonto.value = ''

  const lat = Number(pontoForm.value.latitude)
  const lng = Number(pontoForm.value.longitude)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    erroPonto.value = 'Informe latitude (-90 a 90) e longitude (-180 a 180) válidas.'
    return
  }

  salvandoPonto.value = true
  const payload = { ...pontoForm.value, point_type: 'garage' }
  const resultado = editandoPontoId.value
    ? await store.atualizarPontoOperacional(editandoPontoId.value, payload, { signal: scope.signal })
    : await store.adicionarPontoOperacional(payload, { signal: scope.signal })
  if (!scope.current()) return
  salvandoPonto.value = false

  if (resultado) {
    avisoPonto.value = editandoPontoId.value
      ? 'Garagem atualizada com sucesso.'
      : 'Garagem cadastrada com sucesso.'
    editandoPontoId.value = null
    pontoForm.value = emptyPoint()
  } else {
    erroPonto.value = store.error || 'Não foi possível salvar a garagem.'
  }
}
</script>

<template>
  <div class="content">
    <div class="filter-chips" role="tablist" aria-label="Configuração de frota e garagens">
      <button
        type="button"
        :class="['chip', { active: abaAtiva === 'frota' }]"
        @click="abaAtiva = 'frota'"
      >
        Frota ({{ store.veiculos.length }})
      </button>
      <button
        type="button"
        :class="['chip', { active: abaAtiva === 'garagens' }]"
        @click="abaAtiva = 'garagens'"
      >
        Garagens ({{ store.garagens.length }})
      </button>
    </div>

    <template v-if="abaAtiva === 'frota'">
      <div class="search-container">
        <span class="mdi mdi-magnify search-icon"></span>
        <input v-model="busca" type="text" placeholder="Busque por placa, modelo..." />
      </div>

      <div class="filter-chips">
        <button
          v-for="f in ['Todas', 'Ativas', 'Manutenção']"
          :key="f"
          type="button"
          :class="['chip', { active: filtroAtivo === f }]"
          @click="filtroAtivo = f"
        >
          {{ f }}
        </button>
      </div>

      <p v-if="store.loading" class="status-message">Carregando veículos...</p>
      <p v-else-if="store.error" class="status-message error" role="alert">{{ store.error }}</p>
      <p v-else-if="!veiculosFiltrados.length" class="status-message">Nenhum veículo encontrado.</p>

      <div class="list-container">
        <div v-for="veiculo in veiculosFiltrados" :key="veiculo.id" class="transport-card">
          <div class="card-header">
            <div class="header-main">
              <h3>{{ veiculo.placa }}</h3>
              <p class="card-subtitle">{{ veiculo.modelo || 'Modelo não informado' }}</p>
            </div>

            <div class="menu-container">
              <button type="button" class="menu-dots" aria-label="Opções do veículo" @click="toggleMenu(veiculo.id)">
                <span class="mdi mdi-dots-vertical"></span>
              </button>

              <div v-if="menuAberto === veiculo.id" class="menu-dropdown">
                <button type="button" @click="router.push(`/veiculos/editar/${veiculo.id}`)">
                  Editar informações do veículo
                </button>
                <button type="button" @click="alterarStatus(veiculo.id)">
                  {{ veiculo.status === 'Ativo' ? 'Enviar para a manutenção' : 'Retirar de manutenção' }}
                </button>
              </div>
            </div>
          </div>

          <div class="card-details">
            <div class="detail-item">
              <span class="mdi mdi-seat-passenger"></span>
              <span>{{ veiculo.capacidade }} Lugares</span>
            </div>
            <div v-if="veiculo.ano" class="detail-item">
              <span class="mdi mdi-calendar-outline"></span>
              <span>{{ veiculo.ano }}</span>
            </div>
            <div v-if="veiculo.cor" class="detail-item">
              <span class="mdi mdi-palette-outline"></span>
              <span>{{ veiculo.cor }}</span>
            </div>
            <div v-if="veiculo.garagePointName" class="detail-item">
              <span class="mdi mdi-garage-outline"></span>
              <span>Garagem: {{ veiculo.garagePointName }}</span>
            </div>
          </div>

          <div v-if="veiculo.caracteristicas?.length" class="feature-chips">
            <span v-for="feature in veiculo.caracteristicas" :key="feature" class="feature-chip">
              {{ feature }}
            </span>
          </div>

          <span :class="['status-tag', veiculo.status.toLowerCase()]">
            {{ veiculo.status }}
          </span>
        </div>
      </div>

      <button type="button" class="fab-add" aria-label="Cadastrar veículo" @click="router.push('/cadastro-veiculo')">
        <span class="mdi mdi-plus"></span>
      </button>
    </template>

    <template v-else>
      <div class="transport-card">
        <h3>{{ editandoPontoId ? 'Editar garagem' : 'Nova garagem' }}</h3>
        <p class="card-subtitle">
          Cadastre as garagens da frota com endereço completo e coordenadas para vinculá-las aos veículos.
          Pontos de destino continuam na seção de Pontos Operacionais.
        </p>

        <form class="point-form" @submit.prevent="salvarPonto">
          <div class="point-grid">
            <div>
              <label>Identificação da garagem<span>*</span></label>
              <input v-model="pontoForm.name" placeholder="Ex.: Garagem Central Joinville" required :disabled="salvandoPonto" />
            </div>
            <div>
              <label>CEP<span>*</span></label>
              <input v-model="pontoForm.cep" placeholder="89200000" maxlength="9" required :disabled="salvandoPonto" />
            </div>
            <div>
              <label>Logradouro<span>*</span></label>
              <input v-model="pontoForm.street" placeholder="Rua Exemplo" required :disabled="salvandoPonto" />
            </div>
            <div>
              <label>Número<span>*</span></label>
              <input v-model="pontoForm.number" placeholder="100" required :disabled="salvandoPonto" />
            </div>
            <div>
              <label>Complemento</label>
              <input v-model="pontoForm.complement" placeholder="Galpão 2" :disabled="salvandoPonto" />
            </div>
            <div>
              <label>Bairro<span>*</span></label>
              <input v-model="pontoForm.neighborhood" placeholder="Centro" required :disabled="salvandoPonto" />
            </div>
            <div>
              <label>Cidade<span>*</span></label>
              <input v-model="pontoForm.city" placeholder="Joinville" required :disabled="salvandoPonto" />
            </div>
            <div>
              <label>UF<span>*</span></label>
              <input v-model="pontoForm.state" placeholder="SC" maxlength="2" required :disabled="salvandoPonto" />
            </div>
            <div>
              <label>Latitude<span>*</span></label>
              <input v-model="pontoForm.latitude" type="number" step="any" placeholder="-26.3044" required :disabled="salvandoPonto" />
            </div>
            <div>
              <label>Longitude<span>*</span></label>
              <input v-model="pontoForm.longitude" type="number" step="any" placeholder="-48.8455" required :disabled="salvandoPonto" />
            </div>
          </div>

          <p v-if="erroPonto" class="status-message error" role="alert">{{ erroPonto }}</p>
          <p v-if="avisoPonto" class="status-message" role="status">{{ avisoPonto }}</p>

          <div class="point-actions">
            <button type="submit" class="btn-primary-inline" :disabled="salvandoPonto">
              {{ salvandoPonto ? 'Salvando...' : editandoPontoId ? 'Salvar garagem' : 'Cadastrar garagem' }}
            </button>
            <button v-if="editandoPontoId" type="button" class="btn-outline-inline" :disabled="salvandoPonto" @click="cancelarEdicaoPonto">
              Cancelar edição
            </button>
          </div>
        </form>
      </div>

      <p v-if="store.pointsLoading" class="status-message">Carregando garagens...</p>
      <p v-else-if="!store.garagens.length" class="status-message">
        Nenhuma garagem cadastrada ainda. Cadastre uma garagem acima para vinculá-la aos veículos da frota.
      </p>

      <div class="list-container">
        <div v-for="ponto in store.garagens" :key="ponto.id" class="transport-card">
          <div class="card-header">
            <div class="header-main">
              <h3>{{ ponto.name }} · #{{ ponto.id }}</h3>
              <p class="card-subtitle">
                {{ ponto.street }}, {{ ponto.number }}{{ ponto.complement ? ` (${ponto.complement})` : '' }} —
                {{ ponto.neighborhood }}, {{ ponto.city }}/{{ ponto.state }} · CEP {{ ponto.cep }}
              </p>
            </div>
            <button type="button" class="btn-outline-inline" @click="iniciarEdicaoPonto(ponto)">Editar</button>
          </div>
          <div class="card-details">
            <div class="detail-item">
              <span class="mdi mdi-crosshairs-gps"></span>
              <span>{{ ponto.latitude }}, {{ ponto.longitude }}</span>
            </div>
            <div class="detail-item">
              <span class="mdi mdi-bus-multiple"></span>
              <span v-if="veiculosDaGaragem(ponto.id).length">
                Veículos vinculados: {{ veiculosDaGaragem(ponto.id).map((v) => v.placa).join(', ') }}
              </span>
              <span v-else>Nenhum veículo vinculado</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.content {
  margin: 0 auto;
  max-width: 680px;
  padding: 18px 18px 140px;
}

.search-container {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-container input {
  width: 100%;
  padding: 10px 10px 10px 44px;
  border-radius: 10px;
  border: 1px solid var(--border-primary);
  background: var(--superfice);
  outline: none;
  color: var(--text);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.chip {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--superfice);
  font-size: 0.85rem;
  color: var(--text-muted);
  cursor: pointer;
}

.chip.active {
  background: rgba(223, 128, 26, 0.08);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
}

.transport-card {
  background: var(--superfice);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.card-header h3 {
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
  color: var(--text);
}

.card-subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 4px;
  line-height: 1.4;
}

.card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 12px 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.menu-container {
  position: relative;
}

.menu-dots {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: var(--text-muted);
}

.menu-dropdown {
  position: absolute;
  bottom: 34px;
  right: 0;
  width: 220px;
  background: var(--primary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-primary);
  z-index: 100;
}

@media (min-width: 640px) {
  .menu-dropdown {
    bottom: auto;
    top: 34px;
  }
}

.menu-dropdown button {
  width: 100%;
  padding: 14px 12px;
  background: transparent;
  border: none;
  color: white;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.menu-dropdown button:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
}

.feature-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.feature-chip {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(223, 128, 26, 0.08);
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 600;
}

.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
}

.status-tag.ativo {
  background-color: rgba(34, 197, 94, 0.15);
  color: var(--success);
}

.status-tag.manutenção {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.point-form {
  margin-top: 16px;
}

.point-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.point-grid label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text);
}

.point-grid label span {
  color: var(--primary);
}

.point-grid input {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;
}

.point-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.btn-primary-inline {
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  background: var(--gradient-primary);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.btn-outline-inline {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
}

.fab-add {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-primary);
  cursor: pointer;
}

.status-message {
  text-align: center;
  color: var(--text-muted);
  padding: 16px 0;
}

.status-message.error {
  color: var(--danger);
}
</style>
