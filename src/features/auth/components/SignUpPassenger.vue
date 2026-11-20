<script setup>
import { computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DEFAULT_EMPTY_LABEL, ROUTE_PATHS, VERIFICATION_CODE_LENGTH } from '@/constants'
import { useRegisterState } from '@/features/auth/composables/useRegisterState'
import { useSignUpPassengerDriverForm } from '@/features/auth/composables/useSignUpForm'
import { useEmailVerification } from '@/features/auth/composables/useEmailVerification'
import SignUpWizard from '@/features/auth/components/SignUpWizard.vue'
import PersonalSignUpFields from '@/features/auth/components/PersonalSignUpFields.vue'
import SignUpReviewSection from '@/features/auth/components/SignUpReviewSection.vue'
import EmailVerificationStep from '@/features/auth/components/EmailVerificationStep.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
const registerState = useRegisterState()
const {
  codigo,
  enviandoCodigo,
  erroCodigo,
  enviarCodigo,
  prepararVerificacao,
  codigoPara,
  cooldown,
  emailCodigo,
} = useEmailVerification()

const signUpHelpers = useSignUpPassengerDriverForm()
const {
  errorMessage,
  days,
  months,
  years,
  fieldErrors,
  validarFormulario,
  formatBirthday,
  currentPage,
  isPasswordVisible,
  showPassword,
} = signUpHelpers

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
    codigo.value = Array(VERIFICATION_CODE_LENGTH).fill('')
  },
)

const reviewItems = computed(() => [
  { label: 'Nome:', value: form.name },
  { label: 'CPF:', value: form.cpf },
  { label: 'E-mail:', value: form.email },
  { label: 'Localização:', value: `${form.city}, ${form.state} - ${form.cep}` },
  { label: 'Telefone:', value: form.phone || DEFAULT_EMPTY_LABEL },
  { label: 'Data de Nascimento:', value: `${form.day}/${form.month}/${form.year}` },
])

const activeErrors = computed(() => [erroCodigo.value, errorMessage.value, registerState.state.error])

function goBack() {
  router.push(ROUTE_PATHS.SIGNUP)
}

function avancarParaRevisao() {
  if (!validarFormulario(form)) return
  currentPage.value = 2
}

function voltarPagina() {
  if (enviandoCodigo.value || registerState.state.loading) return
  erroCodigo.value = ''
  registerState.reset()
  currentPage.value -= 1
}

async function avancarParaVerificacao() {
  const sucesso = await prepararVerificacao(form.email)
  if (sucesso) currentPage.value = 3
}

async function handleSubmit() {
  if (registerState.state.loading || currentPage.value !== 3) return
  if (!validarFormulario(form)) return

  const code = codigoPara(form.email)
  if (!code || enviandoCodigo.value) return
  await registerState.registerPassenger({ ...form, code, birthday: formatBirthday(form) })
}
</script>

<template>
  <SignUpWizard
    title-prefix="Cadastro "
    title-highlight="Passageiro"
    show-divider
    :success="registerState.state.success"
    success-message="Sua conta foi criada. O vínculo com uma empresa é solicitado separadamente."
    :errors="activeErrors"
    @back="goBack"
    @submit="handleSubmit"
  >
    <PersonalSignUpFields
      v-if="currentPage === 1"
      key="step-1"
      v-model:form="form"
      :field-errors="fieldErrors"
      :disabled="registerState.state.loading"
      :days="days"
      :months="months"
      :years="years"
      :is-password-visible="isPasswordVisible"
      :helpers="signUpHelpers"
      @toggle-password="showPassword"
    />

    <div v-else-if="currentPage === 2" key="step-2">
      <h2 class="step-heading">Revisão do <span class="step-accent">Cadastro</span></h2>
      <SignUpReviewSection title="Confirme as informações" :items="reviewItems" />
    </div>

    <EmailVerificationStep
      v-else-if="currentPage === 3"
      key="step-3"
      v-model="codigo"
      :email="emailCodigo"
      :cooldown="cooldown"
      :disabled="enviandoCodigo || registerState.state.loading"
      @resend="enviarCodigo(form.email)"
    />

    <template #actions>
      <BaseButton
        v-if="currentPage === 1"
        block
        size="lg"
        :loading="registerState.state.loading"
        @click="avancarParaRevisao"
      >
        Avançar
      </BaseButton>

      <BaseButton
        v-if="currentPage === 2"
        block
        size="lg"
        :loading="enviandoCodigo"
        @click="avancarParaVerificacao"
      >
        {{ enviandoCodigo ? 'Enviando código...' : 'Continuar' }}
      </BaseButton>

      <BaseButton
        v-if="currentPage === 3"
        type="submit"
        block
        size="lg"
        :loading="registerState.state.loading"
        :disabled="enviandoCodigo"
      >
        {{ registerState.state.loading ? 'Enviando cadastro...' : 'Confirmar e Criar Conta' }}
      </BaseButton>

      <BaseButton
        v-if="currentPage > 1"
        variant="outline"
        block
        :disabled="enviandoCodigo || registerState.state.loading"
        @click="voltarPagina"
      >
        Voltar e corrigir dados
      </BaseButton>
    </template>
  </SignUpWizard>
</template>

<style lang="scss" scoped>
.step-heading {
  font-size: 1.25rem;
  font-weight: $font-bold;
  text-align: center;
  margin-bottom: $space-4;
}

.step-accent {
  color: var(--primary);
}
</style>
