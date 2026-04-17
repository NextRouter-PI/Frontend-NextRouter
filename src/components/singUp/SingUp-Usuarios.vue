<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRegisterState } from '@/store/useRegisterState';

const router = useRouter();
const registerState = useRegisterState();

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
});

const mostrarSenha = ref(false);
const errorMessage = ref('');

const dias = computed(() => Array.from({ length: 31 }, (_, i) => i + 1));
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
];

const currentYear = new Date().getFullYear();
const anos = computed(() =>
  Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i)
);

const formatarDataNascimento = () => {
  const dia = String(form.value.dia).padStart(2, '0');
  const mesObj = meses.find(m => m.label === form.value.mes);
  const mesNumero = mesObj ? mesObj.value : '01';
  const ano = form.value.ano;
  return `${ano}-${mesNumero}-${dia}`;
};

const formatarCPF = (event) => {
  let value = event.target.value.replace(/[^\d]/g, '');
  if (value.length <= 3) {
    value = value.replace(/^(\d{0,3})/, '$1');
  } else if (value.length <= 6) {
    value = value.replace(/^(\d{3})(\d{0,3})/, '$1.$2');
  } else if (value.length <= 9) {
    value = value.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else {
    value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  }
  form.value.cpf = value;
};

const formatarTelefone = (event) => {
  let value = event.target.value.replace(/[^\d]/g, '');
  if (value.length <= 2) {
    value = value.replace(/^(\d{0,2})/, '($1');
  } else if (value.length <= 6) {
    value = value.replace(/^(\d{2})(\d{0,4})/, '($1) $2');
  } else if (value.length <= 10) {
    value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else {
    value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  }
  form.value.telefone = value;
};

const formatarCEP = (event) => {
  let value = event.target.value.replace(/[^\d]/g, '');
  if (value.length > 5) {
    value = value.replace(/^(\d{5})(\d{0,3})/, '$1-$2');
  }
  form.value.cep = value;
};

const handleSubmit = async () => {
  errorMessage.value = '';
  
  if (!form.value.nomeCompleto) {
    errorMessage.value = 'Nome completo é obrigatório';
    return;
  }
  
  if (!form.value.dia || !form.value.mes || !form.value.ano) {
    errorMessage.value = 'Data de nascimento completa é obrigatória';
    return;
  }
  
  if (!form.value.cpf) {
    errorMessage.value = 'CPF é obrigatório';
    return;
  }
  
  const cpfLimpo = form.value.cpf.replace(/[^\d]/g, '');
  if (cpfLimpo.length !== 11) {
    errorMessage.value = 'CPF inválido';
    return;
  }
  
  if (!form.value.email) {
    errorMessage.value = 'Email é obrigatório';
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.value.email)) {
    errorMessage.value = 'Email inválido';
    return;
  }
  
  if (!form.value.telefone) {
    errorMessage.value = 'Telefone é obrigatório';
    return;
  }
  
  if (!form.value.password) {
    errorMessage.value = 'Senha é obrigatória';
    return;
  }
  
  if (form.value.password.length < 6) {
    errorMessage.value = 'A senha deve ter pelo menos 6 caracteres';
    return;
  }
  
  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'As senhas não coincidem';
    return;
  }
  
  const userData = {
    nome: form.value.nomeCompleto.trim(),
    email: form.value.email.trim().toLowerCase(),
    password: form.value.password,
    telefone: form.value.telefone.trim(),
    cpf: form.value.cpf.trim(),
    data_nascimento: formatarDataNascimento(),
    genero: form.value.genero || null,
    endereco: form.value.endereco || null,
    cidade: form.value.cidade || null,
    estado: form.value.estado || null,
    cep: form.value.cep || null,
  };
  
  const success = await registerState.registerPassenger(userData);
  
  if (success) {
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }
};

const limparErro = () => {
  errorMessage.value = '';
  registerState.clearError();
};

const toggleSenha = () => {
  mostrarSenha.value = !mostrarSenha.value;
};
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
      <div class="field-group">
        <label for="nomeCompleto">Nome completo *</label>
        <input
          id="nomeCompleto"
          type="text"
          v-model="form.nomeCompleto"
          placeholder="Digite seu nome completo"
          :disabled="registerState.state.loading"
          required
          @input="limparErro"
        />
      </div>

      <div class="field-group">
        <label>Data de nascimento *</label>
        <div class="date-row">
          <div class="date-field">
            <input
              type="text"
              list="dias"
              v-model="form.dia"
              placeholder="Dia"
              maxlength="2"
              :disabled="registerState.state.loading"
              required
              @input="limparErro"
            />
            <datalist id="dias">
              <option v-for="dia in dias" :key="dia" :value="String(dia).padStart(2, '0')" />
            </datalist>
          </div>

          <div class="date-field">
            <input
              type="text"
              list="meses"
              v-model="form.mes"
              placeholder="Mês"
              :disabled="registerState.state.loading"
              required
              @input="limparErro"
            />
            <datalist id="meses">
              <option v-for="mes in meses" :key="mes.value" :value="mes.label" />
            </datalist>
          </div>

          <div class="date-field">
            <input
              type="text"
              list="anos"
              v-model="form.ano"
              placeholder="Ano"
              maxlength="4"
              :disabled="registerState.state.loading"
              required
              @input="limparErro"
            />
            <datalist id="anos">
              <option v-for="ano in anos" :key="ano" :value="ano" />
            </datalist>
          </div>
        </div>
      </div>

      <div class="field-group">
        <label for="cpf">CPF *</label>
        <input
          id="cpf"
          type="text"
          v-model="form.cpf"
          placeholder="000.000.000-00"
          maxlength="14"
          :disabled="registerState.state.loading"
          required
          @input="formatarCPF"
        />
      </div>

      <div class="field-group">
        <label for="email">Email *</label>
        <input
          id="email"
          type="email"
          v-model="form.email"
          placeholder="seu@email.com"
          :disabled="registerState.state.loading"
          required
          @input="limparErro"
        />
      </div>

      <div class="field-group">
        <label for="telefone">Telefone *</label>
        <input
          id="telefone"
          type="tel"
          v-model="form.telefone"
          placeholder="(00) 90000-0000"
          maxlength="16"
          :disabled="registerState.state.loading"
          required
          @input="formatarTelefone"
        />
      </div>

      <div class="field-group">
        <label for="genero">Gênero</label>
        <select v-model="form.genero" :disabled="registerState.state.loading">
          <option value="">Selecione</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div class="field-group">
        <label for="endereco">Endereço</label>
        <input
          id="endereco"
          type="text"
          v-model="form.endereco"
          placeholder="Rua, número, bairro"
          :disabled="registerState.state.loading"
          @input="limparErro"
        />
      </div>

      <div class="row-fields">
        <div class="field-group half">
          <label for="cidade">Cidade</label>
          <input
            id="cidade"
            type="text"
            v-model="form.cidade"
            placeholder="Cidade"
            :disabled="registerState.state.loading"
          />
        </div>
        <div class="field-group half">
          <label for="estado">Estado</label>
          <input
            id="estado"
            type="text"
            v-model="form.estado"
            placeholder="Estado"
            :disabled="registerState.state.loading"
          />
        </div>
      </div>

      <div class="field-group">
        <label for="cep">CEP</label>
        <input
          id="cep"
          type="text"
          v-model="form.cep"
          placeholder="00000-000"
          maxlength="9"
          :disabled="registerState.state.loading"
          @input="formatarCEP"
        />
      </div>

      <div class="field-group">
        <label for="password">Senha *</label>
        <div class="password-input">
          <input
            id="password"
            :type="mostrarSenha ? 'text' : 'password'"
            v-model="form.password"
            placeholder="Mínimo 6 caracteres"
            :disabled="registerState.state.loading"
            required
            @input="limparErro"
          />
          <span 
            class="mdi toggle-password" 
            :class="mostrarSenha ? 'mdi-eye-off' : 'mdi-eye'" 
            @click="toggleSenha"
          ></span>
        </div>
      </div>

      <div class="field-group">
        <label for="confirmPassword">Confirmar senha *</label>
        <div class="password-input">
          <input
            id="confirmPassword"
            :type="mostrarSenha ? 'text' : 'password'"
            v-model="form.confirmPassword"
            placeholder="Digite a senha novamente"
            :disabled="registerState.state.loading"
            required
            @input="limparErro"
          />
        </div>
      </div>

      <p v-if="errorMessage" class="error-message">
        <span class="mdi mdi-alert-circle"></span> {{ errorMessage }}
      </p>
      <p v-if="registerState.state.error" class="error-message">
        <span class="mdi mdi-alert-circle"></span> {{ registerState.state.error }}
      </p>

      <button type="submit" class="btn-submit" :disabled="registerState.state.loading">
        <span v-if="registerState.state.loading" class="mdi mdi-loading mdi-spin"></span>
        {{ registerState.state.loading ? "Criando conta..." : "Criar conta" }}
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

.field-group input:disabled,
.field-group select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.date-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.date-field input {
  text-align: center;
}

.row-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.half {
  width: 100%;
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
  margin-top: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(244, 138, 29, 0.3);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: #dc2626;
  font-size: 0.85rem;
  text-align: center;
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: #fee2e2;
  border-radius: 10px;
}

.success-message {
  text-align: center;
  padding: 2rem;
}

.success-message .mdi-check-circle-circle {
  font-size: 64px;
  color: #22c55e;
}

.success-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #22c55e;
  margin: 1rem 0 0.5rem;
}

.success-message p {
  color: #666;
  margin: 0.5rem 0;
}

.loading-spinner {
  margin-top: 1.5rem;
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .date-row {
    gap: 8px;
  }
  
  .row-fields {
    gap: 8px;
  }
  
  .header h2 {
    font-size: 1.2rem;
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
}
</style>