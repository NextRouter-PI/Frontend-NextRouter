<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterState } from '@/stores/useRegisterState'
import { useSignUpPassengerDriverForm } from '@/composables/useSignUpForm'
import { useEmailVerification } from '@/composables/useEmailVerification'
import FormField from '@/components/ui/FormField.vue'
import FormattedField from '@/components/ui/FormattedField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import PasswordFieldSignUp from '@/components/ui/PasswordFieldSignUp.vue'
import DateInput from '@/components/ui/DateInput.vue'
import CodeInput from '@/components/ui/CodeInput.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const router = useRouter()
const registerState = useRegisterState()
const { codigo, enviandoCodigo, erroCodigo, enviarCodigo, codigoCompleto, cooldown } = useEmailVerification()

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
  validarFormulario,
  validateField,
  formatCPF,
  isPhone,
  formatPhone,
  formatCEP,
  formatBirthday,
  getCEP,
  isCEP,
  isEmail,
  isCPF,
  currentPage,
  minLengthField,
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
  genre: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
})

const avancarParaVerificacao = async () => {
  const sucesso = await enviarCodigo(form.email.trim().toLowerCase())
  if (sucesso) currentPage.value = 3
}

// TODO: Refatorar função (para usar try, catch e finally)
const handleSubmit = async () => {
  if (!validarFormulario(form)) return

  if (codigoCompleto().length !== 6) {
    erroCodigo.value = 'Digite o código completo de 6 dígitos.'
    return
  }

  let formData = new FormData()

  formData.append('user_data.email', form.email.trim().toLowerCase())
  formData.append('user_data.cpf', form.cpf)
  formData.append('user_data.name', form.name.trim())
  formData.append('user_data.phone', form.phone.replace(/\D/g, ''))
  formData.append('user_data.cep', form.cep)
  formData.append('user_data.street', form.street)
  formData.append('user_data.number', form.number)
  formData.append('user_data.complement', form.complement)
  formData.append('user_data.neighborhood', form.neighborhood)
  formData.append('user_data.city', form.city)
  formData.append('user_data.state', form.state)
  formData.append('user_data.password', form.password)
  formData.append('user_data.code', codigoCompleto())

  const birthday = formatBirthday(form)

  formData.append('user_data.birthday', birthday)

  await registerState.registerPassenger(formData)
  if (registerState.state.success) {
    setTimeout(() => {
      router.push('/')
      registerState.state.success = false
    }, 2000)
  }
}
</script>

<template>
  <section class="form-container">
    <button class="btn-back-top" @click="goBack" aria-label="Voltar">
      <span class="mdi mdi-arrow-left"></span>
    </button>
    <div class="header">
      <span class="mdi mdi-account"></span>
      <h2>Bem vindo</h2>
      <h1><span>PASSAGEIRO</span></h1>
    </div>

    <div v-if="registerState.state.success" class="success-message">
      <span class="mdi mdi-check-circle"></span>
      <p class="success-title">Conta criada com sucesso!</p>
      <p>Bem vindo(a) à NextRouter!</p>
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
          :days="days"
          :months="months"
          :years="years"
          v-model="form"
          :disabled="registerState.state.loading"
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
        <SelectField
          v-model="form.genre"
          label="Gênero"
          :options="[
            { value: 'Masculino', label: 'Masculino' },
            { value: 'Feminino', label: 'Feminino' },
            { value: 'Outro', label: 'Outro' },
          ]"
        />
        <FormattedField
          v-model="form.cep"
          label="CEP"
          placeholder="00000-000"
          maxlength="9"
          :format="formatCEP"
          @input="
            () => {
              clearFieldError('cep')
              if (form.cep.length === 9) {
                getCEP(form)
              }
            }
          "
          @blur="validateField(form.cep, [(v) => requiredField(v, 'CEP') || isCEP(v)], 'cep')"
          required
        />
        <div class="row-fields">
          <FormField
            v-model="form.street"
            label="Rua"
            placeholder="Nome da rua"
            class="half"
          />
          <FormField
            v-model="form.number"
            label="Número"
            placeholder="Nº"
            class="half"
          />
        </div>
        <div class="row-fields">
          <FormField
            v-model="form.neighborhood"
            label="Bairro"
            placeholder="Bairro"
            class="half"
          />
          <FormField
            v-model="form.complement"
            label="Complemento"
            placeholder="Apto, bloco... (opcional)"
            class="half"
          />
        </div>
        <div class="row-fields">
          <FormField
            v-model="form.city"
            disabled
            label="Cidade"
            placeholder="Cidade do CEP"
            class="half"
          />
          <FormField
            v-model="form.state"
            disabled
            label="Estado"
            placeholder="Estado do CEP"
            class="half"
          />
        </div>

        <PasswordFieldSignUp
          v-model="form.password"
          label="Senha"
          required
          placeholder="Mínimo 6 caracteres"
          :disabled="registerState.state.loading"
          :show-password="isPasswordVisible"
          :error="fieldErrors.password"
          @update:show-password="showPassword"
          @input="clearFieldError('password')"
          @blur="
            validateField(
              form.password,
              [(v) => requiredField(v, 'Senha') || minLengthField(v, 6, 'Senha')],
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
            <span class="label">Gênero:</span>
            <span class="value">{{ form.genre || 'Não informado' }}</span>
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
          Digite o código de verificação enviado para <strong>{{ form.email }}</strong>
        </p>

        <CodeInput v-model="codigo" />

        <p class="reenviar-texto">
          <template v-if="cooldown > 0">Reenviar código em {{ cooldown }}s</template>
          <template v-else>
            Não recebeu?
            <a href="#" @click.prevent="enviarCodigo(form.email.trim().toLowerCase())">Enviar novo código</a>
          </template>
        </p>

        <ErrorMessage v-if="erroCodigo" :message="erroCodigo" />
      </div>

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
        :disabled="registerState.state.loading"
      >
        <LoadingSpinner v-if="registerState.state.loading" />
        {{ registerState.state.loading ? 'Enviando cadastro...' : 'Confirmar e Criar Conta' }}
      </button>
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

.reenviar-texto a {
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>
