export function pointLabel(point) {
  if (!point || typeof point !== 'object') return '—'
  const parts = [
    point.name,
    point.street && point.number ? `${point.street}, ${point.number}` : point.street,
    point.city && point.state ? `${point.city}/${point.state}` : point.city,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

export function createOperationId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `00000000-0000-4000-8000-${String(Date.now()).padStart(12, '0').slice(-12)}`
  )
}
