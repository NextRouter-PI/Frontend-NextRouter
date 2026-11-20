<script setup>
import { computed, ref, shallowRef } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import MemberServicesAuthorizationPanel from './MemberServicesAuthorizationPanel.vue'

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

const passageirosAtivos = computed(() => store.vinculosAtivos.filter((m) => m.passenger != null))
const outrosGrupos = computed(() => store.grupos.filter((g) => g.id !== props.groupId))

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

function handleAuthorizationSaved() {
  autorizacaoSelecionada.value = null
  emit('updated')
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
          <BaseButton variant="outline" size="sm" @click="autorizacaoSelecionada = m.id">
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

        <MemberServicesAuthorizationPanel
          v-if="autorizacaoSelecionada === m.id"
          :member="m"
          :services="grupo.services"
          @saved="handleAuthorizationSaved"
          @close="autorizacaoSelecionada = null"
        />
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

.sub-meta {
  font-size: $text-xs;
  color: var(--text-muted);
}

.inline-row {
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
</style>
