<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterState } from '@/store/useRegisterState'
import { useInputFormat } from '@/composables/useInputFormat'

const router = useRouter()
const registerState = useRegisterState()
const { formatarCPF, formatarTelefone, formatarCEP } = useInputFormat()

const form = ref({
  nomeCompleto: '',
  dia: '',
  mes: '',
  ano: '',
  cpf: '',
  email: '',
  telefone: '',
  password: '',
  confirmPassword: '',
  genero: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: ''
})

const mostrarSenha = ref(false)
const errorMessage = ref('')

const dias = computed(() => Array.from({ length: 31 }, (_, i) => i + 1))

const meses = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
]

const currentYear = new Date().getFullYear()

const anos = computed(() =>
  Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i)
)

const limparErro = () => {
  errorMessage.value = ''
  registerState.state.error = null
}

const toggleSenha = () => {
  mostrarSenha.value = !mostrarSenha.value
}

const formatarDataNascimento = () => {
  const dia = String(form.value.dia).padStart(2, '0')
  const mes = meses.find(item => item.label === form.value.mes)?.value || '01'
  return `${form.value.ano}-${mes}-${dia}`
}

const handleSubmit = async () => {
  limparErro()

  if (!form.value.nomeCompleto) {
    errorMessage.value = 'Nome completo é obrigatório'
    return
  }

  if (!form.value.email) {
    errorMessage.value = 'Email é obrigatório'
    return
  }

  if (!form.value.password) {
    errorMessage.value = 'Senha é obrigatória'
    return
  }

  if (form.value.password.length < 6) {
    errorMessage.value = 'A senha deve ter no mínimo 6 caracteres'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'As senhas não coincidem'
    return
  }

  const data = {
    nome: form.value.nomeCompleto.trim(),
    email: form.value.email.trim().toLowerCase(),
    password: form.value.password,
    telefone: form.value.telefone,
    cpf: form.value.cpf,
    data_nascimento: formatarDataNascimento(),
    genero: form.value.genero || null,
    endereco: form.value.endereco || null,
    cidade: form.value.cidade || null,
    estado: form.value.estado || null,
    cep: form.value.cep || null
  }

  await registerState.registerPassageiro(data)

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
        <span class="mdi mdi-loading mdi-spin"></span>
        Redirecionando...
      </div>
    </div>

    <form
      v-else
      class="signup-form"
      @submit.prevent="handleSubmit"
    >
      <div class="field-group">
        <label>Nome completo *</label>
        <input
          v-model="form.nomeCompleto"
          type="text"
          placeholder="Digite seu nome completo"
          :disabled="registerState.state.loading"
          @input="limparErro"
        />
      </div>

      <div class="field-group">
        <label>Data de nascimento *</label>

        <div class="date-row">
          <input
            v-model="form.dia"
            list="dias"
            placeholder="Dia"
            :disabled="registerState.state.loading"
          />

          <input
            v-model="form.mes"
            list="meses"
            placeholder="Mês"
            :disabled="registerState.state.loading"
          />

          <input
            v-model="form.ano"
            list="anos"
            placeholder="Ano"
            :disabled="registerState.state.loading"
          />
        </div>
      </div>

      <datalist id="dias">
        <option
          v-for="dia in dias"
          :key="dia"
          :value="String(dia).padStart(2, '0')"
        />
      </datalist>

      <datalist id="meses">
        <option
          v-for="mes in meses"
          :key="mes.value"
          :value="mes.label"
        />
      </datalist>

      <datalist id="anos">
        <option
          v-for="ano in anos"
          :key="ano"
          :value="ano"
        />
      </datalist>

      <div class="field-group">
        <label>CPF *</label>
        <input
          v-model="form.cpf"
          type="text"
          placeholder="000.000.000-00"
          maxlength="14"
          :disabled="registerState.state.loading"
          @input="e => formatarCPF(e, v => form.cpf = v)"
        />
      </div>

      <div class="field-group">
        <label>Email *</label>
        <input
          v-model="form.email"
          type="email"
          placeholder="seu@email.com"
          :disabled="registerState.state.loading"
          @input="limparErro"
        />
      </div>

      <div class="field-group">
        <label>Telefone *</label>
        <input
          v-model="form.telefone"
          type="text"
          placeholder="(00) 90000-0000"
          maxlength="16"
          :disabled="registerState.state.loading"
          @input="e => formatarTelefone(e, v => form.telefone = v)"
        />
      </div>

      <div class="field-group">
        <label>Gênero</label>
        <select v-model="form.genero">
          <option value="">Selecione</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div class="field-group">
        <label>Endereço</label>
        <input
          v-model="form.endereco"
          type="text"
          placeholder="Rua, número, bairro"
        />
      </div>

      <div class="row-fields">
        <div class="field-group half">
          <label>Cidade</label>
          <input
            v-model="form.cidade"
            type="text"
            placeholder="Cidade"
          />
        </div>

        <div class="field-group half">
          <label>Estado</label>
          <input
            v-model="form.estado"
            type="text"
            placeholder="Estado"
          />
        </div>
      </div>

      <div class="field-group">
        <label>CEP</label>
        <input
          v-model="form.cep"
          type="text"
          placeholder="00000-000"
          maxlength="9"
          @input="e => formatarCEP(e, v => form.cep = v)"
        />
      </div>

      <div class="field-group">
        <label>Senha *</label>

        <div class="password-input">
          <input
            :type="mostrarSenha ? 'text' : 'password'"
            v-model="form.password"
            placeholder="Mínimo 6 caracteres"
            :disabled="registerState.state.loading"
          />

          <span
            class="mdi toggle-password"
            :class="mostrarSenha ? 'mdi-eye-off' : 'mdi-eye'"
            @click="toggleSenha"
          ></span>
        </div>
      </div>

      <div class="field-group">
        <label>Confirmar senha *</label>

        <div class="password-input">
          <input
            :type="mostrarSenha ? 'text' : 'password'"
            v-model="form.confirmPassword"
            placeholder="Digite a senha novamente"
            :disabled="registerState.state.loading"
          />
        </div>
      </div>

      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>

      <p
        v-if="registerState.state.error"
        class="error-message"
      >
        {{ registerState.state.error }}
      </p>

      <button
        type="submit"
        class="btn-submit"
        :disabled="registerState.state.loading"
      >
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

.field-group {
  display: flex;
  flex-direction: column;
}

.field-group label {
  color: #f48a1d;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-group input,
.field-group select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.field-group input:focus,
.field-group select:focus {
  outline: none;
  border-color: #f48a1d;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.1);
}

.date-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.row-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.password-input {
  position: relative;
}

.password-input input {
  padding-right: 45px;
}

.toggle-password {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #999;
  font-size: 20px;
}

.toggle-password:hover {
  color: #f48a1d;
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
}

.error-message {
  color: #dc2626;
  font-size: 0.85rem;
  text-align: center;
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
}

@media (max-width: 640px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }
}
</style>