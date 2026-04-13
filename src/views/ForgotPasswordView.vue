<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLoginState } from '@/store/useLoginState';

const router = useRouter();
const { state, updatePassword } = useLoginState();
const etapa = ref(1);
const email = ref('');
const codigo = ref(['', '', '', '', '', '']);
const senhaEmail = ref('');
const novaSenha = ref('');
const confirmarSenha = ref('');
const erro = ref('');
const mostrarNovaSenha = ref(false);
const mostrarConfirmarSenha = ref(false);

// Etapa 1: Enviar Email
function enviarCodigo() {
  erro.value = '';

  if (!email.value) {
    erro.value = 'Por favor, digite seu e-mail';
    return;
  }

  // Validando se o email está registrado
  if (email.value !== state._credentials.email) {
    erro.value = 'Este e-mail não está registrado';
    return;
  }

  console.log('Enviando código para:', email.value);
  senhaEmail.value = email.value; // Salva para exibir na próxima etapa
  etapa.value = 2;
}

// Etapa 2: Validar Código
function handleCodigoInput(index, event) {
  const valor = event.target.value.replace(/\D/g, ''); // Apenas números
  if (valor.length > 1) {
    codigo.value[index] = valor[0];
  } else {
    codigo.value[index] = valor;
  }


  if (valor && index < 5) {
    document.getElementById(`codigo-${index + 1}`)?.focus();
  }
}

function handleCodigoKeydown(index, event) {
  if (event.key === 'Backspace' && !codigo.value[index] && index > 0) {
    document.getElementById(`codigo-${index - 1}`)?.focus();
  }
}

function enviarNovoCodigo() {
  console.log('Reenviando código para:', senhaEmail.value);
  erro.value = '';
}

function confirmarCodigo() {
  erro.value = '';
  const codigoCompleto = codigo.value.join('');

  if (codigoCompleto.length !== 6) {
    erro.value = 'Por favor, digite o código completo';
    return;
  }

  // Simulando validação do código (seria feita no backend)
  // Por enquanto, consideramos qualquer código de 6 dígitos como válido
  const codigoValidado = codigoCompleto === '000000' || /^\d{6}$/.test(codigoCompleto);

  if (!codigoValidado) {
    erro.value = 'Código inválido';
    return;
  }

  console.log('Confirmando código:', codigoCompleto);
  etapa.value = 3;
}

// Etapa 3: Nova Senha
function toggleNovaSenha() {
  mostrarNovaSenha.value = !mostrarNovaSenha.value;
}

function toggleConfirmarSenha() {
  mostrarConfirmarSenha.value = !mostrarConfirmarSenha.value;
}

function resetarSenha() {
  erro.value = '';

  if (!novaSenha.value) {
    erro.value = 'Por favor, digite sua nova senha';
    return;
  }

  if (!confirmarSenha.value) {
    erro.value = 'Por favor, confirme sua senha';
    return;
  }

  if (novaSenha.value !== confirmarSenha.value) {
    erro.value = 'As senhas não coincidem';
    return;
  }

  // Atualizando a senha no store
  const sucesso = updatePassword(senhaEmail.value, novaSenha.value);

  if (sucesso) {
    console.log('Senha redefinida com sucesso para:', senhaEmail.value);
    setTimeout(() => {
      router.push('/login');
    }, 1000);
  } else {
    erro.value = 'Erro ao redefinir senha. Tente novamente.';
  }
}

function voltarParaLogin() {
  router.push('/login');
}
</script>

<template>
  <div class="forgot-password-container">
    <div class="header">
      <span class="mdi mdi-map-marker-radius"></span>
      <h2>Bem vindo ao</h2>
      <h1><span>NEXT</span>ROUTER</h1>
    </div>

    <!-- Etapa 1: Email -->
    <div v-if="etapa === 1" class="etapa">
      <p class="texto-principal">Digite seu e-mail para enviarmos um código de verificação</p>

      <div class="input-group">
        <input v-model="email" type="email" required />
        <label>E-mail</label>
      </div>

      <button @click="enviarCodigo">Enviar código</button>

      <p v-if="erro" class="erro">{{ erro }}</p>

      <p class="voltar">
        <a href="#" @click.prevent="voltarParaLogin">Voltar para login</a>
      </p>
    </div>

    <!-- Etapa 2: Código de Verificação -->
    <div v-if="etapa === 2" class="etapa">
      <p class="texto-principal">
        Digite o código de verificação que foi enviado para <strong>{{ senhaEmail }}</strong>
      </p>

      <div class="codigo-inputs">
        <input
          v-for="(digit, index) in codigo"
          :id="`codigo-${index}`"
          :key="index"
          v-model="codigo[index]"
          type="text"
          maxlength="1"
          class="codigo-input"
          @input="handleCodigoInput(index, $event)"
          @keydown="handleCodigoKeydown(index, $event)"
        />
      </div>

      <p class="reenviar-texto">
        Não recebeu?
        <a href="#" @click.prevent="enviarNovoCodigo">Enviar novo código</a>
      </p>

      <button @click="confirmarCodigo">Confirmar</button>

      <p v-if="erro" class="erro">{{ erro }}</p>
    </div>

    <!-- Etapa 3: Nova Senha -->
    <div v-if="etapa === 3" class="etapa">
      <p class="texto-principal">Digite sua nova senha</p>

      <div class="input-group">
        <input
          v-model="novaSenha"
          :type="mostrarNovaSenha ? 'text' : 'password'"
          required
        />
        <label>Nova senha</label>

        <span
          class="mdi toggle"
          :class="mostrarNovaSenha ? 'mdi-eye-off' : 'mdi-eye'"
          @click="toggleNovaSenha"
        ></span>
      </div>

      <div class="input-group">
        <input
          v-model="confirmarSenha"
          :type="mostrarConfirmarSenha ? 'text' : 'password'"
          required
        />
        <label>Confirme sua senha</label>

        <span
          class="mdi toggle"
          :class="mostrarConfirmarSenha ? 'mdi-eye-off' : 'mdi-eye'"
          @click="toggleConfirmarSenha"
        ></span>
      </div>

      <button @click="resetarSenha">Redefinir Senha</button>

      <p v-if="erro" class="erro">{{ erro }}</p>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  min-height: 100vh;
  padding: 20px;
}

.forgot-password-container > * {
  width: 100%;
  max-width: 350px;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.mdi-map-marker-radius {
  font-size: 80px;
  color: var(--primary);
  margin: 0 auto 0px auto;
  display: block;
}

h1 {
  font-size: 45px;
  margin-bottom: 5px;
  text-align: center;
  font-weight: bold;
}

h1 span {
  color: var(--primary);
}

h2 {
  font-size: 35px;
  text-align: center;
  margin-bottom: -15px;
  font-weight: bolder;
}

.etapa {
  width: 100%;
}

.texto-principal {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.6;
}

.input-group {
  position: relative;
  margin-bottom: 15px;
  width: 100%;
}

.input-group input {
  width: 100%;
  padding: 12px 10px;
  border: none;
  border-bottom: 2px solid var(--primary);
  outline: none;
  background: transparent;
  color: var(--primary);
  font-size: 14px;
}

.input-group label {
  position: absolute;
  left: 10px;
  top: 12px;
  color: #999;
  font-size: 14px;
  pointer-events: none;
  transition: 0.3s;
}

.input-group input:focus + label,
.input-group input:valid + label {
  top: -8px;
  font-size: 12px;
  color: var(--primary);
}

.toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #999;
}

.toggle:hover {
  color: var(--primary);
}

.codigo-inputs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.codigo-input {
  width: 45px;
  height: 50px;
  border: 2px solid var(--primary);
  border-radius: 8px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: var(--primary);
  outline: none;
  transition: 0.2s;
}

.codigo-input:focus {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}

.reenviar-texto {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-bottom: 15px;
}

.reenviar-texto a {
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
}

.reenviar-texto a:hover {
  color: var(--primary-hover);
}

button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  margin-bottom: 10px;
}

button:hover {
  background: var(--primary-hover);
}

.erro {
  color: #d32f2f;
  font-size: 12px;
  text-align: center;
  margin-top: 10px;
}

.voltar {
  text-align: center;
  margin-top: 15px;
}

.voltar a {
  color: var(--primary);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.voltar a:hover {
  color: var(--primary-hover);
}
</style>
