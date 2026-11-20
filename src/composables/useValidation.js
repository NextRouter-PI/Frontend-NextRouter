import { reactive, shallowRef } from 'vue'
import api from '@/api/client'
import {
  isCEP,
  isCNPJ,
  isCPF,
  isEmail,
  isNumber,
  isPhone,
  isStrongPassword,
  maxLengthField,
  minLengthField,
  passwordMatch,
  requiredField,
  validatePassword,
} from '@/utils/validators'

async function getCEP(data) {
  const cleanCEP = String(data.cep || '').replace(/\D/g, '')
  if (cleanCEP.length !== 8) return
  try {
    const { data: body } = await api.get(`/cep/${cleanCEP}/`)
    if (body.state) data.state = body.state
    if (body.city) data.city = body.city
    if (body.street) data.street = body.street
    if (body.neighborhood) data.neighborhood = body.neighborhood
  } catch {
    // Falha silenciosa: o usuário pode preencher o endereço manualmente
  }
}

export function useValidator() {
  const errorMessage = shallowRef('')
  const fieldErrors = reactive({})

  function clearErrors() {
    errorMessage.value = ''
    Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  }

  function clearFieldError(fieldName) {
    delete fieldErrors[fieldName]
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
      const err = rule.fn()
      if (err) {
        errorMessage.value = err
        if (rule.field) fieldErrors[rule.field] = err
        return false
      }
    }
    return true
  }

  return {
    errorMessage,
    fieldErrors,
    clearErrors,
    clearFieldError,
    validateField,
    validateForm,
    requiredField,
    minLengthField,
    maxLengthField,
    isEmail,
    passwordMatch,
    isNumber,
    isCPF,
    isCNPJ,
    isPhone,
    isCEP,
    validatePassword,
    isStrongPassword,
    getCEP,
  }
}
