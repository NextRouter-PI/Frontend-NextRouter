<script setup>
import { computed, ref, shallowRef, watch } from 'vue'
import { SERVICE_DIRECTIONS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const props = defineProps({
  member: { type: Object, required: true },
  services: { type: Array, required: true },
})

const emit = defineEmits(['saved', 'close'])

const store = useRotasStore()
const scope = useAccountScope()

const servicosDraft = ref([])
const idaHabitualDraft = shallowRef('')
const salvando = shallowRef(false)
const erro = shallowRef('')

watch(
  () => props.member,
  (m) => {
    erro.value = ''
    servicosDraft.value = Array.isArray(m?.service_ids) ? [...m.service_ids] : []
    idaHabitualDraft.value = m?.habitual_outbound_id ?? ''
  },
  { immediate: true },
)

const outboundAutorizadas = computed(() =>
  props.services.filter(
    (srv) => srv.direction === SERVICE_DIRECTIONS.OUTBOUND && servicosDraft.value.includes(srv.id),
  ),
)

function toggleServico(serviceId) {
  if (servicosDraft.value.includes(serviceId)) {
    servicosDraft.value = servicosDraft.value.filter((s) => s !== serviceId)
    if (Number(idaHabitualDraft.value) === serviceId) idaHabitualDraft.value = ''
  } else {
    servicosDraft.value.push(serviceId)
  }
}

async function salvar() {
  if (!scope.current() || salvando.value) return
  erro.value = ''
  salvando.value = true
  const res = await store.autorizarServicosPassageiro(
    props.member.id,
    {
      serviceIds: servicosDraft.value,
      habitualOutboundId: idaHabitualDraft.value || null,
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvando.value = false
  if (res) {
    emit('saved')
  } else {
    erro.value = store.error || 'Não foi possível salvar os serviços autorizados.'
  }
}
</script>

<template>
  <div class="auth-panel">
    <h4>Serviços autorizados para {{ member.applicantName }}</h4>

    <div class="chip-row">
      <button
        v-for="s in services"
        :key="s.id"
        type="button"
        :class="['chip', { active: servicosDraft.includes(s.id) }]"
        :disabled="salvando"
        @click="toggleServico(s.id)"
      >
        {{ s.name }} ({{ s.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }}
        {{ s.targetTimeLabel }} · {{ s.is_shared ? 'Compartilhado' : 'Habitual' }})
      </button>
    </div>

    <div class="field">
      <label>Ida habitual (deve ser uma ida autorizada)</label>
      <select v-model="idaHabitualDraft" :disabled="salvando">
        <option value="">Sem ida habitual</option>
        <option v-for="s in outboundAutorizadas" :key="s.id" :value="s.id">
          {{ s.name }} ({{ s.targetTimeLabel }})
        </option>
      </select>
    </div>

    <StatusBanner variant="danger" :message="erro" />

    <div class="inline-row">
      <BaseButton size="sm" :loading="salvando" @click="salvar">
        {{ salvando ? 'Salvando...' : 'Salvar autorizações' }}
      </BaseButton>
      <BaseButton variant="outline" size="sm" :disabled="salvando" @click="emit('close')">
        Fechar
      </BaseButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-panel {
  margin-top: $space-2;
  padding-top: $space-3;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.chip-row,
.inline-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
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
