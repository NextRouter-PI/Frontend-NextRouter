const onlyNumbers = (value) => String(value ?? '').replace(/\D/g, '')

const extractRaw = (eventOrValue) =>
  typeof eventOrValue === 'object' && eventOrValue !== null && 'target' in eventOrValue
    ? eventOrValue.target?.value
    : eventOrValue

const applyFormatted = (value, setter) => {
  if (typeof setter === 'function') setter(value)
  return value
}

export function formatCPF(eventOrValue, setter) {
  let value = onlyNumbers(extractRaw(eventOrValue))
  if (value.length > 11) value = value.slice(0, 11)
  value = value.replace(/^(\d{3})(\d)/, '$1.$2')
  value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
  value = value.replace(/\.(\d{3})(\d)/, '.$1-$2')
  return applyFormatted(value, setter)
}

export function formatPhone(eventOrValue, setter) {
  let value = onlyNumbers(extractRaw(eventOrValue))
  if (value.length > 11) value = value.slice(0, 11)
  if (value.length <= 10) {
    value = value.replace(/^(\d{2})(\d)/, '($1) $2')
    value = value.replace(/(\d{4})(\d)/, '$1-$2')
  } else {
    value = value.replace(/^(\d{2})(\d)/, '($1) $2')
    value = value.replace(/(\d{5})(\d)/, '$1-$2')
  }
  return applyFormatted(value, setter)
}

export function formatCEP(eventOrValue, setter) {
  let value = onlyNumbers(extractRaw(eventOrValue))
  if (value.length > 8) value = value.slice(0, 8)
  value = value.replace(/^(\d{5})(\d)/, '$1-$2')
  return applyFormatted(value, setter)
}

export function formatCNPJ(eventOrValue, setter) {
  let value = onlyNumbers(extractRaw(eventOrValue))
  if (value.length > 14) value = value.slice(0, 14)
  value = value.replace(/^(\d{2})(\d)/, '$1.$2')
  value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
  value = value.replace(/(\d{4})(\d)/, '$1-$2')
  return applyFormatted(value, setter)
}

export function useInputFormat() {
  return { formatCPF, formatPhone, formatCEP, formatCNPJ }
}
