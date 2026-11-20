<script setup>
import { computed, ref, shallowRef } from 'vue'
import { POINT_TYPES, SERVICE_DIRECTIONS, WEEKDAY_OPTIONS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const props = defineProps({
  groupId: { type: Number, required: true },
  services: { type: Array, required: true },
  isShared: { type: Boolean, default: false },
})

const emit = defineEmits(['updated'])

const store = useRotasStore()
const scope = useAccountScope()

function emptyService() {
  return {
    name: '',
    direction: props.isShared ? SERVICE_DIRECTIONS.RETURN : SERVICE_DIRECTIONS.OUTBOUND,
    is_shared: props.isShared,
    weekdays: 0,
    target_time: '',
    driver_membership_id: '',
    vehicle_id: '',
    origin_id: '',
    destination_id: '',
  }
}

const editandoId = shallowRef(null)
const salvando = shallowRef(false)
const erro = shallowRef('')
const aviso = shallowRef('')
const form = ref(emptyService())
const paradasSelecionadas = ref([])
const paradaParaAdicionar = shallowRef('')

const title = computed(() =>
  props.isShared
    ? '3B. Serviços Compartilhados (viagens intermediárias)'
    : '3. Serviços Habituais (Ida e Retorno separados)',
)
const subtitle = computed(() =>
  props.isShared
    ? 'Usados para retornos ou deslocamentos intermediários onde passageiros de diferentes rotas podem viajar juntos. Por variarem a cada dia, não possuem rotas ou paradas fixas.'
    : 'Defina o sentido, horário, dias da semana, motorista/veículo habituais e os pontos obrigatórios de origem e destino.',
)

const motoristasAtivos = computed(() => store.vinculosAtivos.filter((m) => m.driver != null))
const veiculosAtivos = computed(() => store.todosVeiculos.filter((v) => v.status === 'active'))
const pontosOrigemDestino = computed(() =>
  store.pontosOperacionais.filter(
    (p) => p.point_type === POINT_TYPES.GARAGE || p.point_type === POINT_TYPES.DESTINATION,
  ),
)

function labelPontoOrigemDestino(p) {
  const tipo = p.point_type === POINT_TYPES.GARAGE ? 'Garagem' : 'Destino'
  return `[${tipo}] ${p.name} (${p.city}/${p.state})`
}

function nomePonto(pid) {
  const p = store.pontosOperacionais.find((item) => item.id === pid)
  return p ? `${p.name} (${p.city}/${p.state})` : `Ponto #${pid}`
}

function toggleWeekday(bit) {
  form.value.weekdays ^= bit
}

function iniciarEdicao(s) {
  editandoId.value = s.id
  erro.value = ''
  aviso.value = ''
  form.value = {
    name: s.name || '',
    direction: s.direction || (props.isShared ? SERVICE_DIRECTIONS.RETURN : SERVICE_DIRECTIONS.OUTBOUND),
    is_shared: props.isShared,
    weekdays: Number(s.weekdays) || 0,
    target_time: String(s.target_time || '').slice(0, 5),
    driver_membership_id: s.driver_membership ?? '',
    vehicle_id: s.vehicle ?? '',
    origin_id: s.origin ?? '',
    destination_id: s.destination ?? '',
  }
  paradasSelecionadas.value = !props.isShared && Array.isArray(s.point_ids) ? [...s.point_ids] : []
}

function cancelarEdicao() {
  editandoId.value = null
  erro.value = ''
  form.value = emptyService()
  paradasSelecionadas.value = []
}

function adicionarParada() {
  const pid = Number(paradaParaAdicionar.value)
  if (pid && !paradasSelecionadas.value.includes(pid)) {
    paradasSelecionadas.value.push(pid)
  }
  paradaParaAdicionar.value = ''
}

function removerParada(pid) {
  paradasSelecionadas.value = paradasSelecionadas.value.filter((item) => item !== pid)
}

async function salvar() {
  if (!scope.current() || salvando.value) return
  erro.value = ''
  aviso.value = ''

  if (
    !form.value.name.trim() ||
    !form.value.weekdays ||
    !form.value.target_time ||
    !form.value.origin_id ||
    !form.value.destination_id
  ) {
    erro.value = 'Informe nome, dias da semana, horário-alvo, ponto de origem e ponto de destino.'
    return
  }

  salvando.value = true
  const payload = {
    ...form.value,
    is_shared: props.isShared,
    route_group_id: props.groupId,
  }
  const saved = editandoId.value
    ? await store.atualizarServico(editandoId.value, payload, { signal: scope.signal })
    : await store.criarServico(payload, { signal: scope.signal })

  if (!scope.current()) return
  if (!saved) {
    salvando.value = false
    erro.value = store.error || 'Erro ao salvar serviço.'
    return
  }

  if (!props.isShared) {
    const stopsOk = await store.salvarParadasServico(saved.id, paradasSelecionadas.value, {
      signal: scope.signal,
    })
    if (!scope.current()) return
    if (!stopsOk) {
      salvando.value = false
      erro.value = store.error || 'Serviço salvo, mas houve falha ao salvar as paradas habituais.'
      emit('updated')
      return
    }
  }

  salvando.value = false
  const label = props.isShared ? 'Serviço compartilhado' : 'Serviço habitual'
  aviso.value = editandoId.value ? `${label} atualizado.` : `${label} cadastrado.`
  cancelarEdicao()
  emit('updated')
}
</script>

<template>
  <BaseCard :title="title" :subtitle="subtitle">
    <div v-if="services.length" class="item-list">
      <div v-for="s in services" :key="s.id" class="sub-card">
        <div class="sub-card-header">
          <div>
            <strong>{{ s.name }} (#{{ s.id }})</strong> ·
            <span class="badge-dir">
              {{ s.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }}
            </span>
            <span v-if="isShared" class="badge-dir">Compartilhado</span> ·
            {{ s.targetTimeLabel }} · {{ s.weekdaysLabel }}
          </div>
          <BaseButton variant="outline" size="sm" @click="iniciarEdicao(s)">Editar</BaseButton>
        </div>
        <p class="sub-meta">
          Motorista: {{ s.driverName }} · Veículo: {{ s.vehiclePlate }} · Origem: {{ s.originName }} →
          Destino: {{ s.destinationName }}
        </p>
        <p v-if="!isShared" class="sub-meta">
          Paradas configuradas ({{ s.point_ids?.length || 0 }}):
          {{ s.point_ids?.length ? s.point_ids.map(nomePonto).join(' → ') : 'Nenhuma parada habitual' }}
        </p>
      </div>
    </div>
    <p v-else class="empty-msg">
      Nenhum serviço {{ isShared ? 'compartilhado' : 'habitual' }} cadastrado neste grupo.
    </p>

    <form class="service-form" @submit.prevent="salvar">
      <h3 class="sub-heading">
        {{
          editandoId
            ? `Editar serviço #${editandoId}`
            : isShared
              ? 'Novo serviço compartilhado'
              : 'Novo serviço habitual'
        }}
      </h3>

      <div class="grid-2">
        <div class="field">
          <label>Nome do serviço<span>*</span></label>
          <input
            v-model="form.name"
            :placeholder="isShared ? 'Ex.: Volta Intermediária 12:00' : 'Ex.: Ida Manhã 07:30'"
            required
            :disabled="salvando"
          />
        </div>
        <div class="field">
          <label>Sentido<span>*</span></label>
          <select v-model="form.direction" :disabled="salvando || Boolean(editandoId)">
            <option :value="SERVICE_DIRECTIONS.OUTBOUND">Ida (outbound)</option>
            <option :value="SERVICE_DIRECTIONS.RETURN">Retorno (return)</option>
          </select>
        </div>
        <div class="field">
          <label>Horário-alvo<span>*</span></label>
          <input v-model="form.target_time" type="time" required :disabled="salvando" />
          <p class="field-explain">Na ida é o horário de chegada ao destino; no retorno é o horário de saída.</p>
        </div>
        <div class="field">
          <label>Motorista habitual (vínculo ativo)</label>
          <select v-model="form.driver_membership_id" :disabled="salvando">
            <option value="">Sem motorista designado</option>
            <option v-for="m in motoristasAtivos" :key="m.id" :value="m.id">
              {{ m.applicant_name }} (vínculo #{{ m.id }})
            </option>
          </select>
        </div>
        <div class="field">
          <label>Veículo habitual (ativo)</label>
          <select v-model="form.vehicle_id" :disabled="salvando">
            <option value="">Sem veículo designado</option>
            <option v-for="v in veiculosAtivos" :key="v.id" :value="v.id">
              {{ v.plate }} — {{ v.model || 'Veículo' }} ({{ v.capacity }} lug.)
            </option>
          </select>
        </div>
        <div class="field">
          <label>Ponto de origem<span>*</span></label>
          <select v-model="form.origin_id" required :disabled="salvando">
            <option value="" disabled>Selecione uma garagem ou destino...</option>
            <option v-for="p in pontosOrigemDestino" :key="p.id" :value="p.id">
              {{ labelPontoOrigemDestino(p) }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Ponto de destino<span>*</span></label>
          <select v-model="form.destination_id" required :disabled="salvando">
            <option value="" disabled>Selecione uma garagem ou destino...</option>
            <option v-for="p in pontosOrigemDestino" :key="p.id" :value="p.id">
              {{ labelPontoOrigemDestino(p) }}
            </option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Dias da semana<span>*</span></label>
        <div class="chip-row">
          <button
            v-for="w in WEEKDAY_OPTIONS"
            :key="w.bit"
            type="button"
            :class="['chip', { active: (form.weekdays & w.bit) !== 0 }]"
            :disabled="salvando"
            @click="toggleWeekday(w.bit)"
          >
            {{ w.label }}
          </button>
        </div>
      </div>

      <div v-if="!isShared" class="field">
        <label>Paradas habituais na ordem configurada</label>
        <div class="inline-row">
          <select v-model="paradaParaAdicionar" :disabled="salvando">
            <option value="">Adicionar ponto operacional...</option>
            <option v-for="p in store.pontosOperacionais" :key="p.id" :value="p.id">
              {{ p.name }} — {{ p.city }}/{{ p.state }}
            </option>
          </select>
          <BaseButton variant="outline" size="sm" :disabled="salvando" @click="adicionarParada">
            Adicionar parada
          </BaseButton>
        </div>
        <div v-if="paradasSelecionadas.length" class="chip-row">
          <span v-for="(pid, idx) in paradasSelecionadas" :key="pid" class="chip active">
            {{ idx + 1 }}. {{ nomePonto(pid) }}
            <button type="button" class="chip-x" :disabled="salvando" @click="removerParada(pid)">×</button>
          </span>
        </div>
      </div>

      <StatusBanner variant="danger" :message="erro" />
      <StatusBanner variant="success" :message="aviso" />

      <div class="inline-row">
        <BaseButton type="submit" size="sm" :loading="salvando">
          {{
            salvando
              ? 'Salvando...'
              : editandoId
                ? 'Atualizar serviço'
                : isShared
                  ? 'Criar serviço compartilhado'
                  : 'Criar serviço habitual'
          }}
        </BaseButton>
        <BaseButton v-if="editandoId" variant="outline" size="sm" :disabled="salvando" @click="cancelarEdicao">
          Cancelar edição
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<style lang="scss" scoped>
.item-list,
.service-form {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.service-form {
  padding-top: $space-3;
  border-top: 1px solid var(--border);
}

.sub-heading {
  font-size: $text-base;
  font-weight: $font-bold;
}

.sub-card {
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-1;

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-2;
  }
}

.badge-dir {
  display: inline-block;
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: $text-xs;
  font-weight: $font-bold;
  margin-left: 4px;
}

.sub-meta,
.empty-msg,
.field-explain {
  font-size: $text-xs;
  color: var(--text-muted);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: $space-3;
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  label {
    font-size: $text-sm;
    font-weight: $font-semibold;
    color: var(--primary);

    span {
      margin-left: 2px;
    }
  }

  input,
  select {
    padding: 10px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.chip-row,
.inline-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  select {
    flex: 1 1 220px;
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  background: var(--color-surface);
  color: var(--text);
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  font-size: $text-xs;
  font-weight: $font-semibold;

  &.active {
    background: var(--primary);
    color: var(--color-on-primary);
    outline-color: var(--primary);
  }
}

.chip-x {
  color: inherit;
  font-weight: $font-bold;
  padding: 0 2px;
}
</style>
