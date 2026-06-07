import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterState } from '@/store/useRegisterState'
import { useValidator } from '@/composables/useValidation'
import { useInputFormat } from '@/composables/useInputFormat'

const router = useRouter()


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


  const page1Form = reactive({
    legalName: '',
    tradeName: '',
    cnpj: '',
    contactPhone: '',
    contactEmail: '',
    city: '',
    state: '',
    cep: '',
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
      { fn: () => requiredField(files.articlesOfAssociation.file, 'Contrato Social'), field: 'articlesOfAssociation' },
      { fn: () => requiredField(files.stateOperatingLicense.file, 'Licença de Operação'), field: 'stateOperatingLicense' },
      { fn: () => requiredField(files.certificateOfGoodStading.file, 'Certidões Negativas'), field: 'certificateOfGoodStading' },
    ])
  }

  function validatePage3() {
    return validateForm([
      { fn: () => requiredField(page3Form.ceoName, 'Nome'), field: 'ceoName' },
      { fn: () => requiredField(page3Form.ceoCpf, 'CPF') || isCPF(page3Form.ceoCpf), field: 'ceoCpf' },
      { fn: () => requiredField(page3Form.loginEmail || isEmail(page3Form.loginEmail), 'Email de login'), field: 'loginEmail' },
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
    * Função que intecepta o submit do formulário html
  */
  async function handleSubmit() {
    clearErrors()
    if (!validatePage1()) return
    if (!validatePage2()) return
    if (!validatePage3()) return

    try {

      // * Criação do objeto a ser enviado para api
      const formData = new FormData()

      formData.append('user_data.email', page3Form.loginEmail)
      formData.append('user_data.password', page3Form.password)
      formData.append('user_data.name', page3Form.ceoName)
      formData.append('user_data.cep', page1Form.cep)
      formData.append('user_data.cpf', page3Form.ceoCpf)
      formData.append('cnpj', page1Form.cnpj.replace(/[^\d]/g, ''))
      formData.append('trade_name', page1Form.tradeName)
      formData.append('legal_name', page1Form.legalName)

      // ! Os valores as propriedades 'page1Form.state' e 'page1Form.city' não são armazenados no banco e são exclusivamente recursos visuais
      // TODO; Salvar valores das váriaveis 'page1Form.state' e 'page1Form.city' no banco futuramente para facilitar a busca de empresas dentro da aba de busca do site

      if (files.articlesOfAssociation) formData.append('articles_of_association_document.file', files.articlesOfAssociation.file)

      if (files.stateOperatingLicense) formData.append('state_operating_license_document.file', files.stateOperatingLicense.file)

      if (files.certificateOfGoodStading) formData.append('certificate_of_good_stading_document.file', files.certificateOfGoodStading.file)

      // Requisição
      await registerState.registerCompany(formData)

      if (registerState.state.success) router.push('/login') // * Se a requisição for um sucesso redireciona o usuário para página de login

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
    isCEP
  }
}
