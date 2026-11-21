<script setup>
import { usePersonalSignUpFlow } from '@/features/auth/composables/usePersonalSignUpFlow'
import SignUpWizard from '@/features/auth/components/SignUpWizard.vue'
import PersonalSignUpFields from '@/features/auth/components/PersonalSignUpFields.vue'
import SignUpReviewSection from '@/features/auth/components/SignUpReviewSection.vue'
import EmailVerificationStep from '@/features/auth/components/EmailVerificationStep.vue'
import PersonalSignUpActions from '@/features/auth/components/PersonalSignUpActions.vue'

const {
  form,
  registerState,
  emailVerification: { codigo, enviandoCodigo, enviarCodigo, prepararVerificacao, codigoPara, cooldown, emailCodigo },
  signUp: { days, months, years, fieldErrors, validarFormulario, formatBirthday, currentPage, validateField, clearFieldError, clearBirthdayErrors },
  reviewItems,
  activeErrors,
  goBack,
  avancarParaRevisao,
  voltarPagina,
} = usePersonalSignUpFlow()

async function avancarParaVerificacao() {
  if (await prepararVerificacao(form.email)) currentPage.value = 3
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
      :validate-field="validateField"
      :clear-field-error="clearFieldError"
      :clear-birthday-errors="clearBirthdayErrors"
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
      <PersonalSignUpActions
        :current-page="currentPage"
        :loading="registerState.state.loading"
        :sending-code="enviandoCodigo"
        :step2-loading="enviandoCodigo"
        :step2-label="enviandoCodigo ? 'Enviando código...' : 'Continuar'"
        :back-disabled="enviandoCodigo || registerState.state.loading"
        @next="avancarParaRevisao"
        @continue="avancarParaVerificacao"
        @back="voltarPagina"
      />
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
