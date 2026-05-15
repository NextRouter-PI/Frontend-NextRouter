import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterState } from '@/store/useRegisterState'
import { useValidation } from '@/composables/useValidation'
import { useInputFormat } from '@/composables/useInputFormat'

export function useSignUpEmpresaForm() {
  const router = useRouter()
  const registerState = useRegisterState()
  const { formatarCPF, formatarCNPJ, formatarTelefone } = useInputFormat()
  const {
    errorMessage, fieldErrors, clearErrors, clearFieldError,
    required, isCNPJ, isCPF, validatePassword, validateForm, validateField,
    minLength, match
  } = useValidation()

  const currentPage = ref(1)
  const mostrarSenha = ref(false)

  const page1Form = ref({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    telefoneComercial: '',
    emailCorporativo: '',
    cidade: '',
    estado: '',
    endereco: '',
    inscricaoEstadual: ''
  })

  const page3Form = ref({
    ceoNome: '',
    ceoCpf: '',
    senha: '',
    confirmarSenha: ''
  })

  const arquivos = reactive({
    contratoSocial: null,
    licencaOperacao: null,
    certidoesNegativas: null
  })

  const arquivosNomes = reactive({
    contratoSocial: 'Nenhum arquivo selecionado',
    licencaOperacao: 'Nenhum arquivo selecionado',
    certidoesNegativas: 'Nenhum arquivo selecionado'
  })

  function limparErro() {
    clearErrors()
    if (registerState) registerState.state.error = null
  }

  function validatePage1() {
    return validateForm([
      { fn: () => required(page1Form.value.razaoSocial, 'Razão Social'), field: 'razaoSocial' },
      { fn: () => required(page1Form.value.nomeFantasia, 'Nome Fantasia'), field: 'nomeFantasia' },
      { fn: () => required(page1Form.value.cnpj, 'CNPJ') || isCNPJ(page1Form.value.cnpj), field: 'cnpj' },
    ])
  }

  function validatePage2() {
    return validateForm([
      { fn: () => required(arquivos.contratoSocial, 'Contrato Social'), field: 'contratoSocial' },
      { fn: () => required(arquivos.licencaOperacao, 'Licença de Operação'), field: 'licencaOperacao' },
      { fn: () => required(arquivos.certidoesNegativas, 'Certidões Negativas'), field: 'certidoesNegativas' },
    ])
  }

  function validatePage3() {
    return validateForm([
      { fn: () => required(page3Form.value.ceoNome, 'Nome'), field: 'ceoNome' },
      { fn: () => required(page3Form.value.ceoCpf, 'CPF') || isCPF(page3Form.value.ceoCpf), field: 'ceoCpf' },
      { fn: () => validatePassword(page3Form.value.senha, page3Form.value.confirmarSenha), field: 'senha' },
    ])
  }

  function goToNextPage() {
    clearErrors()
    if (currentPage.value === 1 && validatePage1()) { currentPage.value++; return }
    if (currentPage.value === 2 && validatePage2()) { currentPage.value++; return }
    if (currentPage.value === 3 && validatePage3()) { currentPage.value++ }
  }

  function toggleSenha() {
    mostrarSenha.value = !mostrarSenha.value
  }

  function goToPreviousPage() {
    if (currentPage.value > 1) currentPage.value--
  }

  async function handleSubmit() {
    clearErrors()
    if (!validatePage1()) return
    if (!validatePage2()) return
    if (!validatePage3()) return

    try {
      const formData = new FormData()

      formData.append('razao_social', page1Form.value.razaoSocial)
      formData.append('nome_fantasia', page1Form.value.nomeFantasia)
      formData.append('cnpj', page1Form.value.cnpj.replace(/[^\d]/g, ''))
      formData.append('telefone_comercial', page1Form.value.telefoneComercial)
      formData.append('email', page1Form.value.emailCorporativo)
      formData.append('cidade', page1Form.value.cidade)
      formData.append('estado', page1Form.value.estado)
      formData.append('endereco', page1Form.value.endereco)
      formData.append('inscricao_estadual', page1Form.value.inscricaoEstadual)
      formData.append('responsavel_nome', page3Form.value.ceoNome)
      formData.append('responsavel_cpf', page3Form.value.ceoCpf.replace(/[^\d]/g, ''))
      formData.append('password', page3Form.value.senha)
      formData.append('contrato_social', arquivos.contratoSocial)
      formData.append('licenca_operacao', arquivos.licencaOperacao)
      formData.append('certidoes_negativas', arquivos.certidoesNegativas)

      await registerState.registerEmpresa(formData)

      if (registerState.state.success) {
        router.push('/login')
      }
      if (registerState.state.error) {
        errorMessage.value =
          typeof registerState.state.error === 'string'
            ? registerState.state.error
            : JSON.stringify(registerState.state.error)
      }
    } catch (error) {
      console.error(error)
      errorMessage.value =
        error.response?.data?.message ||
        error.message ||
        'Erro ao cadastrar'
    }
  }

  return {
    currentPage,
    errorMessage,
    fieldErrors,
    mostrarSenha,
    page1Form,
    page3Form,
    arquivos,
    arquivosNomes,
    formatarCNPJ,
    formatarCPF,
    formatarTelefone,
    limparErro,
    clearFieldError,
    toggleSenha,
    required,
    isCNPJ,
    isCPF,
    minLength,
    match,
    validatePassword,
    goToNextPage,
    goToPreviousPage,
    handleSubmit,
    registerState,
    validateField
  }
}
