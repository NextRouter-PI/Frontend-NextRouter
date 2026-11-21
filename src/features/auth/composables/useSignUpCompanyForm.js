import { onScopeDispose, reactive, shallowRef } from 'vue'
import { useRegisterState } from '@/features/auth/composables/useRegisterState'
import { useValidator } from '@/composables/useValidation'
import { useEmailVerification } from '@/features/auth/composables/useEmailVerification'
import { useCompanyDocumentsUpload } from '@/features/auth/composables/useCompanyDocumentsUpload'
import {
  validateCompanyPage1,
  validateCompanyPage2,
  validateCompanyPage3,
} from '@/features/auth/validators/companySignUpValidation'
import { formatApiError } from '@/utils/apiErrors'

export function useSignUpCompanyForm() {
  const registerState = useRegisterState()
  const { errorMessage, fieldErrors, clearErrors, clearFieldError, validateForm, validateField } = useValidator()
  const controller = new AbortController()
  const { signal } = controller
  onScopeDispose(() => controller.abort())

  const currentPage = shallowRef(1)
  const isPasswordVisible = shallowRef(false)
  const emailVerification = useEmailVerification()
  const { enviandoDocumentos, documentKeys, uploadAllDocuments } = useCompanyDocumentsUpload({ signal })

  const page1Form = reactive({
    legalName: '', tradeName: '', cnpj: '', contactPhone: '', contactEmail: '',
    cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
    latitude: null, longitude: null, stateRegistration: '',
  })

  const files = reactive({
    articlesOfAssociation: { file: null, name: 'Nenhum arquivo selecionado' },
    stateOperatingLicense: { file: null, name: 'Nenhum arquivo selecionado' },
    certificateOfGoodStading: { file: null, name: 'Nenhum arquivo selecionado' },
  })

  const page3Form = reactive({
    ceoName: '', ceoCpf: '', loginEmail: '', password: '', passwordConfirm: '',
  })

  function goToNextPage() {
    clearErrors()
    if (currentPage.value === 1 && validateCompanyPage1(validateForm, page1Form)) { currentPage.value++; return }
    if (currentPage.value === 2 && validateCompanyPage2(validateForm, page1Form, files)) { currentPage.value++; return }
    if (currentPage.value === 3 && validateCompanyPage3(validateForm, page3Form)) { currentPage.value++ }
  }

  function showPassword() {
    isPasswordVisible.value = !isPasswordVisible.value
  }

  function goToPreviousPage() {
    if (enviandoDocumentos.value || emailVerification.enviandoCodigo.value || registerState.state.loading) return
    emailVerification.erroCodigo.value = ''
    registerState.reset()
    if (currentPage.value > 1) currentPage.value--
  }

  async function avancarParaVerificacao() {
    if (signal.aborted || enviandoDocumentos.value || emailVerification.enviandoCodigo.value) return
    if (currentPage.value !== 4) return
    clearErrors()
    if (!validateCompanyPage1(validateForm, page1Form)) return
    if (!validateCompanyPage2(validateForm, page1Form, files)) return
    if (!validateCompanyPage3(validateForm, page3Form)) return

    const uploadResult = await uploadAllDocuments({ files, tradeName: page1Form.tradeName })
    if (!uploadResult.ok) {
      if (uploadResult.error) errorMessage.value = uploadResult.error
      return
    }
    const sucesso = await emailVerification.prepararVerificacao(page3Form.loginEmail)
    if (sucesso && !signal.aborted) currentPage.value = 5
  }

  async function handleSubmit() {
    if (signal.aborted || registerState.state.loading || currentPage.value !== 5) return
    const code = emailVerification.codigoPara(page3Form.loginEmail)
    if (!code || emailVerification.enviandoCodigo.value) return
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
    isPasswordVisible,
    showPassword,
    page1Form,
    page3Form,
    files,
    clearFieldError,
    validateField,
    goToNextPage,
    goToPreviousPage,
    avancarParaVerificacao,
    handleSubmit,
    registerState,
    enviandoDocumentos,
    ...emailVerification,
  }
}
