<script setup>
import { ref, onMounted } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const store = useRotasStore()
const scope = useAccountScope()

const grupoForm = ref({
  name: '',
  destinationId: '',
})

const erro = ref('')
const carregando = ref(true)
const salvando = ref(false)

onMounted(async () => {
  await store.fetchRotas({ signal: scope.signal })
  if (!scope.current()) return
  const preselected = Number(route.query.destination)
  if (preselected && store.pontosDestino.some((p) => p.id === preselected)) {
    grupoForm.value.destinationId = preselected
  }
  carregando.value = false
})

const salvar = async () => {
  if (!scope.current() || salvando.value) return
  erro.value = ''

  if (!grupoForm.value.name.trim() || !grupoForm.value.destinationId) {
    erro.value = 'Informe o nome do grupo de atendimento e selecione o ponto operacional de destino.'
    return
  }

  salvando.value = true
  const criado = await store.criarGrupo(
    {
      name: grupoForm.value.name,
      destinationId: Number(grupoForm.value.destinationId),
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvando.value = false

  if (!criado) {
    erro.value = typeof store.error === 'string' ? store.error : 'Erro ao cadastrar grupo de atendimento.'
    return
  }

  router.push(`/routes/${criado.id}/edit/settings`)
}
</script>

<template>
  <div class="content">
    <div class="top-bar">
      <button type="button" class="back-button" @click="$router.back()">
        <BaseIcon name="mdi-arrow-left" />
      </button>
      <h1>Cadastrar Grupo de Atendimento</h1>
    </div>

    <p class="hint-lead">
      Primeiro defina as configurações básicas do grupo (nome e ponto de destino). Em seguida, você poderá configurar a programação habitual (idas e retornos), políticas de confirmação e criar as rotas habituais (com passageiros no mapa) e compartilhadas.
    </p>

    <div v-if="!carregando && !store.pontosDestino.length" class="empty-points">
      <p>Você ainda não possui pontos operacionais de destino cadastrados para vincular ao grupo.</p>
      <RouterLink to="/operational-points" class="link-points">Ir para Pontos de Destino</RouterLink>
    </div>

    <form v-else class="cadastro" @submit.prevent="salvar">
      <div class="form-group">
        <label>Nome do Grupo / Destino<span>*</span></label>
        <input v-model="grupoForm.name" placeholder="Ex.: UDESC Joinville — Manhã" required :disabled="salvando || carregando" />
      </div>
      <div class="form-group">
        <label>Ponto Operacional de Destino<span>*</span></label>
        <select v-model="grupoForm.destinationId" required :disabled="salvando || carregando">
          <option value="" disabled>Selecione um ponto de destino</option>
          <option v-for="ponto in store.pontosDestino" :key="ponto.id" :value="ponto.id">
            {{ ponto.name }} — {{ ponto.city }}/{{ ponto.state }} (CEP {{ ponto.cep }})
          </option>
        </select>
      </div>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <button class="btn-salvar" type="submit" :disabled="salvando || carregando">
        {{ salvando ? 'Salvando...' : 'Criar grupo e configurar serviços' }}
      </button>
      <button class="btn-cancelar" type="button" :disabled="salvando" @click="$router.back()">Cancelar</button>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.content {
  @include section-container(120px);
  display: block;
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
  font-size: 24px;
  margin-left: 16px;
}

.hint-lead {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 24px;
}

.empty-points {
  padding: 20px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--color-surface);
  text-align: center;
}

.link-points {
  display: inline-block;
  margin-top: 12px;
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
}

.form-group {
  margin-bottom: 24px;
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
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary);
}

.erro {
  color: var(--danger, var(--danger));
  font-size: 13px;
  margin-bottom: 16px;
}

.btn-salvar {
  width: 100%;
  height: 48px;
  margin-top: 16px;
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
