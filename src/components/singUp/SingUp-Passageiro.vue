<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterState } from '@/store/useRegisterState'
import { useSignUpForm } from '@/composables/useSignUpForm'
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
  mostrarSenha, errorMessage, dias, meses, anos,
  formatarCPF, formatarTelefone, formatarCEP,
  limparErro, toggleSenha, formatarDataNascimento, validarFormulario
} = useSignUpForm()

const form = ref({
  nomeCompleto: '', dia: '', mes: '', ano: '', cpf: '', email: '',
  telefone: '', password: '', confirmPassword: '', genero: '',
  endereco: '', cidade: '', estado: '', cep: ''
})

const handleSubmit = async () => {
  limparErro(registerState)
  if (!validarFormulario(form.value)) return

  const data = {
    nome: form.value.nomeCompleto.trim(),
    email: form.value.email.trim().toLowerCase(),
    password: form.value.password,
    telefone: form.value.telefone,
    cpf: form.value.cpf,
    data_nascimento: formatarDataNascimento(form.value),
    genero: form.value.genero || null,
    endereco: form.value.endereco || null,
    cidade: form.value.cidade || null,
    estado: form.value.estado || null,
    cep: form.value.cep || null
  }

  await registerState.registerPassageiro(data)
  if (registerState.state.success) {
    setTimeout(() => { router.push('/') }, 2000)
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
      <FormField v-model="form.nomeCompleto" label="Nome completo" required placeholder="Digite seu nome completo" :disabled="registerState.state.loading" @input="limparErro(registerState)" />
      <DateInput :dias="dias" :meses="meses" :anos="anos" :form="form" :disabled="registerState.state.loading" />
      <FormattedField v-model="form.cpf" label="CPF" required placeholder="000.000.000-00" maxlength="14" :disabled="registerState.state.loading" :format="formatarCPF" />
      <FormField v-model="form.email" label="Email" required type="email" placeholder="seu@email.com" :disabled="registerState.state.loading" @input="limparErro(registerState)" />
      <FormattedField v-model="form.telefone" label="Telefone" required placeholder="(00) 90000-0000" maxlength="16" :disabled="registerState.state.loading" :format="formatarTelefone" />
      <SelectField v-model="form.genero" label="Gênero" :options="[{value:'Masculino',label:'Masculino'},{value:'Feminino',label:'Feminino'},{value:'Outro',label:'Outro'}]" />
      <FormField v-model="form.endereco" label="Endereço" placeholder="Rua, número, bairro" />
      <div class="row-fields">
        <FormField v-model="form.cidade" label="Cidade" placeholder="Cidade" class="half" />
        <FormField v-model="form.estado" label="Estado" placeholder="Estado" class="half" />
      </div>
      <FormattedField v-model="form.cep" label="CEP" placeholder="00000-000" maxlength="9" :format="formatarCEP" />
      <PasswordFieldSignUp v-model="form.password" label="Senha" required placeholder="Mínimo 6 caracteres" :disabled="registerState.state.loading" :show-password="mostrarSenha" @update:show-password="toggleSenha" />
      <PasswordFieldSignUp v-model="form.confirmPassword" label="Confirmar senha" required placeholder="Digite a senha novamente" :disabled="registerState.state.loading" :show-password="mostrarSenha" />
      <ErrorMessage :message="errorMessage" />
      <ErrorMessage v-if="registerState.state.error" :message="registerState.state.error" />
      <button type="submit" class="btn-submit" :disabled="registerState.state.loading">
        <LoadingSpinner v-if="registerState.state.loading" />
        {{ registerState.state.loading ? 'Criando conta...' : 'Criar conta' }}
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

.header { text-align: center; margin-bottom: 2rem; }
.header .mdi-account { font-size: 48px; color: #f48a1d; }
.header h2 { font-size: 1.5rem; color: #666; margin: 0.5rem 0 0; font-weight: normal; }
.header h1 { font-size: 2rem; margin: 0; font-weight: bold; }
.header h1 span { color: #f48a1d; }

.signup-form { display: flex; flex-direction: column; gap: 1rem; }
.row-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.btn-submit {
  width: 100%; background: linear-gradient(135deg, #f48a1d 0%, #e37a0d 100%);
  color: white; border: none; padding: 14px; border-radius: 12px;
  font-size: 1rem; font-weight: bold; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

.success-message { text-align: center; padding: 2rem; }
.success-title { color: #22c55e; font-size: 1.5rem; font-weight: bold; }
.loading-spinner { margin-top: 1rem; color: #f48a1d; display: flex; align-items: center; justify-content: center; gap: 8px; }
.mdi-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .form-container { margin: 1rem; padding: 1.5rem; }
}
</style>
