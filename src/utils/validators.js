export function requiredField(value, label) {
  if (!value) return `${label} é obrigatório`
  if (typeof value === 'string' && !value.trim()) return `${label} é obrigatório`
  return ''
}

export function minLengthField(value, min, label) {
  if (!value) return ''
  const len = typeof value === 'string' ? value.length : String(value).length
  if (len < min) return `${label} deve ter no mínimo ${min} caracteres`
  return ''
}

export function maxLengthField(value, max, label) {
  if (!value) return ''
  const len = typeof value === 'string' ? value.length : String(value).length
  if (len > max) return `${label} deve ter no máximo ${max} caracteres`
  return ''
}

export function isEmail(value) {
  if (!value) return ''
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!regex.test(value.trim())) return 'Email inválido'
  return ''
}

export function isNumber(value, label) {
  if (!value && value !== 0) return ''
  if (Number.isNaN(Number(value)) || value === '') return `${label} deve ser um número`
  return ''
}

export function isCPF(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return 'CPF inválido'

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[9], 10)) return 'CPF inválido'

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[10], 10)) return 'CPF inválido'

  return ''
}

export function isCNPJ(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return 'CNPJ inválido'

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i], 10) * weights1[i]
  let remainder = sum % 11
  remainder = remainder < 2 ? 0 : 11 - remainder
  if (remainder !== parseInt(digits[12], 10)) return 'CNPJ inválido'

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i], 10) * weights2[i]
  remainder = sum % 11
  remainder = remainder < 2 ? 0 : 11 - remainder
  if (remainder !== parseInt(digits[13], 10)) return 'CNPJ inválido'

  return ''
}

export function isPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length < 10 || digits.length > 11) return 'Telefone inválido'
  return ''
}

export function isCEP(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length !== 8) return 'CEP inválido'
  return ''
}

export function passwordMatch(value, matchValue) {
  if (value !== matchValue) return 'As senhas não coincidem'
  return ''
}

// Mesmas regras do backend (validadores de senha do Django): mínimo de 8 caracteres e não pode ser só números.
export function isStrongPassword(value) {
  if (!value) return ''
  const lengthErr = minLengthField(value, 8, 'Senha')
  if (lengthErr) return lengthErr
  if (/^\d+$/.test(value)) return 'A senha não pode conter apenas números'
  return ''
}

export function validatePassword(password, confirmation) {
  const lengthErr = requiredField(password, 'Senha') || isStrongPassword(password)
  if (lengthErr) return lengthErr
  if (confirmation !== undefined) return passwordMatch(password, confirmation)
  return ''
}
