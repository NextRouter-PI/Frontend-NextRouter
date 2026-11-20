<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DEFAULT_EMPTY_LABEL, ROUTE_PATHS, VERIFICATION_CODE_LENGTH } from '@/constants'
import { useSignUpCompanyForm } from '@/features/auth/composables/useSignUpCompanyForm'
import SignUpWizard from '@/features/auth/components/SignUpWizard.vue'
import SignUpReviewSection from '@/features/auth/components/SignUpReviewSection.vue'
import EmailVerificationStep from '@/features/auth/components/EmailVerificationStep.vue'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FileUploadField from '@/components/ui/FileUploadField.vue'

const {
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
  formatCEP,
  goToNextPage,
  goToPreviousPage,
  avancarParaVerificacao,
  handleSubmit,
  registerState,
  validateField,
  isCNPJ,
  isCPF,
  passwordMatch,
  isPasswordVisible,
  isStrongPassword,
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

const stepperCurrent = computed(() => (currentPage.value <= 2 ? currentPage.value : currentPage.value <= 4 ? 3 : 4))

const companyReviewItems = computed(() => [
  { label: 'Razão Social:', value: page1Form.legalName },
  { label: 'Nome Fantasia:', value: page1Form.tradeName },
  { label: 'CNPJ:', value: page1Form.cnpj },
  { label: 'Telefone:', value: page1Form.contactPhone || DEFAULT_EMPTY_LABEL },
  { label: 'E-mail:', value: page1Form.contactEmail || DEFAULT_EMPTY_LABEL },
  { label: 'Localização:', value: `${page1Form.city}, ${page1Form.state} - ${page1Form.cep}` },
])

const ceoReviewItems = computed(() => [
  { label: 'Nome do CEO/Diretor/Sócio:', value: page3Form.ceoName },
  { label: 'CPF:', value: page3Form.ceoCpf },
  { label: 'Senha:', value: '••••••••' },
])

const documentsReviewItems = computed(() => [
  { label: 'Contrato Social:', value: `✓ ${files.articlesOfAssociation.name}` },
  { label: 'Licença de Operação:', value: `✓ ${files.stateOperatingLicense.name}` },
  { label: 'Certidões Negativas:', value: `✓ ${files.certificateOfGoodStading.name}` },
])

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
    <div v-if="currentPage === 1" key="step-1">
      <h2 class="step-heading">Informações da <span class="step-accent">Empresa</span></h2>

      <BaseInput
        v-model="page1Form.legalName"
        label="Razão Social"
        maxlength="255"
        required
        placeholder="Digite a razão social da empresa"
        :disabled="registerState.state.loading"
        :error="fieldErrors.legalName"
        @input="clearFieldError('legalName')"
        @blur="validateField(page1Form.legalName, [(v) => requiredField(v, 'Razão Social')], 'legalName')"
      />

      <BaseInput
        v-model="page1Form.tradeName"
        label="Nome Fantasia"
        maxlength="255"
        required
        placeholder="Digite o nome fantasia da empresa"
        :disabled="registerState.state.loading"
        :error="fieldErrors.tradeName"
        @input="clearFieldError('tradeName')"
        @blur="validateField(page1Form.tradeName, [(v) => requiredField(v, 'Nome Fantasia')], 'tradeName')"
      />

      <BaseInput
        v-model="page1Form.cnpj"
        label="CNPJ"
        required
        only-numbers
        placeholder="00.000.000/0000-00"
        maxlength="18"
        :disabled="registerState.state.loading"
        :format="formatCNPJ"
        :error="fieldErrors.cnpj"
        @input="clearFieldError('cnpj')"
        @blur="validateField(page1Form.cnpj, [(v) => requiredField(v, 'CNPJ') || isCNPJ(v)], 'cnpj')"
      />

      <BaseInput
        v-model="page1Form.contactPhone"
        label="Telefone Comercial"
        only-numbers
        placeholder="(00) 90000-0000"
        maxlength="16"
        :disabled="registerState.state.loading"
        :format="formatPhone"
        :error="fieldErrors.contactPhone"
        @input="clearFieldError('contactPhone')"
        @blur="validateField(page1Form.contactPhone, [(v) => isPhone(v)], 'contactPhone')"
      />

      <BaseInput
        v-model="page1Form.contactEmail"
        label="E-mail Corporativo"
        type="email"
        placeholder="contato@empresa.com"
        :disabled="registerState.state.loading"
        :error="fieldErrors.contactEmail"
        @input="clearFieldError('contactEmail')"
        @blur="validateField(page1Form.contactEmail, [(v) => isEmail(v)], 'contactEmail')"
      />

      <AddressCepMapField
        v-model:cep="page1Form.cep"
        v-model:street="page1Form.street"
        v-model:number="page1Form.number"
        v-model:complement="page1Form.complement"
        v-model:neighborhood="page1Form.neighborhood"
        v-model:city="page1Form.city"
        v-model:state="page1Form.state"
        v-model:latitude="page1Form.latitude"
        v-model:longitude="page1Form.longitude"
        :disabled="registerState.state.loading"
        :cep-error="fieldErrors.cep"
        :format-cep="formatCEP"
        complement-placeholder="Sala, andar, galpão..."
        @cep-input="clearFieldError('cep')"
        @cep-blur="validateField(page1Form.cep, [(v) => requiredField(v, 'CEP') || isCEP(v)], 'cep')"
      />
    </div>

    <div v-else-if="currentPage === 2" key="step-2">
      <h2 class="step-heading">Documentação da <span class="step-accent">Empresa</span></h2>

      <BaseInput
        v-model="page1Form.stateRegistration"
        label="Inscrição Estadual"
        required
        placeholder="Digite a inscrição estadual"
        :disabled="registerState.state.loading"
        :error="fieldErrors.stateRegistration"
        @input="clearFieldError('stateRegistration')"
        @blur="validateField(page1Form.stateRegistration, [(v) => requiredField(v, 'Inscrição Estadual')], 'stateRegistration')"
      />

      <FileUploadField
        v-model="files.articlesOfAssociation.file"
        :file-name="files.articlesOfAssociation.name"
        label="Contrato Social"
        required
        accept=".pdf"
        :disabled="registerState.state.loading"
        :error="fieldErrors.articlesOfAssociation"
        hint="Formato aceito: PDF"
        @update:file-name="files.articlesOfAssociation.name = $event"
        @error="errorMessage = $event"
      />

      <FileUploadField
        v-model="files.stateOperatingLicense.file"
        :file-name="files.stateOperatingLicense.name"
        label="Licença de Operação Estadual"
        required
        accept=".pdf"
        :disabled="registerState.state.loading"
        :error="fieldErrors.stateOperatingLicense"
        hint="Formato aceito: PDF"
        @update:file-name="files.stateOperatingLicense.name = $event"
        @error="errorMessage = $event"
      />

      <FileUploadField
        v-model="files.certificateOfGoodStading.file"
        :file-name="files.certificateOfGoodStading.name"
        label="Certidões Negativas"
        required
        accept=".pdf"
        :disabled="registerState.state.loading"
        :error="fieldErrors.certificateOfGoodStading"
        hint="Formato aceito: PDF"
        @update:file-name="files.certificateOfGoodStading.name = $event"
        @error="errorMessage = $event"
      />

      <div class="info-box">
        <span class="mdi mdi-information-outline" aria-hidden="true"></span>
        <p>
          Os documentos fazem parte da moderação cadastral da empresa. Não há prazo de análise garantido.
        </p>
      </div>
    </div>

    <div v-else-if="currentPage === 3" key="step-3">
      <h2 class="step-heading">Responsável pela <span class="step-accent">Empresa</span></h2>

      <BaseInput
        v-model="page3Form.ceoName"
        label="Nome Completo do CEO / diretor / sócio administrador"
        required
        placeholder="Digite o nome completo"
        :disabled="registerState.state.loading"
        :error="fieldErrors.ceoName"
        @input="clearFieldError('ceoName')"
        @blur="validateField(page3Form.ceoName, [(v) => requiredField(v, 'Nome')], 'ceoName')"
      />

      <BaseInput
        v-model="page3Form.ceoCpf"
        label="CPF"
        required
        only-numbers
        placeholder="000.000.000-00"
        maxlength="14"
        :disabled="registerState.state.loading"
        :format="formatCPF"
        :error="fieldErrors.ceoCpf"
        @input="clearFieldError('ceoCpf')"
        @blur="validateField(page3Form.ceoCpf, [(v) => requiredField(v, 'CPF') || isCPF(v)], 'ceoCpf')"
      />

      <BaseInput
        v-model="page3Form.loginEmail"
        label="E-mail de Login"
        type="email"
        required
        autocomplete="email"
        placeholder="empresa@login.com"
        :disabled="registerState.state.loading"
        :error="fieldErrors.loginEmail"
        @input="clearFieldError('loginEmail')"
        @blur="validateField(page3Form.loginEmail, [(v) => requiredField(v, 'Email de login') || isEmail(v)], 'loginEmail')"
      />

      <BaseInput
        v-model="page3Form.password"
        type="password"
        label="Defina uma senha"
        required
        autocomplete="new-password"
        placeholder="Mínimo 8 caracteres, não só números"
        :disabled="registerState.state.loading"
        :show-password="isPasswordVisible"
        :error="fieldErrors.password"
        @update:show-password="showPassword"
        @input="clearFieldError('password')"
        @blur="validateField(page3Form.password, [(v) => requiredField(v, 'Senha') || isStrongPassword(v)], 'password')"
      />

      <BaseInput
        v-model="page3Form.passwordConfirm"
        type="password"
        label="Confirmar senha"
        required
        autocomplete="new-password"
        placeholder="Digite a senha novamente"
        :disabled="registerState.state.loading"
        :show-password="isPasswordVisible"
        :error="fieldErrors.passwordConfirm"
        @update:show-password="showPassword"
        @input="clearFieldError('passwordConfirm')"
        @blur="validateField(page3Form.passwordConfirm, [(v) => requiredField(v, 'Confirmação') || passwordMatch(v, page3Form.password)], 'passwordConfirm')"
      />
    </div>

    <div v-else-if="currentPage === 4" key="step-4">
      <h2 class="step-heading">Revisão do <span class="step-accent">Cadastro</span></h2>
      <SignUpReviewSection title="Informações da Empresa" :items="companyReviewItems" />
      <SignUpReviewSection title="Informações do Responsável" :items="ceoReviewItems" />
      <SignUpReviewSection title="Documentos" :items="documentsReviewItems" />
    </div>

    <EmailVerificationStep
      v-else-if="currentPage === 5"
      key="step-5"
      v-model="codigo"
      :email="emailCodigo"
      :cooldown="cooldown"
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
          Próximo <span class="mdi mdi-arrow-right" aria-hidden="true"></span>
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

.info-box {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  @include status-banner(var(--primary), var(--color-primary-soft));
  margin-top: $space-3;

  .mdi {
    font-size: 1.3rem;
    color: var(--primary);
    flex-shrink: 0;
  }
}

.company-actions {
  display: flex;
  gap: $space-3;

  > * {
    flex: 1;
  }
}
</style>
