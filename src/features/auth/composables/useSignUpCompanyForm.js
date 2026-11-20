import { ref, reactive, onScopeDispose } from 'vue'
import { useRegisterState } from '@/features/auth/composables/useRegisterState'
import { useValidator } from '@/composables/useValidation'
import { useInputFormat } from '@/composables/useInputFormat'
import { useEmailVerification } from '@/features/auth/composables/useEmailVerification'
import { uploadDocument } from '@/api/upload'
import { formatApiError } from '@/utils/apiErrors'

const {
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP
} = useInputFormat()


export function useSignUpCompanyForm() {
  const registerState = useRegisterState()
  const {
    errorMessage,
    fieldErrors,
    clearErrors,
    clearFieldError,
    isCNPJ,
    isCPF,
    validatePassword,
    validateForm,
    validateField,
    minLengthField,
    isStrongPassword,
    passwordMatch,
    getCEP,
    requiredField,
    isCEP,
    isEmail,
    isPhone,
  } = useValidator()
  const controller = new AbortController()
  const { signal } = controller
  onScopeDispose(() => controller.abort())

  const currentPage = ref(1)


  const isPasswordVisible = ref(false)

  const {
    codigo, enviandoCodigo, erroCodigo, enviarCodigo, prepararVerificacao,
    codigoPara, cooldown, emailCodigo,
  } = useEmailVerification()
  const enviandoDocumentos = ref(false)
  const documentKeys = reactive({
    articlesOfAssociation: '',
    stateOperatingLicense: '',
    certificateOfGoodStading: '',
  })


  const page1Form = reactive({
    legalName: '',
    tradeName: '',
    cnpj: '',
    contactPhone: '',
    contactEmail: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    latitude: null,
    longitude: null,
    stateRegistration: '' // * Essa propriedade é tratada como se fosse parte da página 1, mas consta de fato na página 2
  })

  // * Os arquivos fazem parte da página 2!
  // * Para melhor legibilidade do código são tratados a parte
  const files = reactive({
    articlesOfAssociation: {
      file: null,
      name: 'Nenhum arquivo selecionado',
    },
    stateOperatingLicense: {
      file: null,
      name: 'Nenhum arquivo selecionado',
    },
    certificateOfGoodStading: {
      file: null,
      name: 'Nenhum arquivo selecionado',
    },
  })

  const page3Form = reactive({
    ceoName: '',
    ceoCpf: '',
    loginEmail: '',
    password: '',
    passwordConfirm: ''
  })


  /*
    * Validações de página
  */
  function validatePage1() {
    return validateForm([
      { fn: () => requiredField(page1Form.legalName, 'Razão Social'), field: 'legalName' },
      { fn: () => requiredField(page1Form.tradeName, 'Nome Fantasia'), field: 'tradeName' },
      { fn: () => requiredField(page1Form.cnpj, 'CNPJ') || isCNPJ(page1Form.cnpj), field: 'cnpj' },
      { fn: () => requiredField(page1Form.cep, 'Endereço') || isCEP(page1Form.cep), field: 'cep' },
    ])
  }

  function validatePage2() {
    return validateForm([
      { fn: () => requiredField(page1Form.stateRegistration, 'Inscrição Estadual'), field: 'stateRegistration' },
      { fn: () => requiredField(files.articlesOfAssociation.file, 'Contrato Social'), field: 'articlesOfAssociation' },
      { fn: () => requiredField(files.stateOperatingLicense.file, 'Licença de Operação'), field: 'stateOperatingLicense' },
      { fn: () => requiredField(files.certificateOfGoodStading.file, 'Certidões Negativas'), field: 'certificateOfGoodStading' },
    ])
  }

  function validatePage3() {
    return validateForm([
      { fn: () => requiredField(page3Form.ceoName, 'Nome'), field: 'ceoName' },
      { fn: () => requiredField(page3Form.ceoCpf, 'CPF') || isCPF(page3Form.ceoCpf), field: 'ceoCpf' },
      { fn: () => requiredField(page3Form.loginEmail, 'Email de login') || isEmail(page3Form.loginEmail), field: 'loginEmail' },
      { fn: () => validatePassword(page3Form.password, page3Form.passwordConfirm), field: 'password' },
    ])
  }


  function goToNextPage() {
    clearErrors()
    if (currentPage.value === 1 && validatePage1()) { currentPage.value++; return }
    if (currentPage.value === 2 && validatePage2()) { currentPage.value++; return }
    if (currentPage.value === 3 && validatePage3()) { currentPage.value++ }
  }


  function showPassword() {
    isPasswordVisible.value = !isPasswordVisible.value
  }


  function goToPreviousPage() {
    if (enviandoDocumentos.value || enviandoCodigo.value || registerState.state.loading) return
    erroCodigo.value = ''
    registerState.reset()
    if (currentPage.value > 1) currentPage.value--
  }

  // Documentos já enviados (por campo): evita reenviar e duplicar arquivos a cada tentativa.
  const arquivosEnviados = {}

  async function enviarDocumento(campo, descricao) {
    const arquivo = files[campo].file
    if (arquivosEnviados[campo] !== arquivo) {
      const { data } = await uploadDocument(arquivo, descricao, { signal })
      if (signal.aborted) return
      documentKeys[campo] = data.attachment_key
      arquivosEnviados[campo] = arquivo
    }
  }


  /*
    * Envia os 3 documentos e o código de verificação de e-mail antes da revisão final.
  */
  async function avancarParaVerificacao() {
    if (signal.aborted || enviandoDocumentos.value || enviandoCodigo.value) return
    if (currentPage.value !== 4) return
    clearErrors()
    if (!validatePage1()) return
    if (!validatePage2()) return
    if (!validatePage3()) return

    enviandoDocumentos.value = true
    try {
      const resultados = await Promise.allSettled([
        enviarDocumento('articlesOfAssociation', `Contrato social de ${page1Form.tradeName}`),
        enviarDocumento('stateOperatingLicense', `Licença de operação de ${page1Form.tradeName}`),
        enviarDocumento('certificateOfGoodStading', `Certidões negativas de ${page1Form.tradeName}`),
      ])
      if (signal.aborted) return
      const falha = resultados.find((resultado) => resultado.status === 'rejected')
      if (falha) throw falha.reason
    } catch (error) {
      if (!signal.aborted) {
        errorMessage.value = formatApiError(error, 'Não foi possível enviar os documentos. Verifique se todos são PDFs válidos.')
      }
      return
    } finally {
      if (!signal.aborted) enviandoDocumentos.value = false
    }

    const sucesso = await prepararVerificacao(page3Form.loginEmail)
    if (sucesso && !signal.aborted) currentPage.value = 5
  }

  /*
    * Função que intecepta o submit do formulário html
  */
  async function handleSubmit() {
    if (signal.aborted || registerState.state.loading || currentPage.value !== 5) return
    const code = codigoPara(page3Form.loginEmail)
    if (!code || enviandoCodigo.value) return

    try {

      await registerState.registerCompany({
        responsible: {
          email: page3Form.loginEmail, password: page3Form.password,
          name: page3Form.ceoName, cpf: page3Form.ceoCpf, code,
        },
        company: page1Form,
        documents: documentKeys,
      })
    } catch (error) {
      if (!signal.aborted) errorMessage.value = formatApiError(error, 'Erro ao cadastrar')
    }
  }


  return {
    currentPage,
    errorMessage,
    fieldErrors,
    showPassword,
    page1Form,
    page3Form,
    files,
    formatCNPJ,
    formatCPF,
    formatPhone,
    clearFieldError,
    isCNPJ,
    isCPF,
    minLengthField,
    isStrongPassword,
    passwordMatch,
    validatePassword,
    goToNextPage,
    goToPreviousPage,
    avancarParaVerificacao,
    handleSubmit,
    registerState,
    validateField,
    getCEP,
    formatCEP,
    clearErrors,
    isPasswordVisible,
    requiredField,
    isPhone,
    isEmail,
    isCEP,
    codigo,
    enviandoCodigo,
    erroCodigo,
    enviarCodigo,
    emailCodigo,
    cooldown,
    enviandoDocumentos,
  }
}
