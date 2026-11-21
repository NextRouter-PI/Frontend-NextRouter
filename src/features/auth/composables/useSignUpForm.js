import { computed, shallowRef } from 'vue'
import { useValidator } from '@/composables/useValidation'
import { isCPF, isEmail, isStrongPassword, passwordMatch, requiredField } from '@/utils/validators'

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

export function useSignUpPassengerDriverForm() {
  const { errorMessage, fieldErrors, clearErrors, clearFieldError, validateForm, validateField } = useValidator()
  const isPasswordVisible = shallowRef(false)
  const currentPage = shallowRef(1)
  const currentYear = new Date().getFullYear()

  const days = computed(() => Array.from({ length: 31 }, (_, i) => i + 1))
  const years = computed(() => Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i))

  function showPassword() {
    isPasswordVisible.value = !isPasswordVisible.value
  }

  // Aceita o mês pelo nome ("Março") ou pelo número ("3" / "03").
  function resolveMonth(value) {
    const text = String(value ?? '').trim().toLowerCase()
    const byLabel = MONTHS.find((item) => item.label.toLowerCase() === text)
    if (byLabel) return byLabel.value
    const number = Number(text)
    return Number.isInteger(number) && number >= 1 && number <= 12 ? String(number).padStart(2, '0') : null
  }

  function birthdayError(form) {
    const day = Number(form.day)
    const month = resolveMonth(form.month)
    const year = Number(form.year)
    if (!month) return 'Mês de nascimento inválido'
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) return 'Ano de nascimento inválido'
    const date = new Date(year, Number(month) - 1, day)
    const isRealDate = date.getFullYear() === year && date.getMonth() === Number(month) - 1 && date.getDate() === day
    if (!Number.isInteger(day) || !isRealDate) return 'Data de nascimento inválida'
    if (date > new Date()) return 'A data de nascimento não pode estar no futuro'
    return ''
  }

  function formatBirthday(form) {
    const day = String(Number(form.day)).padStart(2, '0')
    return `${form.year}-${resolveMonth(form.month)}-${day}`
  }

  function clearBirthdayErrors() {
    for (const field of ['day', 'month', 'year']) clearFieldError(field)
  }

  function validarFormulario(form) {
    return validateForm([
      { fn: () => requiredField(form.name, 'Nome completo'), field: 'name' },
      { fn: () => requiredField(form.day, 'Dia de nascimento'), field: 'day' },
      { fn: () => requiredField(form.month, 'Mês de nascimento'), field: 'month' },
      { fn: () => requiredField(form.year, 'Ano de nascimento'), field: 'year' },
      { fn: () => birthdayError(form), field: 'day' },
      { fn: () => requiredField(form.cpf, 'CPF') || isCPF(form.cpf), field: 'cpf' },
      { fn: () => requiredField(form.email, 'Email') || isEmail(form.email), field: 'email' },
      { fn: () => requiredField(form.password, 'Senha') || isStrongPassword(form.password), field: 'password' },
      { fn: () => passwordMatch(form.password, form.confirmPassword, 'Senhas'), field: 'confirmPassword' },
    ])
  }

  return {
    currentPage,
    isPasswordVisible,
    showPassword,
    clearErrors,
    clearFieldError,
    clearBirthdayErrors,
    errorMessage,
    fieldErrors,
    days,
    months: MONTHS,
    years,
    formatBirthday,
    validarFormulario,
    validateField,
  }
}
