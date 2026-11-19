<script setup>
import { ref, onMounted } from 'vue'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const stores = useTransporteStore()
const scope = useAccountScope()

const id = Number(route.params.id)
const erro = ref('')
const carregando = ref(true)
const salvando = ref(false)

const veiculo = ref({
  placa: '',
  modelo: '',
  ano: '',
  capacidade: '',
  garagePointId: '',
  cor: '',
  status: 'Ativo',
})

const featureInput = ref('')
const caracteristicas = ref([])

function adicionarFeature() {
  const value = featureInput.value.trim()
  if (value && !caracteristicas.value.includes(value)) {
    caracteristicas.value.push(value)
  }
  featureInput.value = ''
}

function removerFeature(feature) {
  caracteristicas.value = caracteristicas.value.filter((f) => f !== feature)
}

onMounted(async () => {
  await stores.fetchVeiculos({ signal: scope.signal })
  if (!scope.current()) return
  const encontrado = stores.veiculos.find((v) => v.id === id)

  if (encontrado) {
    veiculo.value = {
      placa: encontrado.placa,
      modelo: encontrado.modelo,
      ano: encontrado.ano,
      capacidade: encontrado.capacidade,
      garagePointId: encontrado.garagePointId ?? '',
      cor: encontrado.cor || '',
      status: encontrado.status,
    }
    caracteristicas.value = [...(encontrado.caracteristicas || [])]
  } else {
    erro.value = 'Veículo não encontrado.'
  }

  carregando.value = false
})

const salvar = async () => {
  if (!scope.current() || salvando.value || carregando.value) return
  erro.value = ''

  if (!veiculo.value.placa.trim() || !veiculo.value.capacidade || Number(veiculo.value.capacidade) < 1) {
    erro.value = 'Informe a placa e uma capacidade positiva.'
    return
  }

  salvando.value = true
  const sucesso = await stores.atualizarVeiculo(
    id,
    {
      ...veiculo.value,
      garagePointId: veiculo.value.garagePointId || null,
      caracteristicas: caracteristicas.value,
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvando.value = false

  if (sucesso) {
    router.push('/transporte')
  } else {
    erro.value = typeof stores.error === 'string' ? stores.error : 'Erro ao salvar alterações.'
  }
}
</script>

<template>
  <div class="content">
    <div class="top-bar">
      <button type="button" class="back-button" @click="$router.back()">
        <span class="mdi mdi-arrow-left"></span>
      </button>
      <h1>Editar Veículo</h1>
    </div>

    <p class="domain-hint">
      Alterar dados ou ponto de garagem do veículo regenera dias futuros e invalida prontidão de viagens agendadas. Veículos em operação (`in_progress`) não podem ser editados.
    </p>

    <form class="editar-form" @submit.prevent="salvar">
      <div class="form-group">
        <label>Placa<span>*</span></label>
        <input v-model="veiculo.placa" maxlength="10" required :disabled="salvando || carregando" />
      </div>
      <div class="form-group">
        <label>Modelo</label>
        <input v-model="veiculo.modelo" :disabled="salvando || carregando" />
      </div>
      <div class="form-group">
        <label>Ano</label>
        <input v-model="veiculo.ano" type="number" min="1950" max="2100" :disabled="salvando || carregando" />
      </div>
      <div class="form-group">
        <label>Capacidade (lugares)<span>*</span></label>
        <input v-model="veiculo.capacidade" type="number" min="1" required :disabled="salvando || carregando" />
      </div>
      <div class="form-group">
        <label>Cor</label>
        <input v-model="veiculo.cor" placeholder="Branco" :disabled="salvando || carregando" />
      </div>
      <div class="form-group">
        <label>Ponto operacional de garagem (opcional)</label>
        <select v-model="veiculo.garagePointId" :disabled="salvando || carregando">
          <option value="">Sem ponto de garagem fixo</option>
          <option v-for="ponto in stores.pontosOperacionais" :key="ponto.id" :value="ponto.id">
            {{ ponto.name }} — {{ ponto.city }}/{{ ponto.state }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select v-model="veiculo.status" :disabled="salvando || carregando">
          <option value="Ativo">Ativo</option>
          <option value="Manutenção">Manutenção</option>
        </select>
      </div>
      <div class="form-group">
        <label>Características</label>
        <div class="feature-input-row">
          <input
            v-model="featureInput"
            placeholder="Ex.: Ar-condicionado"
            :disabled="salvando || carregando"
            @keydown.enter.prevent="adicionarFeature"
          />
          <button type="button" class="btn-add-feature" :disabled="salvando || carregando" @click="adicionarFeature">
            Adicionar
          </button>
        </div>
        <div v-if="caracteristicas.length" class="feature-chips">
          <span v-for="feature in caracteristicas" :key="feature" class="feature-chip">
            {{ feature }}
            <button type="button" :disabled="salvando || carregando" @click="removerFeature(feature)">
              <span class="mdi mdi-close"></span>
            </button>
          </span>
        </div>
      </div>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <button class="btn-salvar" type="submit" :disabled="salvando || carregando">
        {{ salvando ? 'Salvando...' : 'SALVAR ALTERAÇÕES' }}
      </button>
      <button class="btn-cancelar" type="button" :disabled="salvando" @click="$router.back()">CANCELAR</button>
    </form>
  </div>
</template>

<style scoped>
.content {
  padding: 18px 18px 120px;
  max-width: 600px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
}

.top-bar .mdi {
  font-size: 28px;
  color: var(--text);
}

.top-bar h1 {
  font-weight: 700;
  font-size: 28px;
  margin-left: 16px;
}

.domain-hint {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}

.form-group span {
  color: var(--primary);
  margin-left: 2px;
}

.form-group input,
.form-group select {
  width: 100%;
  height: 48px;
  padding: 0 12px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 15px;
  color: var(--text);
  outline: none;
  box-sizing: border-box;
  background: var(--bg);
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary);
}

.feature-input-row {
  display: flex;
  gap: 10px;
}

.feature-input-row input {
  flex: 1;
}

.btn-add-feature {
  height: 48px;
  padding: 0 16px;
  border: none;
  border-radius: 12px;
  background: var(--gradient-primary);
  color: white;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.feature-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(223, 128, 26, 0.1);
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 600;
}

.feature-chip button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 0;
  font-size: 14px;
}

.btn-salvar {
  width: 100%;
  height: 48px;
  margin-top: 20px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancelar {
  width: 100%;
  height: 48px;
  margin-top: 12px;
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.erro {
  color: var(--danger, #d32f2f);
  font-size: 13px;
  margin-bottom: 16px;
}
</style>
