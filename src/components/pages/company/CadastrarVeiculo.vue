<script setup>
import { ref, onMounted } from 'vue'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useRouter } from 'vue-router'

const router = useRouter()
const stores = useTransporteStore()
const scope = useAccountScope()

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
const erro = ref('')
const salvando = ref(false)

onMounted(async () => {
  await stores.fetchPontosOperacionais({ signal: scope.signal })
})

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

const salvar = async () => {
  if (!scope.current() || salvando.value) return
  erro.value = ''

  if (!veiculo.value.placa.trim() || !veiculo.value.capacidade || Number(veiculo.value.capacidade) < 1) {
    erro.value = 'Informe a placa e uma capacidade positiva.'
    return
  }

  salvando.value = true
  const sucesso = await stores.adicionarVeiculo(
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
    erro.value = typeof stores.error === 'string' ? stores.error : 'Erro ao cadastrar veículo.'
  }
}
</script>

<template>
  <div class="content">
    <div class="top-bar">
      <button type="button" class="back-button" @click="$router.back()">
        <span class="mdi mdi-arrow-left"></span>
      </button>
      <h1>Cadastrar Veículo</h1>
    </div>

    <p class="domain-hint">
      Veículos pertencem à frota da empresa. A designação de veículo e motorista acontece explicitamente em cada serviço habitual ou viagem datada, não no cadastro do veículo.
    </p>

    <form class="cadastro" @submit.prevent="salvar">
      <div class="form-group">
        <label>Placa<span>*</span></label>
        <input v-model="veiculo.placa" placeholder="ABC1D23" maxlength="10" required :disabled="salvando" />
      </div>
      <div class="form-group">
        <label>Modelo</label>
        <input v-model="veiculo.modelo" placeholder="Mercedes Sprinter" :disabled="salvando" />
      </div>
      <div class="form-group">
        <label>Ano</label>
        <input v-model="veiculo.ano" type="number" min="1950" max="2100" placeholder="2020" :disabled="salvando" />
      </div>
      <div class="form-group">
        <label>Capacidade (lugares)<span>*</span></label>
        <input v-model="veiculo.capacidade" type="number" min="1" placeholder="15" required :disabled="salvando" />
      </div>
      <div class="form-group">
        <label>Cor</label>
        <input v-model="veiculo.cor" placeholder="Branco" :disabled="salvando" />
      </div>
      <div class="form-group">
        <label>Garagem (opcional)</label>
        <select v-model="veiculo.garagePointId" :disabled="salvando">
          <option value="">Sem garagem vinculada</option>
          <option v-for="ponto in stores.garagens" :key="ponto.id" :value="ponto.id">
            {{ ponto.name }} — {{ ponto.city }}/{{ ponto.state }}
          </option>
        </select>
        <p v-if="!stores.pointsLoading && !stores.garagens.length" class="field-hint">
          Nenhuma garagem cadastrada. Cadastre uma na aba Garagens da seção de Veículos.
        </p>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select v-model="veiculo.status" :disabled="salvando">
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
            :disabled="salvando"
            @keydown.enter.prevent="adicionarFeature"
          />
          <button type="button" class="btn-add-feature" :disabled="salvando" @click="adicionarFeature">Adicionar</button>
        </div>
        <div v-if="caracteristicas.length" class="feature-chips">
          <span v-for="feature in caracteristicas" :key="feature" class="feature-chip">
            {{ feature }}
            <button type="button" :disabled="salvando" @click="removerFeature(feature)">
              <span class="mdi mdi-close"></span>
            </button>
          </span>
        </div>
      </div>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <button class="btn-salvar" type="submit" :disabled="salvando">{{ salvando ? 'Salvando...' : 'SALVAR' }}</button>
      <button class="btn-cancelar" type="button" :disabled="salvando" @click="$router.back()">CANCELAR</button>
    </form>
  </div>
</template>

<style scoped>
.content {
  margin: 0 auto;
  max-width: 600px;
  padding: 18px 18px 120px;
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

.erro {
  color: var(--danger, #d32f2f);
  font-size: 13px;
  margin-bottom: 16px;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 0.82rem;
  color: var(--text-muted);
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
</style>
