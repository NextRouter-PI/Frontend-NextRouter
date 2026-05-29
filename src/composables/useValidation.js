import { ref, reactive } from 'vue'

export function useValidation() {
  const errorMessage = ref('')
  const fieldErrors = reactive({})

  function clearErrors() {
    errorMessage.value = ''
    Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
  }

  function setError(msg) {
    errorMessage.value = msg
  }

  function clearFieldError(fieldName) {
    delete fieldErrors[fieldName]
  }

  function required(value, label) {
    if (value === null || value === undefined) return `${label} é obrigatório`
    if (typeof value === 'string' && !value.trim()) return `${label} é obrigatório`
    if (typeof value === 'number') return ''
    return ''
  }

  function minLength(value, min, label) {
    if (!value) return ''
    const len = typeof value === 'string' ? value.length : String(value).length
    if (len < min) return `${label} deve ter no mínimo ${min} caracteres`
    return ''
  }

  function maxLength(value, max, label) {
    if (!value) return ''
    const len = typeof value === 'string' ? value.length : String(value).length
    if (len > max) return `${label} deve ter no máximo ${max} caracteres`
    return ''
  }

  function isEmail(value) {
    if (!value) return ''
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(value.trim())) return 'Email inválido'
    return ''
  }

  function match(value, matchValue, label) {
    if (value !== matchValue) return `${label} não coincidem`
    return ''
  }

  function isNumber(value, label) {
    if (!value && value !== 0) return ''
    if (isNaN(Number(value)) || value === '') return `${label} deve ser um número`
    return ''
  }

  function min(value, minVal, label) {
    if (!value && value !== 0) return ''
    if (Number(value) < minVal) return `${label} deve ser no mínimo ${minVal}`
    return ''
  }

  function max(value, maxVal, label) {
    if (!value && value !== 0) return ''
    if (Number(value) > maxVal) return `${label} deve ser no máximo ${maxVal}`
    return ''
  }

  function isCPF(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length !== 11) return 'CPF inválido'
    if (/^(\d)\1{10}$/.test(digits)) return 'CPF inválido'
    /*
        let sum = 0
        for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
        let remainder = (sum * 10) % 11
        if (remainder === 10) remainder = 0
        if (remainder !== parseInt(digits[9])) return 'CPF inválido'
    
        sum = 0
        for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
        remainder = (sum * 10) % 11
        if (remainder === 10) remainder = 0
        if (remainder !== parseInt(digits[10])) return 'CPF inválido'
      */
    return ''
  }

  function isCNPJ(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length !== 14) return 'CNPJ inválido'

    //if (/^(\d)\1{13}$/.test(digits)) return 'CNPJ inválido'
    /*
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i]
    let remainder = sum % 11
    if (remainder < 2) remainder = 0
    else remainder = 11 - remainder
    if (remainder !== parseInt(digits[12])) return 'CNPJ inválido'

    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0
    for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i]
    remainder = sum % 11
    if (remainder < 2) remainder = 0
    else remainder = 11 - remainder
    if (remainder !== parseInt(digits[13])) return 'CNPJ inválido'
    */
    return ''
  }

  function isPhone(value) {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.length < 10 || digits.length > 11) return 'Telefone inválido'
    return ''
  }

  function isCEP(value) {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.length !== 8) return 'CEP inválido'
    return ''
  }

  function validatePassword(password, confirmation) {
    const err = required(password, 'Senha') || minLength(password, 6, 'Senha')
    if (err) return err
    if (confirmation !== undefined) {
      return match(password, confirmation, 'Senhas')
    }
    return ''
  }

  function validateField(value, validators, fieldName) {
    clearFieldError(fieldName)
    for (const validator of validators) {
      const err = validator(value)
      if (err) {
        fieldErrors[fieldName] = err
        return false
      }
    }
    return true
  }

  function validateForm(rules) {
    clearErrors()
    for (const rule of rules) {
      const err = typeof rule === 'function' ? rule() : rule.fn()
      if (err) {
        errorMessage.value = err
        if (typeof rule !== 'function' && rule.field) {
          fieldErrors[rule.field] = err
        }
        return false
      }
    }
    return true
  }

  return {
    errorMessage,
    fieldErrors,
    clearErrors,
    setError,
    clearFieldError,
    validateField,
    required,
    minLength,
    maxLength,
    isEmail,
    match,
    isNumber,
    min,
    max,
    isCPF,
    isCNPJ,
    isPhone,
    isCEP,
    validatePassword,
    validateForm
  }
}
