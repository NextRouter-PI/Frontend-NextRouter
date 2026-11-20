<script setup>
import { ref, onMounted } from 'vue'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useInputFormat } from '@/composables/useInputFormat'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'

function emptyPoint() {
  return {
    name: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    latitude: null,
    longitude: null,
  }
}

const store = useTransporteStore()
const scope = useAccountScope()
const { formatCEP } = useInputFormat()

const form = ref(emptyPoint())
const editingId = ref(null)
const saving = ref(false)
const error = ref('')
const notice = ref('')

function startEdit(ponto) {
  editingId.value = ponto.id
  error.value = ''
  notice.value = ''
  form.value = {
    name: ponto.name || '',
    street: ponto.street || '',
    number: ponto.number || '',
    complement: ponto.complement || '',
    neighborhood: ponto.neighborhood || '',
    city: ponto.city || '',
    state: ponto.state || '',
    cep: formatCEP(ponto.cep || ''),
    latitude: ponto.latitude ?? null,
    longitude: ponto.longitude ?? null,
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetForm() {
  editingId.value = null
  error.value = ''
  form.value = emptyPoint()
}

async function handleSubmit() {
  if (!scope.current() || saving.value) return
  error.value = ''
  notice.value = ''

  const lat = Number(form.value.latitude)
  const lng = Number(form.value.longitude)
  if (
    form.value.latitude == null ||
    form.value.latitude === '' ||
    form.value.longitude == null ||
    form.value.longitude === '' ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    error.value = 'Clique no mapa ou informe um CEP válido para definir as coordenadas do ponto de destino.'
    return
  }

  saving.value = true
  const payload = {
    point_type: 'destination',
    name: form.value.name.trim(),
    street: form.value.street.trim(),
    number: form.value.number.trim(),
    complement: form.value.complement.trim(),
    neighborhood: form.value.neighborhood.trim(),
    city: form.value.city.trim(),
    state: form.value.state.trim().toUpperCase(),
    cep: form.value.cep.replace(/\D/g, ''),
    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6),
  }

  const saved = editingId.value
    ? await store.atualizarPontoOperacional(editingId.value, payload, { signal: scope.signal })
    : await store.adicionarPontoOperacional(payload, { signal: scope.signal })

  if (!scope.current()) return
  saving.value = false

  if (!saved) {
    error.value = typeof store.error === 'string' ? store.error : 'Não foi possível salvar o ponto de destino.'
    return
  }

  notice.value = editingId.value
    ? 'Ponto de destino atualizado com sucesso.'
    : 'Ponto de destino cadastrado com sucesso.'
  resetForm()
}

onMounted(async () => {
  await store.fetchPontosOperacionais({ signal: scope.signal })
})
</script>

<template>
  <div class="points-page">
    <div class="page-header">
      <h1>Pontos Operacionais de Destino</h1>
      <p class="subtitle">
        Cadastre os pontos de destino para vincular aos grupos de atendimento. Informe o CEP e ajuste a localização no mapa (com suporte a tela cheia).
        As garagens ficam na seção de Veículos.
      </p>
    </div>

    <Transition name="fade-slide">
      <p v-if="notice" class="notice-banner" role="status">{{ notice }}</p>
    </Transition>
    <Transition name="fade-slide">
      <p v-if="error || store.error" class="error-banner" role="alert">{{ error || store.error }}</p>
    </Transition>

    <section class="panel form-panel">
      <h2>{{ editingId ? 'Editar Ponto de Destino' : 'Novo Ponto de Destino' }}</h2>
      <form class="point-form" @submit.prevent="handleSubmit">
        <BaseInput
          v-model="form.name"
          label="Nome do destino"
          required
          placeholder="Ex.: IFC Campus Araquari"
          :disabled="saving"
        />

        <AddressCepMapField
          v-model:cep="form.cep"
          v-model:street="form.street"
          v-model:number="form.number"
          v-model:complement="form.complement"
          v-model:neighborhood="form.neighborhood"
          v-model:city="form.city"
          v-model:state="form.state"
          v-model:latitude="form.latitude"
          v-model:longitude="form.longitude"
          :format-cep="formatCEP"
          :disabled="saving"
          complement-placeholder="Portão principal, bloco..."
          map-label="Localização do Ponto de Destino"
        />

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Ponto' }}
          </button>
          <button v-if="editingId" type="button" class="btn-outline" :disabled="saving" @click="resetForm">
            Cancelar edição
          </button>
        </div>
      </form>
    </section>

    <section class="panel list-panel">
      <h2>Pontos de Destino Cadastrados ({{ store.pontosDestino.length }})</h2>
      <SkeletonCard v-if="store.pointsLoading" :count="2" />
      <p v-else-if="!store.pontosDestino.length" class="hint">
        Nenhum ponto de destino cadastrado ainda. Preencha o formulário e selecione a localização no mapa acima.
      </p>
      <TransitionGroup v-else name="list-stagger" tag="div" class="points-list">
        <article v-for="ponto in store.pontosDestino" :key="ponto.id" class="point-card">
          <div>
            <h3>{{ ponto.name }}</h3>
            <p class="point-address">
              {{ ponto.street }}, {{ ponto.number }} — {{ ponto.neighborhood }}, {{ ponto.city }}/{{ ponto.state }} (CEP {{ formatCEP(ponto.cep) }})
            </p>
            <p class="point-coords">Lat {{ ponto.latitude }} · Lng {{ ponto.longitude }}</p>
          </div>
          <div class="point-card-actions">
            <RouterLink :to="{ path: '/cadastro-rota', query: { destination: ponto.id } }" class="btn-outline">
              <span class="mdi mdi-routes" aria-hidden="true"></span>
              Vincular grupo
            </RouterLink>
            <button type="button" class="btn-outline" @click="startEdit(ponto)">
              <span class="mdi mdi-pencil-outline" aria-hidden="true"></span>
              Editar
            </button>
          </div>
        </article>
      </TransitionGroup>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.points-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 20px 16px 96px;
  color: var(--text);
}

.page-header {
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0 0 6px;
  font-size: 1.5rem;
}

.subtitle,
.hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.45;
}

.notice-banner,
.error-banner {
  padding: 12px 14px;
  border-radius: 10px;
  margin: 0 0 14px;
  font-size: 0.9rem;
  font-weight: 600;
}

.notice-banner {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: var(--success);
}

.error-banner {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: var(--danger);
}

.panel {
  background: var(--color-surface);
  outline: 1px solid var(--border);
  outline-offset: -1px;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow: var(--shadow);
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 1.12rem;
}

.point-form {
  display: flex;
  flex-direction: column;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}

.btn-primary,
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s var(--ease-fluid), border-color 0.2s var(--ease-fluid),
    color 0.2s var(--ease-fluid);
}

.btn-primary {
  background: var(--primary);
  color: var(--color-on-primary);
  border: 1.5px solid var(--primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  color: var(--text);
  border: 1.5px solid var(--border);
}

.btn-outline:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.points-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.point-card {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--bg);
  outline: 1px solid var(--border);
  outline-offset: -1px;
  transition: outline-color 0.2s var(--ease-fluid);
}

.point-card:hover {
  outline-color: var(--primary);
}

.point-card h3 {
  margin: 0 0 4px;
  font-size: 1rem;
}

.point-address {
  margin: 0 0 4px;
  font-size: 0.88rem;
  color: var(--text);
}

.point-coords {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.point-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
