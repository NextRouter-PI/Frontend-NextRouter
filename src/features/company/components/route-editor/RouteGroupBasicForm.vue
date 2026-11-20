<script setup>
import { ref, shallowRef, watch } from 'vue'
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

const salvando = shallowRef(false)
const erro = shallowRef('')
const aviso = shallowRef('')
const form = ref({ name: '', destinationId: '' })

watch(
  () => props.grupo,
  (g) => {
    if (!g) return
    form.value = { name: g.name, destinationId: g.destinationId }
  },
  { immediate: true },
)

async function salvar() {
  if (!scope.current() || salvando.value) return
  erro.value = ''
  aviso.value = ''
  salvando.value = true
  const atualizado = await store.atualizarGrupo(
    props.groupId,
    { name: form.value.name, destinationId: Number(form.value.destinationId) },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvando.value = false
  if (atualizado) {
    aviso.value = 'Grupo de atendimento atualizado.'
    emit('updated')
  } else {
    erro.value = store.error || 'Erro ao atualizar grupo.'
  }
}
</script>

<template>
  <BaseCard title="1. Nome e Ponto de Destino">
    <form class="editor-form" @submit.prevent="salvar">
      <div class="grid-2">
        <div class="field">
          <label>Nome do Grupo<span>*</span></label>
          <input v-model="form.name" required :disabled="salvando" />
        </div>
        <div class="field">
          <label>Ponto Operacional de Destino<span>*</span></label>
          <select v-model="form.destinationId" required :disabled="salvando">
            <option v-for="ponto in store.pontosDestino" :key="ponto.id" :value="ponto.id">
              {{ ponto.name }} — {{ ponto.city }}/{{ ponto.state }}
            </option>
          </select>
        </div>
      </div>

      <StatusBanner variant="danger" :message="erro" />
      <StatusBanner variant="success" :message="aviso" />

      <div class="form-actions">
        <BaseButton type="submit" size="sm" :loading="salvando">
          {{ salvando ? 'Salvando...' : 'Salvar grupo' }}
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

  input,
  select {
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
