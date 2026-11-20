<script setup>
import { useSignUpCompanyForm } from '@/composables/useSignUpCompanyForm'
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import PublicShell from '@/components/layout/PublicShell.vue'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'
import FormField from '@/components/ui/FormField.vue'
import FormattedField from '@/components/ui/FormattedField.vue'
import FileUploadField from '@/components/ui/FileUploadField.vue'
import PasswordFieldSignUp from '@/components/ui/PasswordFieldSignUp.vue'
import CodeInput from '@/components/ui/CodeInput.vue'
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
  (success, _previous, onCleanup) => {
    if (!success) return
    page3Form.password = ''
    page3Form.passwordConfirm = ''
    codigo.value = ['', '', '', '', '', '']
    const timer = setTimeout(() => router.push({ name: 'login' }), 2000)
    onCleanup(() => clearTimeout(timer))
  },
)

const goBack = () => {
  router.push('/signup');
}
</script>

<template>
  <PublicShell
    show-back
    title-prefix="Cadastro de "
    title-highlight="Empresa"
    @back="goBack"
  >
    <div v-if="!registerState.state.success" class="company-stepper" aria-label="Etapas do cadastro">
      <div class="stepper-step">
        <span :class="['step-circle', { active: currentPage === 1, done: currentPage > 1 }]">
          <span v-if="currentPage > 1" class="mdi mdi-check" aria-hidden="true"></span>
          <template v-else>1</template>
        </span>
      </div>
      <div :class="['step-line', { done: currentPage > 1 }]"></div>
      <div class="stepper-step">
        <span :class="['step-circle', { active: currentPage === 2, done: currentPage > 2 }]">
          <span v-if="currentPage > 2" class="mdi mdi-check" aria-hidden="true"></span>
          <template v-else>2</template>
        </span>
      </div>
      <div :class="['step-line', { done: currentPage > 2 }]"></div>
      <div class="stepper-step">
        <span :class="['step-circle', { active: currentPage >= 3 && currentPage <= 4, done: currentPage > 4 }]">
          <span v-if="currentPage > 4" class="mdi mdi-check" aria-hidden="true"></span>
          <template v-else>3</template>
        </span>
      </div>
    </div>

    <section class="form-container">
      <div v-if="registerState.state.success" class="success-message">
        <span class="mdi mdi-check-circle"></span>
        <p class="success-title">Conta empresarial criada!</p>
        <p>O cadastro da empresa aguarda moderação. Criar a conta não significa aprovação nem cria vínculos.</p>
        <div class="loading-spinner">
          <span class="mdi mdi-loading mdi-spin"></span> Redirecionando...
        </div>
      </div>

      <form v-else class="signup-form" @submit.prevent="handleSubmit">
      <Transition name="fade-slide" mode="out-in">
      <div v-if="currentPage === 1" key="step-1">
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
              page1Form.tradeName,
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
          accept=".pdf"
          :disabled="registerState.state.loading"
          :error="fieldErrors.articlesOfAssociation"
          hint="Formato aceito: PDF"
          @update:fileName="files.articlesOfAssociation.name = $event"
          @error="errorMessage = $event"
        />

        <FileUploadField
          v-model="files.stateOperatingLicense.file"
          :fileName="files.stateOperatingLicense.name"
          label="Licença de Operação Estadual"
          required
          accept=".pdf"
          :disabled="registerState.state.loading"
          :error="fieldErrors.stateOperatingLicense"
          hint="Formato aceito: PDF"
          @update:fileName="files.stateOperatingLicense.name = $event"
          @error="errorMessage = $event"
        />

        <FileUploadField
          v-model="files.certificateOfGoodStading.file"
          :fileName="files.certificateOfGoodStading.name"
          label="Certidões Negativas"
          required
          accept=".pdf"
          :disabled="registerState.state.loading"
          :error="fieldErrors.certificateOfGoodStading"
          hint="Formato aceito: PDF"
          @update:fileName="files.certificateOfGoodStading.name = $event"
          @error="errorMessage = $event"
        />

        <div class="info-box">
          <span class="mdi mdi-information-outline"></span>
          <p>
            Os documentos fazem parte da moderação cadastral da empresa. Não há prazo de análise garantido.
          </p>
        </div>
      </div>

      <div v-else-if="currentPage === 3" key="step-3">
        <h2 class="page-title">Responsável pela <span class="highlight-orange">Empresa</span></h2>

        <FormField
          v-model="page3Form.ceoName"
          label="Nome Completo do CEO / diretor / sócio administrador"
          required
          placeholder="Digite o nome completo"
          :disabled="registerState.state.loading"
          :error="fieldErrors.ceoName"
          @input="clearFieldError('ceoName')"
          @blur="validateField(page3Form.ceoName, [(v) => requiredField(v, 'Nome')], 'ceoName')"
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
          @blur="validateField(page3Form.ceoCpf, [(v) => requiredField(v, 'CPF') || isCPF(v)], 'ceoCpf')"
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
              [(v) => requiredField(v, 'Email de login') || isEmail(v)],
              'loginEmail',
            )
          "
        />
        <PasswordFieldSignUp
          v-model="page3Form.password"
          label="Defina uma senha"
          required
          placeholder="Mínimo 8 caracteres, não só números"
          :disabled="registerState.state.loading"
          :show-password="isPasswordVisible"
          :error="fieldErrors.password"
          @update:show-password="showPassword"
          @input="clearFieldError('password')"
          @blur="
            validateField(
              page3Form.password,
              [(v) => requiredField(v, 'Senha') || isStrongPassword(v)],
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
              [(v) => requiredField(v, 'Confirmação') || passwordMatch(v, page3Form.password)],
              'passwordConfirm',
            )
          "
        />
      </div>

      <div v-else-if="currentPage === 4" key="step-4">
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

      <div v-else-if="currentPage === 5" key="step-5">
        <h2 class="page-title">Verificação de <span class="highlight-orange">E-mail</span></h2>
        <p class="texto-principal">
          Se o e-mail puder ser usado no cadastro, você receberá um código em
          <strong>{{ emailCodigo }}</strong>. Digite os seis dígitos abaixo.
        </p>

        <CodeInput v-model="codigo" :disabled="enviandoCodigo || registerState.state.loading" />

        <p class="reenviar-texto">
          <template v-if="cooldown > 0">Reenviar código em {{ cooldown }}s</template>
          <template v-else>
            Não recebeu?
            <button type="button" class="resend-code"
              :disabled="enviandoCodigo || registerState.state.loading"
              @click="enviarCodigo(page3Form.loginEmail)">Enviar novo código</button>
          </template>
        </p>
      </div>
      </Transition>

      <!-- Fora das etapas: o erro ao enviar o código acontece na etapa de revisão e precisa aparecer nela -->
      <ErrorMessage v-if="erroCodigo" :message="erroCodigo" />
      <ErrorMessage :message="errorMessage" />
      <ErrorMessage v-if="registerState.state.error" :message="registerState.state.error" />

      <div class="button-group">
        <button
          v-if="currentPage > 1"
          type="button"
          class="btn-back"
          @click="goToPreviousPage"
          :disabled="enviandoDocumentos || enviandoCodigo || registerState.state.loading"
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
          type="button"
          class="btn-submit"
          :disabled="enviandoDocumentos || enviandoCodigo"
          @click="avancarParaVerificacao"
        >
          <LoadingSpinner v-if="enviandoDocumentos || enviandoCodigo" />
          {{ enviandoDocumentos ? 'Enviando documentos...' : enviandoCodigo ? 'Enviando código...' : 'Continuar' }}
        </button>

        <button
          v-if="currentPage === 5"
          type="submit"
          class="btn-submit"
          :disabled="registerState.state.loading || enviandoCodigo"
        >
          <LoadingSpinner v-if="registerState.state.loading" />
          {{ registerState.state.loading ? 'Enviando cadastro...' : 'Confirmar e Enviar Cadastro' }}
        </button>
      </div>
      </form>
    </section>
  </PublicShell>
</template>

<style scoped>
.company-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 22px;
  padding: 0 8px;
}

.stepper-step {
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 700;
  background: var(--altbg);
  color: var(--text);
  border: 2px solid var(--border);
  transition: all 0.2s ease;
}

.step-circle.active {
  background: var(--superfice);
  border-color: var(--primary-orange);
  color: var(--text);
}

.step-circle.done {
  background: var(--primary-orange);
  border-color: var(--primary-orange);
  color: #ffffff;
}

.step-line {
  flex: 1;
  height: 3px;
  background: var(--border);
  margin: 0 6px;
  border-radius: 999px;
}

.step-line.done {
  background: var(--primary-orange);
}

.form-container {
  width: 100%;
  padding: 20px 18px;
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  box-sizing: border-box;
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

.texto-principal {
  text-align: center;
  color: var(--text-muted);
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.6;
}

.reenviar-texto {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 15px;
}

.reenviar-texto .resend-code {
  color: var(--primary);
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 640px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>
