<script setup>
import { onScopeDispose } from 'vue'
import { usePersonalSignUpFlow } from '@/features/auth/composables/usePersonalSignUpFlow'
import { useDriverCnhUpload } from '@/features/auth/composables/useDriverCnhUpload'
import SignUpWizard from '@/features/auth/components/SignUpWizard.vue'
import PersonalSignUpFields from '@/features/auth/components/PersonalSignUpFields.vue'
import SignUpReviewSection from '@/features/auth/components/SignUpReviewSection.vue'
import EmailVerificationStep from '@/features/auth/components/EmailVerificationStep.vue'
import PersonalSignUpActions from '@/features/auth/components/PersonalSignUpActions.vue'
import FileUploadField from '@/components/ui/FileUploadField.vue'

const controller = new AbortController()
const { signal } = controller
onScopeDispose(() => controller.abort())

let cnhState = null

const {
  form,
  registerState,
  emailVerification: { codigo, enviandoCodigo, enviarCodigo, prepararVerificacao, codigoPara, cooldown, emailCodigo },
  signUp: { errorMessage, days, months, years, fieldErrors, validarFormulario, formatBirthday, currentPage, validateField, clearFieldError, clearBirthdayErrors },
  reviewItems,
  activeErrors,
  goBack,
  avancarParaRevisao,
  voltarPagina,
} = usePersonalSignUpFlow({
  extraBusyRef: { get value() { return Boolean(cnhState?.enviandoDocumento.value) } },
  extraReviewItems: () => (cnhState?.cnh.name ? [{ label: 'CNH:', value: `✓ ${cnhState.cnh.name}` }] : []),
})

cnhState = useDriverCnhUpload({ signal, errorMessage, getDriverName: () => form.name })
const { cnh, cnhAttachmentKey, enviandoDocumento, ensureCnhUploaded } = cnhState

async function avancarParaVerificacao() {
  if (signal.aborted || enviandoDocumento.value || enviandoCodigo.value || currentPage.value !== 2) return
  if (!(await ensureCnhUploaded())) return
  if ((await prepararVerificacao(form.email)) && !signal.aborted) currentPage.value = 3
}

async function handleSubmit() {
  if (signal.aborted || registerState.state.loading || currentPage.value !== 3) return
  if (!validarFormulario(form)) return
  const code = codigoPara(form.email)
  if (!code || enviandoCodigo.value) return
  await registerState.registerDriver({
    ...form,
    code,
    birthday: formatBirthday(form),
    cnh: cnhAttachmentKey.value || null,
  })
}
</script>

<template>
  <SignUpWizard
    title-prefix="Cadastro "
    title-highlight="Motorista"
    show-divider
    :success="registerState.state.success"
    success-message="Seu perfil de motorista foi criado. O vínculo com uma empresa é solicitado separadamente."
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
    >
      <template #extra-fields>
        <FileUploadField
          v-model="cnh.file"
          v-model:file-name="cnh.name"
          label="Arquivo CNH"
          accept=".pdf"
          :disabled="registerState.state.loading"
          hint="Opcional. Formato aceito: PDF, até 10 MB."
          :error="fieldErrors.cnh"
          @error="errorMessage = $event"
        />
      </template>
    </PersonalSignUpFields>

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
      :loading="enviandoCodigo"
      :disabled="enviandoCodigo || registerState.state.loading"
      @resend="enviarCodigo(form.email)"
    />

    <template #actions>
      <PersonalSignUpActions
        :current-page="currentPage"
        :loading="registerState.state.loading"
        :sending-code="enviandoCodigo"
        :step2-loading="enviandoDocumento || enviandoCodigo"
        :step2-label="enviandoDocumento ? 'Enviando CNH...' : enviandoCodigo ? 'Enviando código...' : 'Continuar'"
        :back-disabled="enviandoDocumento || enviandoCodigo || registerState.state.loading"
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
