import { ref, reactive, toRaw } from 'vue'
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

      formData.append('user_data.email', page1Form.value.emailCorporativo)
      formData.append('user_data.password', page3Form.value.senha)
      formData.append('user_data.name', page1Form.value.nomeFantasia)
      formData.append('user_data.cep', '99999999')
      formData.append('user_data.cpf', '909809800')

      formData.append('cnpj', page1Form.value.cnpj.replace(/[^\d]/g, ''))
      formData.append('cep', '99999999')

      if (arquivos.contratoSocial) {
        formData.append('articles_of_association_document.file', arquivos.contratoSocial)
      }

      if (arquivos.licencaOperacao) {
        formData.append('state_operating_license_document.file', arquivos.licencaOperacao)
      }

      if (arquivos.certidoesNegativas) {
        formData.append('certificate_of_good_stading_document.file', arquivos.certidoesNegativas)
      }

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
