<script setup>
import { computed, onMounted, onUnmounted, ref, shallowRef, useId, watch } from 'vue'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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
const wrapperRef = ref(null)
const pickerOpen = shallowRef(false)
const textValue = shallowRef('')

const today = new Date()
const currentYear = today.getFullYear()
const defaultViewYear = currentYear - 20

const viewMonth = shallowRef(today.getMonth())
const viewYear = shallowRef(defaultViewYear)

const combinedError = computed(() => props.dayError || props.monthError || props.yearError || '')

function normalizeMonthNumber(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const byLabel = props.months.find((m) => m.label.toLowerCase() === raw.toLowerCase())
  if (byLabel) return String(byLabel.value).padStart(2, '0')
  const num = Number(raw)
  if (Number.isInteger(num) && num >= 1 && num <= 12) return String(num).padStart(2, '0')
  return raw.replace(/\D/g, '').slice(0, 2)
}

function formatFromModels() {
  const d = String(day.value ?? '').replace(/\D/g, '').slice(0, 2)
  const m = normalizeMonthNumber(month.value)
  const y = String(year.value ?? '').replace(/\D/g, '').slice(0, 4)
  if (!d && !m && !y) return ''
  if (y) return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  if (m) return `${d.padStart(2, '0')}/${m}`
  return d
}

watch(
  [day, month, year],
  () => {
    const d = String(day.value ?? '').replace(/\D/g, '')
    const m = normalizeMonthNumber(month.value)
    const y = String(year.value ?? '').replace(/\D/g, '')
    const currentDigits = textValue.value.replace(/\D/g, '')
    const modelDigits = `${d}${m}${y}`
    if (modelDigits && modelDigits !== currentDigits) {
      textValue.value = formatFromModels()
    } else if (!modelDigits && currentDigits) {
      textValue.value = ''
    }
  },
  { immediate: true },
)

function applyDigits(rawDigits) {
  const digits = rawDigits.replace(/\D/g, '').slice(0, 8)
  const d = digits.slice(0, 2)
  const m = digits.slice(2, 4)
  const y = digits.slice(4, 8)

  if (digits.length > 4) textValue.value = `${d}/${m}/${y}`
  else if (digits.length > 2) textValue.value = `${d}/${m}`
  else textValue.value = d

  day.value = d
  month.value = m
  year.value = y

  const numMonth = Number(m)
  const numYear = Number(y)
  if (numMonth >= 1 && numMonth <= 12) viewMonth.value = numMonth - 1
  if (y.length === 4 && numYear >= 1900 && numYear <= currentYear) viewYear.value = numYear
}

function handleTextInput(event) {
  const raw = String(event.target.value || '')
  // Suporta colar datas ISO (AAAA-MM-DD)
  const isoMatch = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    applyDigits(`${isoMatch[3]}${isoMatch[2]}${isoMatch[1]}`)
    event.target.value = textValue.value
    return
  }
  applyDigits(raw)
  event.target.value = textValue.value
}

function togglePicker() {
  if (props.disabled) return
  if (!pickerOpen.value) {
    const m = Number(normalizeMonthNumber(month.value))
    const y = Number(year.value)
    if (m >= 1 && m <= 12) viewMonth.value = m - 1
    if (y >= 1900 && y <= currentYear) viewYear.value = y
  }
  pickerOpen.value = !pickerOpen.value
}

function closePicker() {
  pickerOpen.value = false
}

function prevMonth() {
  if (viewMonth.value === 0) {
    if (viewYear.value > 1900) {
      viewMonth.value = 11
      viewYear.value -= 1
    }
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    if (viewYear.value < currentYear) {
      viewMonth.value = 0
      viewYear.value += 1
    }
  } else {
    viewMonth.value += 1
  }
}

const calendarCells = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const totalDays = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const selectedDay = Number(day.value)
  const selectedMonth = Number(normalizeMonthNumber(month.value))
  const selectedYear = Number(year.value)

  const cells = []
  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ key: `blank-${i}`, empty: true })
  }
  for (let d = 1; d <= totalDays; d += 1) {
    const cellDate = new Date(viewYear.value, viewMonth.value, d)
    const isFuture = cellDate > today
    const isSelected =
      selectedDay === d && selectedMonth === viewMonth.value + 1 && selectedYear === viewYear.value
    const isToday =
      d === today.getDate() && viewMonth.value === today.getMonth() && viewYear.value === currentYear
    cells.push({
      key: `${viewYear.value}-${viewMonth.value}-${d}`,
      day: d,
      empty: false,
      isFuture,
      isSelected,
      isToday,
    })
  }
  return cells
})

function selectDay(cell) {
  if (cell.empty || cell.isFuture || props.disabled) return
  const d = String(cell.day).padStart(2, '0')
  const m = String(viewMonth.value + 1).padStart(2, '0')
  const y = String(viewYear.value)
  applyDigits(`${d}${m}${y}`)
  closePicker()
}

function clearDate() {
  if (props.disabled) return
  textValue.value = ''
  day.value = ''
  month.value = ''
  year.value = ''
}

function handleOutsideClick(event) {
  if (pickerOpen.value && wrapperRef.value && !wrapperRef.value.contains(event.target)) {
    closePicker()
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape' && pickerOpen.value) {
    closePicker()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsideClick)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleOutsideClick)
  document.removeEventListener('keydown', handleKeydown)
})
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
          <span class="mdi mdi-close" aria-hidden="true"></span>
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
          <span class="mdi mdi-calendar-month-outline" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <Transition name="fade-slide">
      <div v-if="pickerOpen" class="date-popover" role="dialog" aria-label="Selecionar data de nascimento">
        <div class="popover-header">
          <button type="button" class="nav-arrow-btn" aria-label="Mês anterior" @click="prevMonth">
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

          <button type="button" class="nav-arrow-btn" aria-label="Próximo mês" @click="nextMonth">
            <span class="mdi mdi-chevron-right" aria-hidden="true"></span>
          </button>
        </div>

        <div class="weekday-row" aria-hidden="true">
          <span v-for="w in WEEKDAYS" :key="w" class="weekday-cell">{{ w }}</span>
        </div>

        <div class="days-grid">
          <template v-for="cell in calendarCells" :key="cell.key">
            <span v-if="cell.empty" class="day-empty"></span>
            <button
              v-else
              type="button"
              class="day-cell"
              :class="{ selected: cell.isSelected, today: cell.isToday }"
              :disabled="cell.isFuture"
              @click="selectDay(cell)"
            >
              {{ cell.day }}
            </button>
          </template>
        </div>
      </div>
    </Transition>

    <Transition name="fade-slide">
      <p v-if="combinedError" :id="`${fieldId}-error`" class="date-field-error" role="alert">
        {{ combinedError }}
      </p>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.date-field {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: $space-4;

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

    &:focus {
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

  &-error {
    color: var(--danger);
    font-size: 0.78rem;
    margin-top: $space-1;
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
