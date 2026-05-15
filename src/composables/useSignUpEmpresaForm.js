import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterState } from '@/store/useRegisterState'
import { useInputFormat } from '@/composables/useInputFormat'

export function useSignUpEmpresaForm() {
  const router = useRouter()
  const registerState = useRegisterState()
  const { formatarCPF, formatarCNPJ, formatarTelefone } = useInputFormat()

  const currentPage = ref(1)
  const errorMessage = ref('')
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
    errorMessage.value = ''
    if (registerState) registerState.state.error = null
  }

  function validatePage1() {
    if (!page1Form.value.razaoSocial.trim()) {
      errorMessage.value = 'Razão Social é obrigatória'
      return false
    }
    if (!page1Form.value.nomeFantasia.trim()) {
      errorMessage.value = 'Nome Fantasia é obrigatório'
      return false
    }
    if (!page1Form.value.cnpj.trim()) {
      errorMessage.value = 'CNPJ é obrigatório'
      return false
    }
    return true
  }

  function validatePage2() {
    if (!arquivos.contratoSocial) {
      errorMessage.value = 'Contrato Social obrigatório'
      return false
    }
    if (!arquivos.licencaOperacao) {
      errorMessage.value = 'Licença obrigatória'
      return false
    }
    if (!arquivos.certidoesNegativas) {
      errorMessage.value = 'Certidões obrigatórias'
      return false
    }
    return true
  }

  function validatePage3() {
    if (!page3Form.value.ceoNome.trim()) {
      errorMessage.value = 'Nome obrigatório'
      return false
    }
    if (!page3Form.value.ceoCpf.trim()) {
      errorMessage.value = 'CPF obrigatório'
      return false
    }
    if (!page3Form.value.senha.trim()) {
      errorMessage.value = 'Senha obrigatória'
      return false
    }
    if (page3Form.value.senha !== page3Form.value.confirmarSenha) {
      errorMessage.value = 'As senhas não coincidem'
      return false
    }
    if (page3Form.value.senha.length < 6) {
      errorMessage.value = 'A senha deve ter no mínimo 6 caracteres'
      return false
    }
    return true
  }

  function goToNextPage() {
    errorMessage.value = ''
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
    errorMessage.value = ''
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
    mostrarSenha,
    page1Form,
    page3Form,
    arquivos,
    arquivosNomes,
    formatarCNPJ,
    formatarCPF,
    formatarTelefone,
    limparErro,
    toggleSenha,
    goToNextPage,
    goToPreviousPage,
    handleSubmit,
    registerState
  }
}
