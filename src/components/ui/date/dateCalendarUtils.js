export function normalizeMonthNumber(value, months) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const byLabel = months.find((m) => m.label.toLowerCase() === raw.toLowerCase())
  if (byLabel) return String(byLabel.value).padStart(2, '0')
  const num = Number(raw)
  if (Number.isInteger(num) && num >= 1 && num <= 12) return String(num).padStart(2, '0')
  return raw.replace(/\D/g, '').slice(0, 2)
}

export function formatModelsAsDate({ day, month, year, months }) {
  const d = String(day ?? '').replace(/\D/g, '').slice(0, 2)
  const m = normalizeMonthNumber(month, months)
  const y = String(year ?? '').replace(/\D/g, '').slice(0, 4)
  if (!d && !m && !y) return ''
  if (y) return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  if (m) return `${d.padStart(2, '0')}/${m}`
  return d
}

export function buildCalendarCells({ viewYear, viewMonth, selectedDay, selectedMonth, selectedYear, today }) {
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate()
  const currentYear = today.getFullYear()
  const cells = []
  for (let i = 0; i < firstDay; i += 1) cells.push({ key: `blank-${i}`, empty: true })
  for (let d = 1; d <= totalDays; d += 1) {
    const cellDate = new Date(viewYear, viewMonth, d)
    cells.push({
      key: `${viewYear}-${viewMonth}-${d}`,
      day: d,
      empty: false,
      isFuture: cellDate > today,
      isSelected: selectedDay === d && selectedMonth === viewMonth + 1 && selectedYear === viewYear,
      isToday: d === today.getDate() && viewMonth === today.getMonth() && viewYear === currentYear,
    })
  }
  return cells
}
