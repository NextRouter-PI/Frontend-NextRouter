<script setup>
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

defineProps({
  months: { type: Array, required: true },
  years: { type: Array, required: true },
  cells: { type: Array, required: true },
})

const viewMonth = defineModel('viewMonth', { type: Number, required: true })
const viewYear = defineModel('viewYear', { type: Number, required: true })

const emit = defineEmits(['prev-month', 'next-month', 'select-day'])
</script>

<template>
  <div class="date-popover" role="dialog" aria-label="Selecionar data de nascimento">
    <div class="popover-header">
      <button type="button" class="nav-arrow-btn" aria-label="Mês anterior" @click="emit('prev-month')">
        <span class="mdi mdi-chevron-left" aria-hidden="true"></span>
      </button>

      <div class="popover-selects">
        <select v-model.number="viewMonth" class="popover-select" aria-label="Mês">
          <option v-for="(m, idx) in months" :key="m.value" :value="idx">
            {{ m.label }}
          </option>
        </select>
        <select v-model.number="viewYear" class="popover-select year" aria-label="Ano">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>

      <button type="button" class="nav-arrow-btn" aria-label="Próximo mês" @click="emit('next-month')">
        <span class="mdi mdi-chevron-right" aria-hidden="true"></span>
      </button>
    </div>

    <div class="weekday-row" aria-hidden="true">
      <span v-for="w in WEEKDAYS" :key="w" class="weekday-cell">{{ w }}</span>
    </div>

    <div class="days-grid">
      <template v-for="cell in cells" :key="cell.key">
        <span v-if="cell.empty" class="day-empty"></span>
        <button
          v-else
          type="button"
          class="day-cell"
          :class="{ selected: cell.isSelected, today: cell.isToday }"
          :disabled="cell.isFuture"
          @click="emit('select-day', cell)"
        >
          {{ cell.day }}
        </button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.date-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: $z-modal;
  width: min(312px, 100%);
  padding: $space-3;
  border-radius: $radius-lg;
  background: var(--color-surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow), 0 12px 32px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-1;
}

.popover-selects {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.popover-select {
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  border-radius: $radius-sm;
  background: var(--altbg);
  color: var(--text);
  font-size: $text-xs;
  font-weight: $font-semibold;
  cursor: pointer;
  outline: 1px solid var(--border);
  outline-offset: -1px;

  &.year {
    flex: 0 0 74px;
  }

  &:focus {
    outline: 1.5px solid var(--primary);
  }
}

.nav-arrow-btn {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  aspect-ratio: 1;
  border-radius: $radius-round;
  @include flex-center;
  color: var(--text-muted);
  font-size: 1.2rem;
  transition:
    background-color $duration-fast $ease-fluid,
    color $duration-fast $ease-fluid;

  &:hover {
    background: var(--color-primary-soft);
    color: var(--primary);
  }
}

.weekday-row,
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;
}

.weekday-cell {
  text-align: center;
  font-size: 0.7rem;
  font-weight: $font-semibold;
  color: var(--text-muted);
  padding: 4px 0;
}

.day-cell {
  aspect-ratio: 1;
  border-radius: $radius-round;
  @include flex-center;
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--text);
  transition:
    background-color $duration-fast $ease-fluid,
    color $duration-fast $ease-fluid,
    transform $duration-fast $ease-fluid;

  &:hover:not(:disabled) {
    background: var(--color-primary-soft);
    color: var(--primary);
  }

  &.today:not(.selected) {
    outline: 1px solid var(--primary);
    outline-offset: -1px;
    color: var(--primary);
  }

  &.selected {
    background: var(--primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-primary);
  }

  &:disabled {
    opacity: 0.28;
    cursor: not-allowed;
  }
}
</style>
