import { ref, reactive } from 'vue'
import { useRegisterState } from '@/stores/useRegisterState'
import { useValidator } from '@/composables/useValidation'
import { useInputFormat } from '@/composables/useInputFormat'
import { useEmailVerification } from '@/composables/useEmailVerification'
import { uploadDocument } from '@/api/upload'

const registerState = useRegisterState()


const {
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP
} = useInputFormat()


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
  passwordMatch,
  getCEP,
  requiredField,
  isCEP,
  isEmail,
  isPhone
} = useValidator()


export function useSignUpCompanyForm() {

  const currentPage = ref(1)


  const isPasswordVisible = ref(false)

  const { codigo, enviandoCodigo, erroCodigo, enviarCodigo, codigoCompleto, cooldown } = useEmailVerification()
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
    if (currentPage.value > 1) currentPage.value--
  }


  /*
    * Envia os 3 documentos e o código de verificação de e-mail antes da revisão final.
  */
  async function avancarParaVerificacao() {
    clearErrors()
    if (!validatePage1()) return
    if (!validatePage2()) return
    if (!validatePage3()) return

    enviandoDocumentos.value = true
    try {
      const [articles, license, certificate] = await Promise.all([
        uploadDocument(files.articlesOfAssociation.file, `Contrato social de ${page1Form.tradeName}`),
        uploadDocument(files.stateOperatingLicense.file, `Licença de operação de ${page1Form.tradeName}`),
        uploadDocument(files.certificateOfGoodStading.file, `Certidões negativas de ${page1Form.tradeName}`),
      ])
      documentKeys.articlesOfAssociation = articles.data.attachment_key
      documentKeys.stateOperatingLicense = license.data.attachment_key
      documentKeys.certificateOfGoodStading = certificate.data.attachment_key
    } catch (error) {
      errorMessage.value = 'Não foi possível enviar os documentos. Verifique se todos são PDFs válidos.'
      enviandoDocumentos.value = false
      return
    }
    enviandoDocumentos.value = false

    const sucesso = await enviarCodigo(page3Form.loginEmail.trim().toLowerCase())
    if (sucesso) currentPage.value = 5
  }

  /*
    * Função que intecepta o submit do formulário html
  */
  async function handleSubmit() {
    if (codigoCompleto().length !== 6) {
      erroCodigo.value = 'Digite o código completo de 6 dígitos.'
      return
    }

    try {

      // * Criação do objeto a ser enviado para api
      const formData = new FormData()

      formData.append('user_data.email', page3Form.loginEmail)
      formData.append('user_data.password', page3Form.password)
      formData.append('user_data.name', page3Form.ceoName)
      formData.append('user_data.cpf', page3Form.ceoCpf)
      formData.append('user_data.code', codigoCompleto())
      formData.append('cnpj', page1Form.cnpj.replace(/[^\d]/g, ''))
      formData.append('trade_name', page1Form.tradeName)
      formData.append('legal_name', page1Form.legalName)
      formData.append('state_registration', page1Form.stateRegistration)
      formData.append('contact_phone', page1Form.contactPhone.replace(/\D/g, ''))
      formData.append('contact_email', page1Form.contactEmail)
      formData.append('cep', page1Form.cep)
      formData.append('street', page1Form.street)
      formData.append('number', page1Form.number)
      formData.append('complement', page1Form.complement)
      formData.append('neighborhood', page1Form.neighborhood)
      formData.append('city', page1Form.city)
      formData.append('state', page1Form.state)

      formData.append('articles_of_association_document', documentKeys.articlesOfAssociation)
      formData.append('state_operating_license_document', documentKeys.stateOperatingLicense)
      formData.append('certificate_of_good_stading_document', documentKeys.certificateOfGoodStading)

      // Requisição
      await registerState.registerCompany(formData)

      if (registerState.state.error) errorMessage.value =
        typeof registerState.state.error === 'string'
          ? registerState.state.error
          : JSON.stringify(registerState.state.error)

      // * Erro de servidor ou de internet
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
    cooldown,
    enviandoDocumentos,
  }
}
