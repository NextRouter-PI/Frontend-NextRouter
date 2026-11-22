<script setup>
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  grupos: { type: Array, required: true },
  totalDays: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
})

const groupId = defineModel('groupId', { type: [String, Number], default: '' })
const date = defineModel('date', { type: String, default: '' })
const statusFilter = defineModel('statusFilter', { type: String, default: 'em_andamento' })

const emit = defineEmits(['refresh'])
</script>

<template>
  <BaseCard title="Filtrar Atendimentos por Data">
    <div class="filter-panel">
      <div class="filter-controls">
        <label class="filter-field">
          <span class="filter-label">Grupo</span>
          <select v-model="groupId" :disabled="disabled">
            <option value="">Todos os grupos</option>
            <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </label>
        <label class="filter-field">
          <span class="filter-label">Data</span>
          <input v-model="date" type="date" :disabled="disabled" />
        </label>
        <div class="filter-action">
          <BaseButton size="sm" :disabled="disabled" @click="emit('refresh')">
            Atualizar consulta
          </BaseButton>
        </div>
      </div>

      <div class="filter-chips" role="tablist" aria-label="Filtrar atendimentos por situação">
        <button
          v-for="opt in [
            { id: 'em_andamento', label: 'Em andamento' },
            { id: 'encerradas', label: 'Encerradas' },
            { id: 'canceladas', label: 'Canceladas' },
            { id: 'todas', label: `Todas (${totalDays})` },
          ]"
          :key="opt.id"
          type="button"
          role="tab"
          :aria-selected="statusFilter === opt.id"
          :class="['filter-chip', { active: statusFilter === opt.id }]"
          @click="statusFilter = opt.id"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </BaseCard>
</template>

<style lang="scss" scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.filter-controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
  align-items: end;

  @include from($bp-sm) {
    grid-template-columns: minmax(200px, 1.4fr) minmax(170px, 1fr) auto;
  }
}

.filter-field {
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

.filter-label {
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--primary);
}

.filter-action {
  display: flex;
  justify-content: flex-end;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  padding-top: $space-3;
  border-top: 1px solid var(--border);
}

.filter-chip {
  @include filter-chip;
}
</style>
