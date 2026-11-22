<script setup>
import { WINDOW_SHORT_LABELS } from '@/constants'
import { formatDateChip } from '@/utils/formatters'

defineProps({
  eligibilities: { type: Array, required: true },
  selectedId: { type: [Number, String], default: null },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])
</script>

<template>
  <div class="day-selector" role="tablist" aria-label="Datas de atendimento">
    <button
      v-for="item in eligibilities"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="item.id === selectedId"
      :class="['day-chip', { active: item.id === selectedId }]"
      :disabled="disabled"
      @click="emit('select', item.id)"
    >
      {{ formatDateChip(item.dayData.date) }} ·
      {{ WINDOW_SHORT_LABELS[item.dayData.window] || item.dayData.window }}
      <span v-if="item.response?.answered_at"> · ✓ Respondido</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.day-selector {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-4;
}

.day-chip {
  padding: $space-2 $space-3;
  border-radius: $radius-pill;
  background: var(--color-surface);
  color: var(--text);
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  font-size: $text-sm;
  font-weight: $font-semibold;
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    outline-color $duration-normal $ease-fluid;

  &:hover:not(:disabled) {
    outline-color: var(--primary);
    color: var(--primary);
  }

  &.active {
    background: var(--primary);
    color: var(--color-on-primary);
    outline-color: var(--primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
