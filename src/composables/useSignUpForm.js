import { ref, computed } from 'vue'
import { useValidator } from '@/composables/useValidation'
import { useInputFormat } from '@/composables/useInputFormat'


const {
  formatCPF,
  formatCEP,
  formatPhone
} = useInputFormat()


const {
  errorMessage,
  fieldErrors,
  getCEP,
  clearErrors,
  clearFieldError,
  requiredField,
  minLengthField,
  isEmail,
  passwordMatch,
  validateForm,
  validateField,
  isCPF,
  isCEP,
  isPhone
} = useValidator()


export function useSignUpPassengerDriverForm() {
  const isPasswordVisible = ref(false)

  const days = computed(() => Array.from({ length: 31 }, (_, i) => i + 1))

  const months = [
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

  const currentYear = new Date().getFullYear()

  const years = computed(() =>
    Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i),
  )

  function showPassword() {
    isPasswordVisible.value = !isPasswordVisible.value
  }

  function formatBirthday(form) {
    const day = String(form.day).padStart(2, '0')

    const month = months.find((item) => item.label === form.month)?.value || '01'

    return `${form.year}-${month}-${day}`
  }

  function validarFormulario(form) {
    return validateForm([

      { fn: () => requiredField(form.name, 'Nome completo'), field: 'name' }, { fn: () => requiredField(form.day, 'Dia de nascimento'), field: 'day' },
      { fn: () => requiredField(form.month, 'Mês de nascimento'), field: 'month' },
      { fn: () => requiredField(form.year, 'Ano de nascimento'), field: 'year' },
      { fn: () => requiredField(form.cpf, 'CPF') || isCPF(form.cpf), field: 'cpf', },
      { fn: () => requiredField(form.email, 'Email') || isEmail(form.email), field: 'email' },

      {
        fn: () =>
          requiredField(form.password, 'Senha') || minLengthField(form.password, 6, 'Senha'),
        field: 'password',
      },
      {
        fn: () => passwordMatch(form.password, form.confirmPassword, 'Senhas'),
        field: 'confirmPassword',
      },
    ])
  }

  const currentPage = ref(1)

  return {
    currentPage,
    clearErrors,
    showPassword,
    isPasswordVisible,
    errorMessage,
    fieldErrors,
    days,
    months,
    years,
    formatCEP,
    formatPhone,
    formatCPF,
    clearFieldError,
    formatBirthday,
    validarFormulario,
    validateField,
    requiredField,
    isEmail,
    minLengthField,
    passwordMatch,
    getCEP,
    isCEP,
    isCPF,
    isPhone
  }
}
