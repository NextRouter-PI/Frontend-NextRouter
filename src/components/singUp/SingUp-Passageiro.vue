<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterState } from '@/store/useRegisterState'
import { useSignUpPassengerDriverForm } from '@/composables/useSignUpForm'
import FormField from '@/components/ui/input/FormField.vue'
import FormattedField from '@/components/ui/input/FormattedField.vue'
import SelectField from '@/components/ui/input/SelectField.vue'
import PasswordFieldSignUp from '@/components/ui/input/PasswordFieldSignUp.vue'
import DateInput from '@/components/ui/input/DateInput.vue'
import ErrorMessage from '@/components/ui/display/ErrorMessage.vue'
import LoadingSpinner from '@/components/ui/display/LoadingSpinner.vue'

const router = useRouter()
const registerState = useRegisterState()
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
  city: '',
  state: '',
})

// TODO: Refatorar função (para usar try, catch e finally)
const handleSubmit = async () => {
  if (!validarFormulario(form)) return

  let formData = new FormData()

  formData.append('user_data.email', form.email.trim().toLowerCase())
  formData.append('user_data.cpf', form.cpf)
  formData.append('user_data.name', form.name.trim())
  formData.append('user_data.cep', form.cep)
  formData.append('user_data.password', form.password)

  const birthday = formatBirthday(form)

  formData.append('user_data.birthday', birthday)
  // TODO: Data de nascimento no banco

  await registerState.registerPassenger(formData)
  if (registerState.state.success) {
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }
}
</script>

<template>
  <section class="form-container">
    <div class="header">
      <span class="mdi mdi-account"></span>
      <h2>Bem vindo</h2>
      <h1><span>PASSAGEIRO</span></h1>
    </div>

    <div v-if="registerState.state.success" class="success-message">
      <span class="mdi mdi-check-circle-circle"></span>
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
                // Passa o objeto inteiro para a função porque apenas objetos no javascript são passados como referência
                getCEP(form)
              }
            }
          "
          @blur="validateField(form.cep, [(v) => requiredField(v, 'CEP') || isCEP(v)], 'cep')"
          required
        />
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
              [(v) => required(v, 'Senha') || minLengthField(v, 6, 'Senha')],
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
              [(v) => required(v, 'Confirmação') || match(v, form.password, 'Senhas')],
              'confirmPassword',
            )
          "
        />
      </div>
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
      <ErrorMessage :message="errorMessage" />
      <ErrorMessage v-if="registerState.state.error" :message="registerState.state.error" />
      <button
        v-if="currentPage === 2"
        type="submit"
        class="btn-submit"
        :disabled="registerState.state.loading"
      >
        <LoadingSpinner v-if="registerState.state.loading" />
        {{ registerState.state.loading ? 'Enviando cadastro...' : 'Criar conta' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.form-container {
  max-width: 560px;
  margin: 3rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}
.header .mdi-account {
  font-size: 48px;
  color: #f48a1d;
}
.header h2 {
  font-size: 1.5rem;
  color: #666;
  margin: 0.5rem 0 0;
  font-weight: normal;
}
.header h1 {
  font-size: 2rem;
  margin: 0;
  font-weight: bold;
}
.header h1 span {
  color: #f48a1d;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.row-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-submit {
  width: 100%;
  background: linear-gradient(135deg, #f48a1d 0%, #e37a0d 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.success-message {
  text-align: center;
  padding: 2rem;
}
.success-title {
  color: #22c55e;
  font-size: 1.5rem;
  font-weight: bold;
}
.loading-spinner {
  margin-top: 1rem;
  color: #f48a1d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.mdi-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }
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
</style>
