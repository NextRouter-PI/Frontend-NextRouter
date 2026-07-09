<script setup>
import { useSignUpCompanyForm } from '@/composables/useSignUpCompanyForm'
import { useRouter } from 'vue-router'
import FormField from '@/components/ui/FormField.vue'
import FormattedField from '@/components/ui/FormattedField.vue'
import FileUploadField from '@/components/ui/FileUploadField.vue'
import PasswordFieldSignUp from '@/components/ui/PasswordFieldSignUp.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

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
  handleSubmit,
  registerState,
  validateField,
  isCNPJ,
  isCPF,
  passwordMatch,
  getCEP,
  isPasswordVisible,
  minLengthField,
  requiredField,
  isPhone,
  isEmail,
  isCEP,
} = useSignUpCompanyForm()

const router = useRouter()

const goBack = () => {
  router.push('/signup');
}
</script>

<template>
  <section class="form-container">
    <button class="btn-back-top" @click="goBack" aria-label="Voltar">
      <span class="mdi mdi-arrow-left"></span>
    </button>
    <div class="header">
      <span class="mdi mdi-domain"></span>
      <h2>Bem vindo</h2>
      <h1><span>EMPRESA</span></h1>
    </div>

    <div v-if="registerState.state.success" class="success-message">
      <span class="mdi mdi-check-circle"></span>
      <p class="success-title">Cadastro enviado com sucesso!</p>
      <p>Sua empresa será verificada pela nossa equipe. Você receberá um email em breve com o resultado da análise.</p>
      <div class="loading-spinner">
        <span class="mdi mdi-loading mdi-spin"></span> Redirecionando...
      </div>
    </div>

    <form v-else class="signup-form" @submit.prevent="handleSubmit">
      <div v-if="currentPage === 1">
        <h2 class="page-title">Informações da <span class="highlight-orange">Empresa</span></h2>

        <FormField
          v-model="page1Form.legalName"
          label="Razão Social"
          maxlength="255"
          required
          placeholder="Digite a razão social da empresa"
          :disabled="registerState.state.loading"
          :error="fieldErrors.legalName"
          @input="clearFieldError('legalName')"
          @blur="
            validateField(
              page1Form.legalName,
              [(v) => requiredField(v, 'Razão Social')],
              'legalName',
            )
          "
        />
        <FormField
          v-model="page1Form.tradeName"
          label="Nome Fantasia"
          maxlength="255"
          required
          placeholder="Digite o nome fantasia da empresa"
          :disabled="registerState.state.loading"
          :error="fieldErrors.tradeName"
          @input="clearFieldError('tradeName')"
          @blur="
            validateField(
              page1Form.nomeFantasia,
              [(v) => requiredField(v, 'Nome Fantasia')],
              'tradeName',
            )
          "
        />
        <FormattedField
          v-model="page1Form.cnpj"
          label="CNPJ"
          required
          :only-numbers="true"
          placeholder="00.000.000/0000-00"
          maxlength="18"
          :disabled="registerState.state.loading"
          :format="formatCNPJ"
          :error="fieldErrors.cnpj"
          @input="clearFieldError('cnpj')"
          @blur="
            validateField(page1Form.cnpj, [(v) => requiredField(v, 'CNPJ') || isCNPJ(v)], 'cnpj')
          "
        />
        <FormattedField
          v-model="page1Form.contactPhone"
          label="Telefone Comercial"
          :only-numbers="true"
          placeholder="(00) 90000-0000"
          maxlength="16"
          :disabled="registerState.state.loading"
          :format="formatPhone"
          :error="fieldErrors.contactPhone"
          @input="clearFieldError('contactPhone')"
          @blur="validateField(page1Form.contactPhone, [(v) => isPhone(v)], 'contactPhone')"
        />
        <FormField
          v-model="page1Form.contactEmail"
          label="E-mail Corporativo"
          type="email"
          placeholder="contato@empresa.com"
          :disabled="registerState.state.loading"
          :error="fieldErrors.contactEmail"
          @input="clearFieldError('contactEmail')"
          @blur="validateField(page1Form.contactEmail, [(v) => isEmail(v)], 'contactEmail')"
        />

        <FormattedField
          v-model="page1Form.cep"
          label="CEP"
          required
          :error="fieldErrors.cep"
          :only-numbers="true"
          placeholder="00000-000"
          :disabled="registerState.state.loading"
          maxlength="9"
          :format="formatCEP"
          @input="
            () => {
              clearFieldError('cep')
              if (page1Form.cep.length === 9) {
                getCEP(page1Form)
              }
            }
          "
          @blur="validateField(page1Form.cep, [(v) => requiredField(v, 'CEP') || isCEP(v)], 'cep')"
        />
        <div class="row-fields">
          <FormField
            v-model="page1Form.city"
            label="Cidade"
            placeholder="Cidade do CEP"
            disabled
            class="half"
          />
          <FormField
            v-model="page1Form.state"
            label="Estado"
            placeholder="UF do CEP"
            disabled
            class="half"
          />
        </div>
      </div>

      <div v-if="currentPage === 2">
        <h2 class="page-title">Documentação da <span class="highlight-orange">Empresa</span></h2>

        <FormField
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
          :fileName="files.articlesOfAssociation.name"
          label="Contrato Social"
          required
          accept=".pdf,.jpg,.jpeg,.png"
          :disabled="registerState.state.loading"
          :error="fieldErrors.articlesOfAssociation"
          hint="Formatos aceitos: PDF, JPG, JPEG, PNG (máx. 10MB)"
          @update:fileName="files.articlesOfAssociation.name = $event"
          @error="errorMessage = $event"
        />

        <FileUploadField
          v-model="files.stateOperatingLicense.file"
          :fileName="files.stateOperatingLicense.name"
          label="Licença de Operação Estadual"
          required
          accept=".pdf,.jpg,.jpeg,.png"
          :disabled="registerState.loading"
          :error="fieldErrors.stateOperatingLicense"
          hint="Formatos aceitos: PDF, JPG, JPEG, PNG (máx. 10MB)"
          @update:fileName="files.stateOperatingLicense.name = $event"
          @error="errorMessage = $event"
        />

        <FileUploadField
          v-model="files.certificateOfGoodStading.file"
          :fileName="files.certificateOfGoodStading.name"
          label="Certidões Negativas"
          required
          accept=".pdf,.jpg,.jpeg,.png"
          :disabled="registerState.state.loading"
          :error="fieldErrors.certificateOfGoodStading"
          hint="Formatos aceitos: PDF, JPG, JPEG, PNG (máx. 10MB)"
          @update:fileName="files.certificateOfGoodStading.name = $event"
          @error="errorMessage = $event"
        />

        <div class="info-box">
          <span class="mdi mdi-information-outline"></span>
          <p>
            Os documentos enviados serão analisados pela nossa equipe. O processo pode levar até 48
            horas úteis.
          </p>
        </div>
      </div>

      <div v-if="currentPage === 3">
        <h2 class="page-title">Responsável pela <span class="highlight-orange">Empresa</span></h2>

        <FormField
          v-model="page3Form.ceoName"
          label="Nome Completo do CEO / diretor / sócio administrador"
          required
          placeholder="Digite o nome completo"
          :disabled="registerState.state.loading"
          :error="fieldErrors.ceoName"
          @input="clearFieldError('ceoName')"
          @blur="validateField(page3Form.ceoName, [(v) => required(v, 'Nome')], 'ceoName')"
        />
        <FormattedField
          v-model="page3Form.ceoCpf"
          label="CPF"
          required
          placeholder="000.000.000-00"
          maxlength="14"
          :disabled="registerState.state.loading"
          :format="formatCPF"
          :error="fieldErrors.ceoCpf"
          @input="clearFieldError('ceoCpf')"
          @blur="validateField(page3Form.ceoCpf, [(v) => required(v, 'CPF') || isCPF(v)], 'ceoCpf')"
        />
        <FormField
          v-model="page3Form.loginEmail"
          label="E-mail de Login"
          type="email"
          required
          placeholder="empresa@login.com"
          :disabled="registerState.state.loading"
          :error="fieldErrors.loginEmail"
          @input="clearFieldError('loginEmail')"
          @blur="
            validateField(
              page3Form.loginEmail,
              [(v) => required(v, 'Email de login') || isEmail(v)],
              'loginEmail',
            )
          "
        />
        <PasswordFieldSignUp
          v-model="page3Form.password"
          label="Defina uma senha"
          required
          placeholder="Mínimo 6 caracteres"
          :disabled="registerState.state.loading"
          :show-password="isPasswordVisible"
          :error="fieldErrors.password"
          @update:show-password="showPassword"
          @input="clearFieldError('password')"
          @blur="
            validateField(
              page3Form.password,
              [(v) => required(v, 'Senha') || minLengthField(v, 6, 'Senha')],
              'password',
            )
          "
        />
        <PasswordFieldSignUp
          v-model="page3Form.passwordConfirm"
          label="Confirmar senha"
          required
          placeholder="Digite a senha novamente"
          :disabled="registerState.state.loading"
          :show-password="isPasswordVisible"
          @update:show-password="showPassword"
          :error="fieldErrors.passwordConfirm"
          @input="clearFieldError('passwordConfirm')"
          @blur="
            validateField(
              page3Form.passwordConfirm,
              [(v) => required(v, 'Confirmação') || passwordMatch(v, page3Form.password, 'Senhas')],
              'passwordConfirm',
            )
          "
        />
      </div>

      <div v-if="currentPage === 4">
        <h2 class="page-title">Revisão do <span class="highlight-orange">Cadastro</span></h2>

        <div class="review-section">
          <h3>Informações da Empresa</h3>
          <div class="review-item">
            <span class="label">Razão Social:</span>
            <span class="value">{{ page1Form.legalName }}</span>
          </div>
          <div class="review-item">
            <span class="label">Nome Fantasia:</span>
            <span class="value">{{ page1Form.tradeName }}</span>
          </div>
          <div class="review-item">
            <span class="label">CNPJ:</span>
            <span class="value">{{ page1Form.cnpj }}</span>
          </div>
          <div class="review-item">
            <span class="label">Telefone:</span>
            <span class="value">{{ page1Form.contactPhone || 'Nenhum telefone informado' }}</span>
          </div>
          <div class="review-item">
            <span class="label">E-mail:</span>
            <span class="value">{{ page1Form.contactEmail || 'Nenhum email informado' }}</span>
          </div>
          <div class="review-item">
            <span class="label">Localização:</span>
            <span class="value"
              >{{ page1Form.city }}, {{ page1Form.state }} - {{ page1Form.cep }}</span
            >
          </div>
        </div>

        <div class="review-section">
          <h3>Informações do Responsável</h3>
          <div class="review-item">
            <span class="label">Nome do CEO/Diretor/Sócio:</span>
            <span class="value">{{ page3Form.ceoName }}</span>
          </div>
          <div class="review-item">
            <span class="label">CPF:</span>
            <span class="value">{{ page3Form.ceoCpf }}</span>
          </div>
          <div class="review-item">
            <span class="label">Senha:</span>
            <span class="value">••••••••</span>
          </div>
        </div>

        <div class="review-section">
          <h3>Documentos</h3>
          <div class="review-item">
            <span class="label">Contrato Social:</span>
            <span class="value">✓ {{ files.articlesOfAssociation.name }}</span>
          </div>
          <div class="review-item">
            <span class="label">Licença de Operação:</span>
            <span class="value">✓ {{ files.stateOperatingLicense.name }}</span>
          </div>
          <div class="review-item">
            <span class="label">Certidões Negativas:</span>
            <span class="value">✓ {{ files.certificateOfGoodStading.name }}</span>
          </div>
        </div>
      </div>

      <ErrorMessage :message="errorMessage" />
      <ErrorMessage v-if="registerState.state.error" :message="registerState.state.error" />

      <div class="button-group">
        <button
          v-if="currentPage > 1 && currentPage < 4"
          type="button"
          class="btn-back"
          @click="goToPreviousPage"
          :disabled="registerState.state.loading"
        >
          <span class="mdi mdi-arrow-left"></span> Voltar
        </button>

        <button
          v-if="currentPage < 4"
          type="button"
          class="btn-submit"
          @click="goToNextPage"
          :disabled="registerState.state.loading"
        >
          Próximo <span class="mdi mdi-arrow-right"></span>
        </button>

        <button
          v-if="currentPage === 4"
          type="submit"
          class="btn-submit"
          :disabled="registerState.state.loading"
        >
          <LoadingSpinner v-if="registerState.state.loading" />
          {{ registerState.state.loading ? 'Enviando cadastro...' : 'Enviar Cadastro' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.form-container {
  max-width: 560px;
  margin: 2rem auto;
  padding: 2rem;
  background: var(--superfice);
  border: 1px solid rgba(223, 128, 26, 0.12);
  border-radius: 20px;
  position: relative;
}

.btn-back-top {
  position: absolute;
  top: 12px;
  left: 12px;
  background: none;
  border: none;
  color: var(--text);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: 0.2s;
  z-index: 10;
}

.btn-back-top:hover {
  color: var(--primary);
  left: 10px;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}
.header .mdi-domain {
  font-size: 48px;
  color: var(--primary);
}
.header h2 {
  font-size: 1.5rem;
  color: var(--text-muted);
  margin: 0.5rem 0 0;
  font-weight: 400;
}
.header h1 {
  font-size: 2rem;
  margin: 0;
  font-weight: 800;
}
.header h1 span {
  color: var(--primary);
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.row-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-submit {
  width: 100%;
  background: var(--primary);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 0.5rem;
  transition: all 0.2s;
}
.btn-submit:hover:not(:disabled) {
  background: var(--primary-hover);
}
.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-back {
  width: 100%;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--text-muted);
  padding: 14px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}
.btn-back:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}

.success-message {
  text-align: center;
  padding: 2rem;
}
.success-message .mdi-check-circle {
  font-size: 3rem;
  color: var(--success);
}
.success-title {
  color: var(--text);
  font-size: 1.5rem;
  font-weight: bold;
  margin: 1rem 0 0.5rem;
}
.loading-spinner {
  margin-top: 1rem;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.mdi-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.page-title {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  color: var(--text);
}
.highlight-orange {
  color: var(--primary);
}

.review-section {
  background: var(--bg);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border-left: 4px solid var(--primary);
}
.review-section h3 {
  color: var(--primary);
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
  font-weight: 600;
}
.review-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(223, 128, 26, 0.1);
}
.review-item:last-child {
  border-bottom: none;
}
.review-item .label {
  font-weight: 600;
  color: var(--text-muted);
}
.review-item .value {
  color: var(--text);
  text-align: right;
  flex: 1;
  margin-left: 1rem;
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(223, 128, 26, 0.08);
  border-radius: 12px;
  border-left: 4px solid var(--primary);
  margin-top: 0.5rem;
}
.info-box .mdi {
  font-size: 20px;
  color: var(--primary);
  flex-shrink: 0;
}
.info-box p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 1rem;
}

@media (max-width: 640px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>
