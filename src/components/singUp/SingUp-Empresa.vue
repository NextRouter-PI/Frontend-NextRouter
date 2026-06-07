<script setup>
import { useSignUpCompanyForm } from '@/composables/useSignUpEmpresaForm'
import FormField from '@/components/ui/input/FormField.vue'
import FormattedField from '@/components/ui/input/FormattedField.vue'
import FileUploadField from '@/components/ui/input/FileUploadField.vue'
import PasswordFieldSignUp from '@/components/ui/input/PasswordFieldSignUp.vue'
import ErrorMessage from '@/components/ui/display/ErrorMessage.vue'
import LoadingSpinner from '@/components/ui/display/LoadingSpinner.vue'
import SuccessDisplay from '@/components/ui/display/SuccessDisplay.vue'

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
</script>

<template>
  <section class="form-container">
    <div class="form-header-image">
      <img
        v-if="currentPage === 1"
        src="@/assets/WhatsApp Image 2026-04-29 at 23.21.32(1).jpeg"
        alt="Banner Empresa"
        class="header-image"
      />
      <img
        v-else-if="currentPage === 2"
        src="@/assets/WhatsApp Image 2026-04-29 at 23.21.32(2).jpeg"
        alt="Banner Documentação"
        class="header-image"
      />
      <img
        v-else
        src="@/assets/WhatsApp Image 2026-04-29 at 23.21.32.jpeg"
        alt="Banner Empresa"
        class="header-image"
      />
    </div>

    <div v-if="currentPage !== 4" class="stepper-container">
      <div class="step-circle" :class="{ active: currentPage >= 1, completed: currentPage > 1 }">
        <span v-if="currentPage > 1" class="mdi mdi-check"></span>
        <span v-else>1</span>
      </div>
      <div class="step-circle" :class="{ active: currentPage >= 2, completed: currentPage > 2 }">
        <span v-if="currentPage > 2" class="mdi mdi-check"></span>
        <span v-else>2</span>
      </div>
      <div class="step-circle" :class="{ active: currentPage >= 3 }">3</div>
    </div>

    <div v-if="registerState.state.success" class="success-section">
      <SuccessDisplay
        title="Cadastro enviado com sucesso!"
        subtitle="Sua empresa será verificada pela nossa equipe. Você receberá um email em breve com o resultado da análise."
      >
        <LoadingSpinner text="Redirecionando..." />
      </SuccessDisplay>
    </div>

    <form v-else class="signup-form" @submit.prevent="handleSubmit">
      <div v-if="currentPage === 1" class="page-container">
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
                // Passa o objeto inteiro para a função porque apenas objetos no javascript são passados como referência
                getCEP(page1Form)
              }
            }
          "
          @blur="validateField(page1Form.cep, [(v) => requiredField(v, 'CEP') || isCEP(v)], 'cep')"
        />
        <div class="row-group">
          <FormField
            v-model="page1Form.city"
            label="Cidade"
            placeholder="Cidade do CEP"
            disabled
            class="city-field"
          />
          <FormField
            v-model="page1Form.state"
            label="Estado"
            placeholder="UF do CEP"
            disabled
            class="state-field"
          />
        </div>
      </div>

      <div v-if="currentPage === 2" class="page-container">
        <h2 class="page-title">Documentação da <span class="highlight-orange">Empresa</span></h2>

        <FormField
          v-model="page1Form.stateRegistration"
          label="Inscrição Estadual"
          placeholder="Digite a inscrição estadual"
          :disabled="registerState.state.loading"
          @input="clearFieldError('stateRegistration')"
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

      <div v-if="currentPage === 3" class="page-container">
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

      <div v-if="currentPage === 4" class="page-container">
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

        <div class="info-box">
          <span class="mdi mdi-information-outline"></span>
          <p>
            Por favor, revise todas as informações antes de enviar. Você não poderá alterá-las após
            a submissão.
          </p>
        </div>
      </div>

      <ErrorMessage :message="errorMessage" />
      <ErrorMessage v-if="registerState.state.error" :message="registerState.state.error" />

      <div class="button-group">
        <button
          v-if="currentPage > 1"
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
          class="btn-next"
          :class="{ 'btn-center': currentPage === 1 }"
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
  max-width: 700px;
  margin: 3rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.1);
}

.form-header-image {
  width: 100%;
  margin: -2rem -2rem 2rem 1rem;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
}

.header-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
}

.stepper-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  margin: 30px 0;
  padding: 0 20px;
}

.stepper-container::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 40px;
  right: 40px;
  height: 2px;
  background-color: #ccc;
  z-index: 1;
}

.step-circle {
  width: 40px;
  height: 40px;
  background-color: #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 2;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.step-circle.active {
  background-color: #f48a1d;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(244, 138, 29, 0.4);
}

.step-circle.completed {
  background-color: #22c55e;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}

.page-title {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #333;
}

.highlight-orange {
  color: #f48a1d;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-container {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.row-group {
  display: flex;
  gap: 15px;
  width: 100%;
}

.row-group :deep(.city-field) {
  flex: 2;
}

.row-group :deep(.state-field) {
  flex: 1;
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff7f0;
  border-radius: 12px;
  border-left: 4px solid #f48a1d;
  margin-top: 0.5rem;
}

.info-box .mdi {
  font-size: 20px;
  color: #f48a1d;
  flex-shrink: 0;
}

.info-box p {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
}

.review-section {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #f48a1d;
}

.review-section h3 {
  color: #f48a1d;
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.review-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.review-item:last-child {
  border-bottom: none;
}

.review-item .label {
  font-weight: 600;
  color: #666;
}

.review-item .value {
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 1rem;
}

.success-section {
  padding: 2rem;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 2rem;
  justify-content: center;
}

.btn-back,
.btn-next,
.btn-submit {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.btn-back {
  background-color: #e0e0e0;
  color: #333;
  flex: 1;
}

.btn-back:hover:not(:disabled) {
  background-color: #d0d0d0;
  transform: translateY(-2px);
}

.btn-next {
  background-color: #f48a1d;
  color: white;
  flex: 1;
}

.btn-next:hover:not(:disabled) {
  background-color: #e37a0d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 138, 29, 0.3);
}

.btn-next.btn-center {
  width: auto;
  margin: 0 auto;
}

.btn-submit {
  background: linear-gradient(135deg, #f48a1d 0%, #e37a0d 100%);
  color: white;
  width: 100%;
  justify-content: center;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(244, 138, 29, 0.3);
}

.btn-back:disabled,
.btn-next:disabled,
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }

  .header-image {
    height: 180px;
  }

  .stepper-container {
    padding: 0 10px;
  }

  .stepper-container::before {
    left: 20px;
    right: 20px;
  }

  .step-circle {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }

  .row-group {
    flex-direction: column;
  }

  .button-group {
    flex-direction: column;
  }

  .btn-back,
  .btn-next {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .form-container {
    margin: 0.5rem;
    padding: 1rem;
  }

  .form-header-image {
    margin: -1rem -1rem 1rem -1rem;
  }

  .header-image {
    height: 150px;
  }

  .stepper-container {
    padding: 0 5px;
    margin: 20px 0;
  }

  .step-circle {
    width: 30px;
    height: 30px;
    font-size: 0.8rem;
  }

  .page-title {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .button-group {
    gap: 10px;
  }

  .btn-back,
  .btn-next,
  .btn-submit {
    padding: 10px 16px;
    font-size: 0.9rem;
  }

  .review-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-item .value {
    text-align: left;
    margin-left: 0;
    margin-top: 0.25rem;
  }
}
</style>
