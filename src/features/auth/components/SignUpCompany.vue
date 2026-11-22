<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_PATHS, VERIFICATION_CODE_LENGTH } from '@/constants'
import { useSignUpCompanyForm } from '@/features/auth/composables/useSignUpCompanyForm'
import { buildCompanyReviewSections } from '@/features/auth/validators/companySignUpValidation'
import SignUpWizard from '@/features/auth/components/SignUpWizard.vue'
import SignUpReviewSection from '@/features/auth/components/SignUpReviewSection.vue'
import EmailVerificationStep from '@/features/auth/components/EmailVerificationStep.vue'
import CompanyInfoStep from '@/features/auth/components/company-steps/CompanyInfoStep.vue'
import CompanyDocumentsStep from '@/features/auth/components/company-steps/CompanyDocumentsStep.vue'
import CompanyOwnerStep from '@/features/auth/components/company-steps/CompanyOwnerStep.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const {
  currentPage, errorMessage, fieldErrors, page1Form, page3Form, files,
  clearFieldError, validateField, goToNextPage, goToPreviousPage,
  avancarParaVerificacao, handleSubmit, registerState,
  codigo, enviandoCodigo, erroCodigo, enviarCodigo, emailCodigo, cooldown, enviandoDocumentos,
} = useSignUpCompanyForm()

const router = useRouter()

watch(
  () => registerState.state.success,
  (success) => {
    if (!success) return
    page3Form.password = ''
    page3Form.passwordConfirm = ''
    codigo.value = Array(VERIFICATION_CODE_LENGTH).fill('')
  },
)

const stepperCurrent = computed(() =>
  currentPage.value <= 2 ? currentPage.value : currentPage.value <= 4 ? 3 : 4,
)
const reviewSections = computed(() => buildCompanyReviewSections({ page1Form, page3Form, files }))
const activeErrors = computed(() => [erroCodigo.value, errorMessage.value, registerState.state.error])

function goBack() {
  router.push(ROUTE_PATHS.SIGNUP)
}
</script>

<template>
  <SignUpWizard
    title-prefix="Cadastro de "
    title-highlight="Empresa"
    :stepper-steps="3"
    :stepper-current="stepperCurrent"
    :success="registerState.state.success"
    success-title="Conta empresarial criada!"
    success-message="O cadastro da empresa aguarda moderação. Criar a conta não significa aprovação nem cria vínculos."
    :errors="activeErrors"
    @back="goBack"
    @submit="handleSubmit"
  >
    <CompanyInfoStep
      v-if="currentPage === 1"
      key="step-1"
      v-model:form="page1Form"
      :field-errors="fieldErrors"
      :disabled="registerState.state.loading"
      :validate-field="validateField"
      :clear-field-error="clearFieldError"
    />

    <CompanyDocumentsStep
      v-else-if="currentPage === 2"
      key="step-2"
      v-model:form="page1Form"
      v-model:files="files"
      :field-errors="fieldErrors"
      :disabled="registerState.state.loading"
      :validate-field="validateField"
      :clear-field-error="clearFieldError"
      @file-error="errorMessage = $event"
    />

    <CompanyOwnerStep
      v-else-if="currentPage === 3"
      key="step-3"
      v-model:form="page3Form"
      :field-errors="fieldErrors"
      :disabled="registerState.state.loading"
      :validate-field="validateField"
      :clear-field-error="clearFieldError"
    />

    <div v-else-if="currentPage === 4" key="step-4">
      <h2 class="step-heading">Revisão do <span class="step-accent">Cadastro</span></h2>
      <SignUpReviewSection title="Informações da Empresa" :items="reviewSections.company" />
      <SignUpReviewSection title="Informações do Responsável" :items="reviewSections.ceo" />
      <SignUpReviewSection title="Documentos" :items="reviewSections.documents" />
    </div>

    <EmailVerificationStep
      v-else-if="currentPage === 5"
      key="step-5"
      v-model="codigo"
      :email="emailCodigo"
      :cooldown="cooldown"
      :loading="enviandoCodigo"
      :disabled="enviandoCodigo || registerState.state.loading"
      @resend="enviarCodigo(page3Form.loginEmail)"
    />

    <template #actions>
      <div class="company-actions">
        <BaseButton
          v-if="currentPage > 1"
          variant="outline"
          icon="mdi-arrow-left"
          :disabled="enviandoDocumentos || enviandoCodigo || registerState.state.loading"
          @click="goToPreviousPage"
        >
          Voltar
        </BaseButton>

        <BaseButton
          v-if="currentPage < 4"
          :disabled="registerState.state.loading"
          @click="goToNextPage"
        >
          Próximo <BaseIcon name="mdi-arrow-right" />
        </BaseButton>

        <BaseButton
          v-if="currentPage === 4"
          :loading="enviandoDocumentos || enviandoCodigo"
          @click="avancarParaVerificacao"
        >
          {{ enviandoDocumentos ? 'Enviando documentos...' : enviandoCodigo ? 'Enviando código...' : 'Continuar' }}
        </BaseButton>

        <BaseButton
          v-if="currentPage === 5"
          type="submit"
          :loading="registerState.state.loading"
          :disabled="enviandoCodigo"
        >
          {{ registerState.state.loading ? 'Enviando cadastro...' : 'Confirmar e Enviar Cadastro' }}
        </BaseButton>
      </div>
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

.company-actions {
  display: flex;
  gap: $space-3;

  > * {
    flex: 1;
  }
}
</style>
