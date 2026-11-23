<script setup>
import { ref, shallowRef, watch } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const props = defineProps({
  groupId: { type: Number, required: true },
  policy: { type: Object, default: null },
})

const emit = defineEmits(['updated'])

const store = useRotasStore()
const scope = useAccountScope()

const salvando = shallowRef(false)
const erro = shallowRef('')
const aviso = shallowRef('')
const form = ref({
  opens_days_before: '',
  opens_time: '',
  normal_days_before: '',
  normal_time: '',
  extension_days_before: '',
  extension_time: '',
})

watch(
  () => props.policy,
  (p) => {
    if (!p) return
    form.value = {
      opens_days_before: String(p.opens_days_before ?? ''),
      opens_time: String(p.opens_time || '').slice(0, 5),
      normal_days_before: String(p.normal_days_before ?? ''),
      normal_time: String(p.normal_time || '').slice(0, 5),
      extension_days_before: p.extension_days_before != null ? String(p.extension_days_before) : '',
      extension_time: p.extension_time ? String(p.extension_time).slice(0, 5) : '',
    }
  },
  { immediate: true },
)

async function salvar() {
  if (!scope.current() || salvando.value) return
  erro.value = ''
  aviso.value = ''

  if (
    form.value.opens_days_before === '' ||
    !form.value.opens_time ||
    form.value.normal_days_before === '' ||
    !form.value.normal_time
  ) {
    erro.value = 'Preencha explicitamente a abertura e o encerramento da janela normal.'
    return
  }

  salvando.value = true
  const ok = await store.salvarPolitica(props.groupId, form.value, { signal: scope.signal })
  if (!scope.current()) return
  salvando.value = false
  if (ok) {
    aviso.value = 'Política de respostas salva. Vale para novos atendimentos gerados.'
    emit('updated')
  } else {
    erro.value = store.error || 'Erro ao salvar política de respostas.'
  }
}
</script>

<template>
  <BaseCard
    title="2. Política de Respostas (Janela Normal e Prorrogação)"
    subtitle="Informe os dias de antecedência e horários explícitos (sem valores padrão universais). A prorrogação é opcional, mas exige ambos os campos se habilitada."
  >
    <form class="editor-form" @submit.prevent="salvar">
      <div class="grid-2">
        <div class="field">
          <label>Abertura: dias antes<span>*</span></label>
          <input v-model="form.opens_days_before" type="number" min="0" required :disabled="salvando" />
        </div>
        <div class="field">
          <label>Abertura: horário<span>*</span></label>
          <input v-model="form.opens_time" type="time" required :disabled="salvando" />
        </div>
        <div class="field">
          <label>Prazo normal: dias antes<span>*</span></label>
          <input v-model="form.normal_days_before" type="number" min="0" required :disabled="salvando" />
        </div>
        <div class="field">
          <label>Prazo normal: horário<span>*</span></label>
          <input v-model="form.normal_time" type="time" required :disabled="salvando" />
        </div>
        <div class="field">
          <label>Prorrogação (opcional): dias antes</label>
          <input v-model="form.extension_days_before" type="number" min="0" :disabled="salvando" />
        </div>
        <div class="field">
          <label>Prorrogação (opcional): horário</label>
          <input v-model="form.extension_time" type="time" :disabled="salvando" />
        </div>
      </div>

      <StatusBanner variant="danger" :message="erro" />
      <StatusBanner variant="success" :message="aviso" />

      <div class="form-actions">
        <BaseButton type="submit" size="sm" :loading="salvando">
          {{ salvando ? 'Salvando...' : 'Salvar política de respostas' }}
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<style lang="scss" scoped>
.editor-form {
  display: flex;
  flex-direction: column;
  gap: $space-3;
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

  input {
    padding: 10px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-md;

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
