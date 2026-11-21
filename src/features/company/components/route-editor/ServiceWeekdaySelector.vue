<script setup>
import { WEEKDAY_OPTIONS } from '@/constants'

defineProps({
  disabled: { type: Boolean, default: false },
})

const weekdays = defineModel({ type: Number, default: 0 })

function toggleWeekday(bit) {
  weekdays.value ^= bit
}
</script>

<template>
  <div class="field">
    <label>Dias da semana<span>*</span></label>
    <div class="chip-row">
      <button
        v-for="w in WEEKDAY_OPTIONS"
        :key="w.bit"
        type="button"
        :class="['chip', { active: (weekdays & w.bit) !== 0 }]"
        :disabled="disabled"
        @click="toggleWeekday(w.bit)"
      >
        {{ w.label }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
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
</style>
