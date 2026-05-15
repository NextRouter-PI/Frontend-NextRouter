import { ref, computed } from 'vue'
import { useValidation } from '@/composables/useValidation'
import { useInputFormat } from '@/composables/useInputFormat'

export function useSignUpForm() {
  const { formatarCPF, formatarTelefone, formatarCEP } = useInputFormat()
  const {
    errorMessage, fieldErrors, clearErrors, clearFieldError,
    required, minLength, isEmail, match, validateForm, validateField
  } = useValidation()

  const mostrarSenha = ref(false)

  const dias = computed(() => Array.from({ length: 31 }, (_, i) => i + 1))

  const meses = [
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
    { value: '12', label: 'Dezembro' }
  ]

  const currentYear = new Date().getFullYear()

  const anos = computed(() =>
    Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i)
  )

  function limparErro(registerState) {
    clearErrors()
    if (registerState) registerState.state.error = null
  }

  function toggleSenha() {
    mostrarSenha.value = !mostrarSenha.value
  }

  function formatarDataNascimento(form) {
    const dia = String(form.dia).padStart(2, '0')
    const mes = meses.find(item => item.label === form.mes)?.value || '01'
    return `${form.ano}-${mes}-${dia}`
  }

  function validarFormulario(form) {
    return validateForm([
      { fn: () => required(form.nomeCompleto, 'Nome completo'), field: 'nomeCompleto' },
      { fn: () => required(form.email, 'Email') || isEmail(form.email), field: 'email' },
      { fn: () => required(form.password, 'Senha') || minLength(form.password, 6, 'Senha'), field: 'password' },
      { fn: () => match(form.password, form.confirmPassword, 'Senhas'), field: 'confirmPassword' }
    ])
  }

  return {
    mostrarSenha,
    errorMessage,
    fieldErrors,
    dias, meses, anos,
    formatarCPF,
    formatarTelefone,
    formatarCEP,
    limparErro,
    clearFieldError,
    toggleSenha,
    formatarDataNascimento,
    validarFormulario,
    validateField,
    required,
    isEmail,
    minLength,
    match
  }
}
