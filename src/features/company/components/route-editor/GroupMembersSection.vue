<script setup>
import { computed, ref, shallowRef } from 'vue'
import { SERVICE_DIRECTIONS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const props = defineProps({
  groupId: { type: Number, required: true },
  grupo: { type: Object, required: true },
})

const emit = defineEmits(['updated'])

const store = useRotasStore()
const scope = useAccountScope()

const atribuicaoMembershipId = shallowRef('')
const destinoTrocaGrupo = ref({})
const salvandoAtribuicao = shallowRef(false)
const erroAtribuicao = shallowRef('')

const autorizacaoSelecionada = shallowRef(null)
const servicosAutorizadosDraft = ref([])
const idaHabitualDraft = shallowRef('')
const salvandoAutorizacao = shallowRef(false)
const erroAutorizacao = shallowRef('')

const passageirosAtivos = computed(() => store.vinculosAtivos.filter((m) => m.passenger != null))
const outrosGrupos = computed(() => store.grupos.filter((g) => g.id !== props.groupId))
const outboundAutorizadas = computed(() =>
  (props.grupo.services || []).filter(
    (srv) =>
      srv.direction === SERVICE_DIRECTIONS.OUTBOUND && servicosAutorizadosDraft.value.includes(srv.id),
  ),
)

async function atribuirPassageiro() {
  if (!scope.current() || salvandoAtribuicao.value || !atribuicaoMembershipId.value) return
  erroAtribuicao.value = ''
  salvandoAtribuicao.value = true
  const res = await store.atribuirPassageiroGrupo(
    Number(atribuicaoMembershipId.value),
    { routeGroupId: props.groupId, transportPointId: null },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvandoAtribuicao.value = false
  if (res) {
    atribuicaoMembershipId.value = ''
    emit('updated')
  } else {
    erroAtribuicao.value = store.error || 'Não foi possível adicionar o passageiro ao grupo.'
  }
}

async function moverPassageiro(member) {
  const targetGroupId = Number(destinoTrocaGrupo.value[member.membership])
  if (!scope.current() || salvandoAtribuicao.value || !targetGroupId || targetGroupId === props.groupId) return
  erroAtribuicao.value = ''
  salvandoAtribuicao.value = true
  const res = await store.atribuirPassageiroGrupo(
    Number(member.membership),
    { routeGroupId: targetGroupId, transportPointId: null },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvandoAtribuicao.value = false
  if (res) {
    delete destinoTrocaGrupo.value[member.membership]
    emit('updated')
  } else {
    erroAtribuicao.value = store.error || 'Não foi possível trocar o passageiro de grupo.'
  }
}

function abrirAutorizacao(member) {
  autorizacaoSelecionada.value = member.id
  erroAutorizacao.value = ''
  servicosAutorizadosDraft.value = Array.isArray(member.service_ids) ? [...member.service_ids] : []
  idaHabitualDraft.value = member.habitual_outbound_id ?? ''
}

function toggleServicoAutorizado(serviceId) {
  if (servicosAutorizadosDraft.value.includes(serviceId)) {
    servicosAutorizadosDraft.value = servicosAutorizadosDraft.value.filter((s) => s !== serviceId)
    if (Number(idaHabitualDraft.value) === serviceId) idaHabitualDraft.value = ''
  } else {
    servicosAutorizadosDraft.value.push(serviceId)
  }
}

async function salvarAutorizacao() {
  if (!scope.current() || salvandoAutorizacao.value || !autorizacaoSelecionada.value) return
  erroAutorizacao.value = ''
  salvandoAutorizacao.value = true
  const res = await store.autorizarServicosPassageiro(
    autorizacaoSelecionada.value,
    {
      serviceIds: servicosAutorizadosDraft.value,
      habitualOutboundId: idaHabitualDraft.value || null,
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvandoAutorizacao.value = false
  if (res) {
    autorizacaoSelecionada.value = null
    emit('updated')
  } else {
    erroAutorizacao.value = store.error || 'Não foi possível salvar os serviços autorizados.'
  }
}
</script>

<template>
  <BaseCard
    title="4. Passageiros do Grupo"
    subtitle="Passageiros aprovados a partir deste grupo entram aqui automaticamente. Você também pode adicionar um passageiro vinculado ou transferi-lo para outro grupo."
  >
    <form class="inline-row" @submit.prevent="atribuirPassageiro">
      <select v-model="atribuicaoMembershipId" required :disabled="salvandoAtribuicao">
        <option value="">Selecionar passageiro vinculado para adicionar ao grupo...</option>
        <option v-for="m in passageirosAtivos" :key="m.id" :value="m.id">
          {{ m.applicant_name }} (vínculo #{{ m.id }})
        </option>
      </select>
      <BaseButton type="submit" size="sm" :loading="salvandoAtribuicao">
        {{ salvandoAtribuicao ? 'Salvando...' : 'Adicionar ao grupo' }}
      </BaseButton>
    </form>

    <StatusBanner variant="danger" :message="erroAtribuicao" />

    <div v-if="grupo.members.length" class="item-list">
      <div v-for="m in grupo.members" :key="m.id" class="sub-card">
        <div class="sub-card-header">
          <div><strong>{{ m.applicantName }}</strong> · Participação #{{ m.id }}</div>
          <BaseButton variant="outline" size="sm" @click="abrirAutorizacao(m)">
            Configurar serviços autorizados
          </BaseButton>
        </div>

        <p class="sub-meta">
          Serviços autorizados: {{ m.service_ids?.length || 0 }} · Ida habitual:
          {{ m.habitual_outbound_id ? `#${m.habitual_outbound_id}` : 'Não definida' }}
        </p>

        <div v-if="outrosGrupos.length" class="inline-row">
          <select
            v-model="destinoTrocaGrupo[m.membership]"
            :disabled="salvandoAtribuicao"
            aria-label="Trocar passageiro de grupo"
          >
            <option value="">Trocar para outro grupo...</option>
            <option v-for="g in outrosGrupos" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="salvandoAtribuicao || !destinoTrocaGrupo[m.membership]"
            @click="moverPassageiro(m)"
          >
            Mover de grupo
          </BaseButton>
        </div>

        <div v-if="autorizacaoSelecionada === m.id" class="auth-panel">
          <h4>Serviços autorizados para {{ m.applicantName }}</h4>
          <div class="chip-row">
            <button
              v-for="s in grupo.services"
              :key="s.id"
              type="button"
              :class="['chip', { active: servicosAutorizadosDraft.includes(s.id) }]"
              :disabled="salvandoAutorizacao"
              @click="toggleServicoAutorizado(s.id)"
            >
              {{ s.name }} ({{ s.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }}
              {{ s.targetTimeLabel }} · {{ s.is_shared ? 'Compartilhado' : 'Habitual' }})
            </button>
          </div>

          <div class="field">
            <label>Ida habitual (deve ser uma ida autorizada)</label>
            <select v-model="idaHabitualDraft" :disabled="salvandoAutorizacao">
              <option value="">Sem ida habitual</option>
              <option v-for="s in outboundAutorizadas" :key="s.id" :value="s.id">
                {{ s.name }} ({{ s.targetTimeLabel }})
              </option>
            </select>
          </div>

          <StatusBanner variant="danger" :message="erroAutorizacao" />

          <div class="inline-row">
            <BaseButton size="sm" :loading="salvandoAutorizacao" @click="salvarAutorizacao">
              {{ salvandoAutorizacao ? 'Salvando...' : 'Salvar autorizações' }}
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="salvandoAutorizacao"
              @click="autorizacaoSelecionada = null"
            >
              Fechar
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="sub-meta">Nenhum passageiro atribuído a este grupo.</p>
  </BaseCard>
</template>

<style lang="scss" scoped>
.item-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.sub-card {
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-2;

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-2;
  }
}

.auth-panel {
  margin-top: $space-2;
  padding-top: $space-3;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.sub-meta {
  font-size: $text-xs;
  color: var(--text-muted);
}

.inline-row,
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  select {
    flex: 1 1 220px;
    padding: 9px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  label {
    font-size: $text-sm;
    font-weight: $font-semibold;
    color: var(--primary);
  }

  select {
    padding: 9px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
  }
}

.chip {
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
</style>
