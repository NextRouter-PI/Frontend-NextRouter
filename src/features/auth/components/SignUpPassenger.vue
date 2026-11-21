<script setup>
import { usePersonalSignUpFlow } from '@/features/auth/composables/usePersonalSignUpFlow'
import SignUpWizard from '@/features/auth/components/SignUpWizard.vue'
import PersonalSignUpFields from '@/features/auth/components/PersonalSignUpFields.vue'
import SignUpReviewSection from '@/features/auth/components/SignUpReviewSection.vue'
import EmailVerificationStep from '@/features/auth/components/EmailVerificationStep.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

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
