<script setup>
import { ref, shallowRef, watch } from 'vue'
import { formatDateTimeBr } from '@/utils/formatters'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const props = defineProps({
  groupId: { type: Number, required: true },
  status: { type: Object, default: null },
})

const emit = defineEmits(['updated'])

const store = useRotasStore()
const scope = useAccountScope()

const salvando = shallowRef(false)
const erro = shallowRef('')
const aviso = shallowRef('')
const form = ref({
  enabled: false,
  horizon_days: '',
  batch_size: '',
  interval_seconds: '',
  next_run_at: '',
})

watch(
  () => props.status,
  (auto) => {
    if (!auto) return
    form.value = {
      enabled: Boolean(auto.enabled),
      horizon_days: String(auto.horizon_days ?? ''),
      batch_size: String(auto.batch_size ?? ''),
      interval_seconds: String(auto.interval_seconds ?? ''),
      next_run_at: auto.next_run_at ? new Date(auto.next_run_at).toISOString().slice(0, 16) : '',
    }
  },
  { immediate: true },
)

async function salvar() {
  if (!scope.current() || salvando.value) return
  erro.value = ''
  aviso.value = ''

  if (
    !form.value.horizon_days ||
    !form.value.batch_size ||
    !form.value.interval_seconds ||
    !form.value.next_run_at
  ) {
    erro.value =
      'Preencha explicitamente horizonte (1–31), lote, intervalo em segundos e próxima execução.'
    return
  }

  salvando.value = true
  const res = await store.salvarAgendaAutomatica(
    props.groupId,
    {
      enabled: form.value.enabled,
      horizon_days: Number(form.value.horizon_days),
      batch_size: Number(form.value.batch_size),
      interval_seconds: Number(form.value.interval_seconds),
      next_run_at: new Date(form.value.next_run_at).toISOString(),
      expected_revision: props.status?.revision ?? 0,
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvando.value = false
  if (res) {
    aviso.value = 'Agenda automática configurada.'
    emit('updated')
  } else {
    erro.value = store.error || 'Não foi possível configurar a agenda automática.'
  }
}
</script>

<template>
  <BaseCard
    title="5. Agenda Automática Opt-in"
    subtitle="Configura a geração automática pelo worker (exige política de respostas cadastrada). Configurar ou consultar não inicia o worker nem publica viagens automaticamente."
  >
    <div v-if="status" class="status-box">
      <p>
        Estado: <strong>{{ status.enabled ? 'Habilitada' : 'Desabilitada' }}</strong> · Revisão:
        {{ status.revision }} · Cursor: {{ status.cursor_date || '—' }} · Fim do ciclo:
        {{ status.cycle_end_date || '—' }}
      </p>
      <p>
        Última tentativa: {{ status.last_attempted_at ? formatDateTimeBr(status.last_attempted_at) : '—' }}
        · Última conclusão:
        {{ status.last_completed_at ? formatDateTimeBr(status.last_completed_at) : '—' }} · Código de
        erro: {{ status.last_error_code || 'nenhum' }}
      </p>
    </div>
    <p v-else class="sub-meta">Agenda automática ainda não configurada para este grupo.</p>

    <form class="editor-form" @submit.prevent="salvar">
      <div class="grid-2">
        <label class="checkbox-field">
          <input v-model="form.enabled" type="checkbox" :disabled="salvando" />
          Habilitar geração automática
        </label>
        <div class="field">
          <label>Horizonte em dias (1 a 31)<span>*</span></label>
          <input v-model="form.horizon_days" type="number" min="1" max="31" required :disabled="salvando" />
        </div>
        <div class="field">
          <label>Tamanho do lote (1 até horizonte)<span>*</span></label>
          <input v-model="form.batch_size" type="number" min="1" max="31" required :disabled="salvando" />
        </div>
        <div class="field">
          <label>Intervalo em segundos<span>*</span></label>
          <input v-model="form.interval_seconds" type="number" min="1" required :disabled="salvando" />
        </div>
        <div class="field">
          <label>Próxima execução<span>*</span></label>
          <input v-model="form.next_run_at" type="datetime-local" required :disabled="salvando" />
        </div>
      </div>

      <StatusBanner variant="danger" :message="erro" />
      <StatusBanner variant="success" :message="aviso" />

      <div>
        <BaseButton type="submit" size="sm" :loading="salvando">
          {{ salvando ? 'Salvando...' : 'Salvar agenda automática' }}
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<style lang="scss" scoped>
.status-box {
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  font-size: $text-xs;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: $space-1;

  strong {
    color: var(--text);
  }
}

.sub-meta {
  font-size: $text-xs;
  color: var(--text-muted);
}

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

.checkbox-field {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: var(--text);
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
    font-size: $text-sm;

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}
</style>
