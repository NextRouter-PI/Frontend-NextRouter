export function asList(data) {
  return Array.isArray(data) ? data : data?.results || []
}

export function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}
