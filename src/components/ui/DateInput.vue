<script setup>
import { computed, useId, useTemplateRef } from 'vue'
import { useDateCalendar } from './date/useDateCalendar'
import DateCalendarPopover from './date/DateCalendarPopover.vue'

const props = defineProps({
  days: { type: Array, default: () => [] },
  months: { type: Array, required: true },
  years: { type: Array, required: true },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  dayError: { type: String, default: '' },
  monthError: { type: String, default: '' },
  yearError: { type: String, default: '' },
})

const day = defineModel('day', { type: [String, Number], required: true })
const month = defineModel('month', { type: [String, Number], required: true })
const year = defineModel('year', { type: [String, Number], required: true })

const fieldId = useId()
const wrapperRef = useTemplateRef('wrapperRef')
const combinedError = computed(() => props.dayError || props.monthError || props.yearError || '')

const {
  pickerOpen,
  textValue,
  viewMonth,
  viewYear,
  calendarCells,
  applyDigits,
  togglePicker,
  prevMonth,
  nextMonth,
  selectDay,
  clearDate,
} = useDateCalendar({
  day,
  month,
  year,
  months: () => props.months,
  disabled: () => props.disabled,
  wrapperRef,
})

function handleTextInput(event) {
  const raw = String(event.target.value || '')
  // Suporta colar datas ISO (AAAA-MM-DD)
  const isoMatch = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  applyDigits(isoMatch ? `${isoMatch[3]}${isoMatch[2]}${isoMatch[1]}` : raw)
  event.target.value = textValue.value
}
</script>

<template>
  <div ref="wrapperRef" class="date-field" :class="{ 'has-error': Boolean(combinedError) }">
    <label :for="fieldId" class="date-field-label">
      Data de nascimento<span v-if="required" class="date-field-required" aria-hidden="true">*</span>
    </label>

    <div class="date-field-control">
      <input
        :id="fieldId"
        :value="textValue"
        type="text"
        inputmode="numeric"
        autocomplete="bday"
        placeholder="DD/MM/AAAA"
        maxlength="10"
        :required="required"
        :disabled="disabled"
        :aria-invalid="combinedError ? true : undefined"
        :aria-describedby="combinedError ? `${fieldId}-error` : undefined"
        class="date-field-input"
        @input="handleTextInput"
      />

      <div class="date-field-actions">
        <button
          v-if="textValue && !disabled"
          type="button"
          class="date-icon-btn"
          aria-label="Limpar data"
          @click="clearDate"
        >
          <BaseIcon name="mdi-close" />
        </button>
        <button
          type="button"
          class="date-icon-btn"
          :class="{ active: pickerOpen }"
          :disabled="disabled"
          aria-label="Abrir calendário"
          :aria-expanded="pickerOpen"
          @click="togglePicker"
        >
          <BaseIcon name="mdi-calendar-month-outline" />
        </button>
      </div>
    </div>

    <Transition name="fade-slide">
      <DateCalendarPopover
        v-if="pickerOpen"
        v-model:view-month="viewMonth"
        v-model:view-year="viewYear"
        :months="months"
        :years="years"
        :cells="calendarCells"
        @prev-month="prevMonth"
        @next-month="nextMonth"
        @select-day="selectDay"
      />
    </Transition>

    <div class="date-field-feedback">
      <Transition name="fade-slide">
        <p v-if="combinedError" :id="`${fieldId}-error`" class="date-field-error" role="alert">
          {{ combinedError }}
        </p>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.date-field {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: $space-2;

  &-label {
    display: block;
    color: var(--primary);
    font-weight: $font-semibold;
    font-size: $text-sm;
    margin-bottom: 6px;
  }

  &-required {
    color: var(--primary);
    margin-left: 2px;
  }

  &-control {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  &-input {
    width: 100%;
    padding: 11px 76px 11px 14px;
    border-radius: $radius-md;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: 0.92rem;
    letter-spacing: 0.03em;
    transition:
      outline-color $duration-normal $ease-fluid,
      background-color $duration-normal $ease-fluid;

    &::placeholder {
      color: var(--text-muted);
      letter-spacing: 0.02em;
    }

    &:focus,
    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }

    &:disabled {
      background: var(--input-surface);
      color: var(--text-muted);
      cursor: not-allowed;
      opacity: 0.65;
    }
  }

  &.has-error .date-field-input {
    outline-color: var(--danger);
  }

  &-actions {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  &-feedback {
    min-height: 20px;
    margin-top: $space-1;
    display: flex;
    align-items: flex-start;
  }

  &-error {
    color: var(--danger);
    font-size: 0.78rem;
    line-height: 1.35;
  }
}

.date-icon-btn {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  aspect-ratio: 1;
  border-radius: $radius-round;
  @include flex-center;
  color: var(--text-muted);
  font-size: 1.15rem;
  transition:
    color $duration-fast $ease-fluid,
    background-color $duration-fast $ease-fluid;

  &:hover:not(:disabled),
  &.active {
    color: var(--primary);
    background: var(--color-primary-soft);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
