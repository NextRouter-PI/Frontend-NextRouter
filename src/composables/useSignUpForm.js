import { ref, computed } from 'vue'
import { useInputFormat } from '@/composables/useInputFormat'

export function useSignUpForm() {
  const { formatarCPF, formatarTelefone, formatarCEP } = useInputFormat()

  const mostrarSenha = ref(false)
  const errorMessage = ref('')

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
    errorMessage.value = ''
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
    if (!form.nomeCompleto) { errorMessage.value = 'Nome completo é obrigatório'; return false }
    if (!form.email) { errorMessage.value = 'Email é obrigatório'; return false }
    if (!form.password) { errorMessage.value = 'Senha é obrigatória'; return false }
    if (form.password.length < 6) { errorMessage.value = 'A senha deve ter no mínimo 6 caracteres'; return false }
    if (form.password !== form.confirmPassword) { errorMessage.value = 'As senhas não coincidem'; return false }
    return true
  }

  return {
    mostrarSenha,
    errorMessage,
    dias, meses, anos,
    formatarCPF,
    formatarTelefone,
    formatarCEP,
    limparErro,
    toggleSenha,
    formatarDataNascimento,
    validarFormulario
  }
}
