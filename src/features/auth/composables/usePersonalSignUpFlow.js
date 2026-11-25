import { computed, reactive, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DEFAULT_EMPTY_LABEL, ROUTE_PATHS, VERIFICATION_CODE_LENGTH } from '@/constants'
import { useRegisterState } from '@/features/auth/composables/useRegisterState'
import { useSignUpPassengerDriverForm } from '@/features/auth/composables/useSignUpForm'
import { useEmailVerification } from '@/features/auth/composables/useEmailVerification'

export function usePersonalSignUpFlow({ extraBusyRef = null, extraReviewItems = () => [] } = {}) {
  const router = useRouter()
  const registerState = useRegisterState()
  const emailVerification = useEmailVerification()
  const signUp = useSignUpPassengerDriverForm()

  // Etapas do formulário: 1 dados pessoais, 2 localização, 3 acesso (e-mail e senha).
  const formStep = shallowRef(1)
  const STEP_LABELS = ['Seus dados', 'Localização', 'Acesso', 'Revisão', 'Confirmação']
  const stepperCurrent = computed(() =>
    signUp.currentPage.value === 1 ? formStep.value : signUp.currentPage.value + 2,
  )

  const form = reactive({
    name: '',
    day: '',
    month: '',
    year: '',
    cpf: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    latitude: null,
    longitude: null,
  })

  watch(
    () => registerState.state.success,
    (success) => {
      if (!success) return
      form.password = ''
      form.confirmPassword = ''
      emailVerification.codigo.value = Array(VERIFICATION_CODE_LENGTH).fill('')
    },
  )

  const reviewItems = computed(() => [
    { label: 'Nome:', value: form.name },
    { label: 'CPF:', value: form.cpf },
    { label: 'E-mail:', value: form.email },
    { label: 'Localização:', value: `${form.city}, ${form.state} - ${form.cep}` },
    { label: 'Telefone:', value: form.phone || DEFAULT_EMPTY_LABEL },
    { label: 'Data de Nascimento:', value: `${form.day}/${form.month}/${form.year}` },
    ...extraReviewItems(),
  ])

  const activeErrors = computed(() => [
    emailVerification.erroCodigo.value,
    signUp.errorMessage.value,
    registerState.state.error,
  ])

  function goBack() {
    router.push(ROUTE_PATHS.SIGNUP)
  }

  function avancarParaRevisao() {
    if (!signUp.validarEtapa(form, formStep.value)) return
    if (formStep.value < 3) {
      formStep.value += 1
      return
    }
    if (!signUp.validarFormulario(form)) return
    signUp.currentPage.value = 2
  }

  function voltarEtapa() {
    if (formStep.value > 1) formStep.value -= 1
  }

  function voltarPagina() {
    if (extraBusyRef?.value || emailVerification.enviandoCodigo.value || registerState.state.loading) return
    emailVerification.erroCodigo.value = ''
    registerState.reset()
    signUp.currentPage.value -= 1
  }

  return {
    form,
    registerState,
    emailVerification,
    signUp,
    reviewItems,
    activeErrors,
    goBack,
    avancarParaRevisao,
    voltarPagina,
    formStep,
    voltarEtapa,
    stepperCurrent,
    stepLabels: STEP_LABELS,
  }
}
