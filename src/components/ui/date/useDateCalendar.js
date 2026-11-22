import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { buildCalendarCells, formatModelsAsDate, normalizeMonthNumber } from './dateCalendarUtils'

export function useDateCalendar({ day, month, year, months, disabled, wrapperRef }) {
  const pickerOpen = shallowRef(false)
  const textValue = shallowRef('')

  const today = new Date()
  const currentYear = today.getFullYear()
  const viewMonth = shallowRef(today.getMonth())
  const viewYear = shallowRef(currentYear - 20)

  watch(
    [day, month, year],
    () => {
      const monthList = months()
      const d = String(day.value ?? '').replace(/\D/g, '')
      const m = normalizeMonthNumber(month.value, monthList)
      const y = String(year.value ?? '').replace(/\D/g, '')
      const currentDigits = textValue.value.replace(/\D/g, '')
      const modelDigits = `${d}${m}${y}`
      if (modelDigits && modelDigits !== currentDigits) {
        textValue.value = formatModelsAsDate({ day: day.value, month: month.value, year: year.value, months: monthList })
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
    textValue.value = digits.length > 4 ? `${d}/${m}/${y}` : digits.length > 2 ? `${d}/${m}` : d
    day.value = d
    month.value = m
    year.value = y

    const numMonth = Number(m)
    const numYear = Number(y)
    if (numMonth >= 1 && numMonth <= 12) viewMonth.value = numMonth - 1
    if (y.length === 4 && numYear >= 1900 && numYear <= currentYear) viewYear.value = numYear
  }

  function togglePicker() {
    if (disabled()) return
    if (!pickerOpen.value) {
      const m = Number(normalizeMonthNumber(month.value, months()))
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
    if (viewMonth.value === 0 && viewYear.value > 1900) {
      viewMonth.value = 11
      viewYear.value -= 1
    } else if (viewMonth.value > 0) {
      viewMonth.value -= 1
    }
  }

  function nextMonth() {
    if (viewMonth.value === 11 && viewYear.value < currentYear) {
      viewMonth.value = 0
      viewYear.value += 1
    } else if (viewMonth.value < 11) {
      viewMonth.value += 1
    }
  }

  const calendarCells = computed(() =>
    buildCalendarCells({
      viewYear: viewYear.value,
      viewMonth: viewMonth.value,
      selectedDay: Number(day.value),
      selectedMonth: Number(normalizeMonthNumber(month.value, months())),
      selectedYear: Number(year.value),
      today,
    }),
  )

  function selectDay(cell) {
    if (cell.empty || cell.isFuture || disabled()) return
    applyDigits(`${String(cell.day).padStart(2, '0')}${String(viewMonth.value + 1).padStart(2, '0')}${viewYear.value}`)
    closePicker()
  }

  function clearDate() {
    if (disabled()) return
    textValue.value = day.value = month.value = year.value = ''
  }

  function handleOutsideClick(event) {
    if (pickerOpen.value && wrapperRef.value && !wrapperRef.value.contains(event.target)) closePicker()
  }
  function handleKeydown(event) {
    if (event.key === 'Escape' && pickerOpen.value) closePicker()
  }

  onMounted(() => {
    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleKeydown)
  })
  onUnmounted(() => {
    document.removeEventListener('pointerdown', handleOutsideClick)
    document.removeEventListener('keydown', handleKeydown)
  })

  return { pickerOpen, textValue, viewMonth, viewYear, calendarCells, applyDigits, togglePicker, prevMonth, nextMonth, selectDay, clearDate }
}
