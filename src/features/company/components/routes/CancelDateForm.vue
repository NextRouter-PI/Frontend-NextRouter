<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  grupos: { type: Array, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['cancel-date'])
const cancelarDataForm = ref({ groupId: '', date: '', reason: '' })

function submit() {
  emit('cancel-date', {
    ...cancelarDataForm.value,
    onSuccess: () => {
      cancelarDataForm.value = { groupId: '', date: '', reason: '' }
    },
  })
}
</script>

<template>
  <form class="op-section op-section-divider" @submit.prevent="submit">
    <p class="op-section-title">Cancelar data específica</p>
    <div class="op-cancel-grid">
      <label class="op-field">
        <span class="op-label">Grupo</span>
        <select v-model="cancelarDataForm.groupId" required :disabled="busy">
          <option value="">Selecione o grupo...</option>
          <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </label>
      <label class="op-field">
        <span class="op-label">Data a cancelar</span>
        <input
          v-model="cancelarDataForm.date"
          type="date"
          required
          :disabled="busy"
          aria-label="Data a cancelar"
        />
      </label>
      <label class="op-field op-field-wide">
        <span class="op-label">Motivo do cancelamento</span>
        <input
          v-model="cancelarDataForm.reason"
          placeholder="Informe o motivo (até 500 caracteres)"
          maxlength="500"
          required
          :disabled="busy"
        />
      </label>
    </div>
    <div class="op-actions">
      <BaseButton type="submit" variant="outline" size="sm" :disabled="busy">
        Cancelar data
      </BaseButton>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.op-section {
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &-divider {
    padding-top: $space-4;
    border-top: 1px solid var(--border);
  }

  &-title {
    font-size: $text-sm;
    font-weight: $font-bold;
    color: var(--text);
  }
}

.op-cancel-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;

  @include from($bp-sm) {
    grid-template-columns: minmax(180px, 1.1fr) minmax(150px, 0.9fr) minmax(220px, 1.8fr);
  }
}

.op-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  input,
  select {
    width: 100%;
    padding: 10px $space-3;
    border-radius: $radius-md;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
    transition: outline-color $duration-normal $ease-fluid;

    &:focus,
    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.op-label {
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--primary);
}

.op-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: $space-1;
}
</style>
