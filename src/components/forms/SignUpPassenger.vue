<script setup>
import { reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterState } from '@/stores/useRegisterState'
import { useSignUpPassengerDriverForm } from '@/composables/useSignUpForm'
import { useEmailVerification } from '@/composables/useEmailVerification'
import PublicShell from '@/components/layout/PublicShell.vue'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'
import FormField from '@/components/ui/FormField.vue'
import FormattedField from '@/components/ui/FormattedField.vue'
import PasswordFieldSignUp from '@/components/ui/PasswordFieldSignUp.vue'
import DateInput from '@/components/ui/DateInput.vue'
import CodeInput from '@/components/ui/CodeInput.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const router = useRouter()
const registerState = useRegisterState()

watch(
  () => registerState.state.success,
  (success, _previous, onCleanup) => {
    if (!success) return
    form.password = ''
    form.confirmPassword = ''
    codigo.value = ['', '', '', '', '', '']
    const timer = setTimeout(() => router.push({ name: 'login' }), 2000)
    onCleanup(() => clearTimeout(timer))
  },
)

const {
  codigo, enviandoCodigo, erroCodigo, enviarCodigo, prepararVerificacao,
  codigoPara, cooldown, emailCodigo,
} = useEmailVerification()

const goBack = () => {
  router.push('/signup');
}
const {
  errorMessage,
  days,
  months,
  years,
  fieldErrors,
  clearFieldError,
  clearBirthdayErrors,
  validarFormulario,
  validateField,
  formatCPF,
  isPhone,
  formatPhone,
  formatCEP,
  formatBirthday,
  isCEP,
  isEmail,
  isCPF,
  currentPage,
  isStrongPassword,
  requiredField,
  isPasswordVisible,
  showPassword,
  passwordMatch,
} = useSignUpPassengerDriverForm()

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

const voltarPagina = () => {
  if (enviandoCodigo.value || registerState.state.loading) return
  erroCodigo.value = ''
  registerState.reset()
  currentPage.value -= 1
}

const avancarParaVerificacao = async () => {
  const sucesso = await prepararVerificacao(form.email)
  if (sucesso) currentPage.value = 3
}

const handleSubmit = async () => {
  if (registerState.state.loading || currentPage.value !== 3) return
  if (!validarFormulario(form)) return

  const code = codigoPara(form.email)
  if (!code || enviandoCodigo.value) return
  await registerState.registerPassenger({ ...form, code, birthday: formatBirthday(form) })
}
</script>

<template>
  <PublicShell
    show-back
    title-prefix="Cadastro "
    title-highlight="Passageiro"
    show-divider
    @back="goBack"
  >
    <section class="form-container">
      <div v-if="registerState.state.success" class="success-message">
        <span class="mdi mdi-check-circle"></span>
        <p class="success-title">Conta criada com sucesso!</p>
        <p>Sua conta foi criada. O vínculo com uma empresa é solicitado separadamente.</p>
        <div class="loading-spinner">
          <span class="mdi mdi-loading mdi-spin"></span> Redirecionando...
        </div>
      </div>

      <form v-else class="signup-form" @submit.prevent="handleSubmit">
      <div v-if="currentPage === 1">
        <FormField
          v-model="form.name"
          label="Nome completo"
          required
          placeholder="Digite seu nome completo"
          :disabled="registerState.state.loading"
          :error="fieldErrors.name"
          @input="clearFieldError('name')"
          @blur="validateField(form.name, [(v) => requiredField(v, 'Nome completo')], 'name')"
        />
        <DateInput
          v-model:day="form.day"
          v-model:month="form.month"
          v-model:year="form.year"
          :days="days"
          :months="months"
          :years="years"
          required
          :disabled="registerState.state.loading"
          :day-error="fieldErrors.day"
          :month-error="fieldErrors.month"
          :year-error="fieldErrors.year"
          @update:day="clearBirthdayErrors"
          @update:month="clearBirthdayErrors"
          @update:year="clearBirthdayErrors"
        />
        <FormattedField
          v-model="form.cpf"
          label="CPF"
          required
          placeholder="000.000.000-00"
          maxlength="14"
          :disabled="registerState.state.loading"
          :format="formatCPF"
          :error="fieldErrors.cpf"
          @input="clearFieldError('cpf')"
          @blur="validateField(form.cpf, [(v) => requiredField(v, 'CPF') || isCPF(v)], 'cpf')"
        />
        <FormField
          v-model="form.email"
          label="Email"
          required
          type="email"
          placeholder="seu@email.com"
          :disabled="registerState.state.loading"
          :error="fieldErrors.email"
          @input="clearFieldError('email')"
          @blur="
            validateField(form.email, [(v) => requiredField(v, 'Email') || isEmail(v)], 'email')
          "
        />
        <FormattedField
          v-model="form.phone"
          label="Telefone"
          placeholder="(00) 90000-0000"
          maxlength="16"
          :disabled="registerState.state.loading"
          :format="formatPhone"
          @input="clearFieldError('phone')"
          @blur="validateField(form.phone, [(v) => isPhone(v)], 'phone')"
        />
        <AddressCepMapField
          v-model:cep="form.cep"
          v-model:street="form.street"
          v-model:number="form.number"
          v-model:complement="form.complement"
          v-model:neighborhood="form.neighborhood"
          v-model:city="form.city"
          v-model:state="form.state"
          v-model:latitude="form.latitude"
          v-model:longitude="form.longitude"
          :disabled="registerState.state.loading"
          :cep-error="fieldErrors.cep"
          :format-cep="formatCEP"
          complement-placeholder="Bloco, condomínio, apto..."
          @cep-input="clearFieldError('cep')"
          @cep-blur="validateField(form.cep, [(v) => requiredField(v, 'CEP') || isCEP(v)], 'cep')"
        />

        <PasswordFieldSignUp
          v-model="form.password"
          label="Senha"
          required
          placeholder="Mínimo 8 caracteres, não só números"
          :disabled="registerState.state.loading"
          :show-password="isPasswordVisible"
          :error="fieldErrors.password"
          @update:show-password="showPassword"
          @input="clearFieldError('password')"
          @blur="
            validateField(
              form.password,
              [(v) => requiredField(v, 'Senha') || isStrongPassword(v)],
              'password',
            )
          "
        />
        <PasswordFieldSignUp
          v-model="form.confirmPassword"
          label="Confirmar senha"
          required
          placeholder="Digite a senha novamente"
          :disabled="registerState.state.loading"
          :show-password="isPasswordVisible"
          :error="fieldErrors.confirmPassword"
          @update:show-password="showPassword"
          @input="clearFieldError('confirmPassword')"
          @blur="
            validateField(
              form.confirmPassword,
              [(v) => requiredField(v, 'Confirmação') || passwordMatch(v, form.password)],
              'confirmPassword',
            )
          "
        />
        <button
        type="button"
        class="btn-submit"
        @click="
          () => {
            if (!validarFormulario(form)) return
            currentPage = 2
          }
        "
        :disabled="registerState.state.loading"
      >
        <LoadingSpinner v-if="registerState.state.loading" />
        Avançar
      </button>
      </div>
      
      <div v-if="currentPage === 2" class="page-container">
        <h2 class="page-title">Revisão do <span class="highlight-orange">Cadastro</span></h2>

        <div class="review-section">
          <h3>Confirme as informações</h3>
          <div class="review-item">
            <span class="label">Nome:</span>
            <span class="value">{{ form.name }}</span>
          </div>


          <div class="review-item">
            <span class="label">CPF:</span>
            <span class="value">{{ form.cpf }}</span>
          </div>
          <div class="review-item">
            <span class="label">Email:</span>
            <span class="value">{{ form.email }}</span>
          </div>

          <div class="review-item">
            <span class="label">Localização:</span>
            <span class="value">{{ form.city }}, {{ form.state }} - {{ form.cep }}</span>
          </div>

          <div class="review-item">
            <span class="label">Telefone:</span>
            <span class="value">{{ form.phone || 'Não informado' }}</span>
          </div>

          <div class="review-item">
            <span class="label">Data de Nascimento:</span>
            <span class="value">{{ `${form.day}-${form.month}-${form.year}` }}</span>
          </div>
        </div>
      </div>

      <div v-if="currentPage === 3" class="page-container">
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
              @click="enviarCodigo(form.email)">Enviar novo código</button>
          </template>
        </p>
      </div>

      <!-- Fora das etapas: o erro ao enviar o código acontece na etapa de revisão e precisa aparecer nela -->
      <ErrorMessage v-if="erroCodigo" :message="erroCodigo" />
      <ErrorMessage :message="errorMessage" />
      <ErrorMessage v-if="registerState.state.error" :message="registerState.state.error" />

      <button
        v-if="currentPage === 2"
        type="button"
        class="btn-submit"
        :disabled="enviandoCodigo"
        @click="avancarParaVerificacao"
      >
        <LoadingSpinner v-if="enviandoCodigo" />
        {{ enviandoCodigo ? 'Enviando código...' : 'Continuar' }}
      </button>

      <button
        v-if="currentPage === 3"
        type="submit"
        class="btn-submit"
        :disabled="registerState.state.loading || enviandoCodigo"
      >
        <LoadingSpinner v-if="registerState.state.loading" />
        {{ registerState.state.loading ? 'Enviando cadastro...' : 'Confirmar e Criar Conta' }}
      </button>

      <button
        v-if="currentPage > 1"
        type="button"
        class="btn-back"
        :disabled="enviandoCodigo || registerState.state.loading"
        @click="voltarPagina"
      >
        Voltar e corrigir dados
      </button>
      </form>
    </section>
  </PublicShell>
</template>

<style scoped>
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
.header .mdi-account {
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
  text-decoration: underline;
}

.btn-back {
  width: 100%;
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  padding: 12px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
}
.btn-back:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>
