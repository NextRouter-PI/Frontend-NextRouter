import { DEFAULT_EMPTY_LABEL, SERVICE_DIRECTIONS, WEEKDAY_OPTIONS } from '@/constants'

export function formatOrEmpty(value, fallback = DEFAULT_EMPTY_LABEL) {
  return value === null || value === undefined || value === '' ? fallback : value
}

export function formatHour(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

export function formatDateBr(dateStr, fallback = '—') {
  if (!dateStr) return fallback
  const parts = String(dateStr).split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(dateStr)
}

export function formatServiceSummary(service, { includeDirection = true } = {}) {
  if (!service) return ''
  const tipo = service.is_shared ? 'Compartilhado' : 'Habitual'
  const time = service.targetTimeLabel || formatHour(service.target_time)
  if (!includeDirection) {
    return `${service.name} (${time} · ${tipo})`
  }
  const dir = service.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno'
  return `${service.name} (${dir} ${time} · ${tipo})`
}

export function formatWeekdays(mask) {
  const num = Number(mask) || 0
  return (
    WEEKDAY_OPTIONS.filter((w) => (num & w.bit) !== 0)
      .map((w) => w.label)
      .join(', ') || 'Nenhum dia'
  )
}

export function formatDateChip(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || 'Data'
  const date = new Date(`${isoDate}T12:00:00`)
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

export function formatDateTimeBr(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return String(iso)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTimeBr(value, fallback = '—') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatCnpjDisplay(cnpj, fallback = DEFAULT_EMPTY_LABEL) {
  if (!cnpj) return fallback
  const digits = String(cnpj).replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatAddress(data, fallback = DEFAULT_EMPTY_LABEL) {
  if (!data) return fallback
  return (
    [
      data.street,
      data.number && `nº ${data.number}`,
      data.complement,
      data.neighborhood,
      data.city && data.state && `${data.city} - ${data.state}`,
    ]
      .filter(Boolean)
      .join(', ') || fallback
  )
}
