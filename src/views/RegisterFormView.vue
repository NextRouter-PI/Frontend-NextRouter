<script setup>
import { ref } from "vue";
import { useLoginState } from "@/store/useLoginState";
import { useRouter, RouterLink } from "vue-router";

const router = useRouter();
const { register, state } = useLoginState();

const nome = ref("");
const email = ref("");
const telefone = ref("");
const senha = ref("");
const confirmarSenha = ref("");
const tipo = ref("passageiro");
const erro = ref("");
const sucesso = ref(false);
const mostrarSenha = ref(false);

async function handleRegister() {
  erro.value = "";

  if (senha.value !== confirmarSenha.value) {
    erro.value = "As senhas não coincidem";
    return;
  }

  if (senha.value.length < 6) {
    erro.value = "A senha deve ter pelo menos 6 caracteres";
    return;
  }

  const userData = {
    email: email.value,
    password: senha.value,
    nome: nome.value || undefined,
    telefone: telefone.value || undefined,
    tipo: tipo.value,
  };

  const success = await register(userData);

  if (success) {
    sucesso.value = true;
    setTimeout(() => {
      router.push("/");
    }, 1500);
  } else {
    erro.value = state.error || "Erro ao criar conta";
  }
}

function toggleSenha() {
  mostrarSenha.value = !mostrarSenha.value;
}
</script>

<template>
  <div class="register-container">
    <div class="header">
      <span class="mdi mdi-map-marker-radius"></span>
      <h2>Criar conta no</h2>
      <h1><span>NEXT</span>ROUTER</h1>
    </div>

    <div v-if="sucesso" class="sucesso-mensagem">
      <span class="mdi mdi-check-circle"></span>
      <p>Conta criada com sucesso! Redirecionando...</p>
    </div>

    <form v-else @submit.prevent="handleRegister">
      <div class="input-group">
        <input v-model="nome" type="text" required />
        <label>Nome completo</label>
      </div>

      <div class="input-group">
        <input v-model="email" type="email" required />
        <label>Email</label>
      </div>

      <div class="input-group">
        <input v-model="telefone" type="tel" />
        <label>Telefone (opcional)</label>
      </div>

      <div class="input-group">
        <select v-model="tipo" required>
          <option value="passageiro">Passageiro</option>
          <option value="motorista">Motorista</option>
          <option value="empresa">Empresa</option>
        </select>
        <label>Tipo de conta</label>
      </div>

      <div class="input-group">
        <input
          v-model="senha"
          :type="mostrarSenha ? 'text' : 'password'"
          required
          minlength="6"
        />
        <label>Senha</label>
        <span class="mdi toggle" :class="mostrarSenha ? 'mdi-eye-off' : 'mdi-eye'" @click="toggleSenha"></span>
      </div>

      <div class="input-group">
        <input
          v-model="confirmarSenha"
          :type="mostrarSenha ? 'text' : 'password'"
          required
        />
        <label>Confirmar senha</label>
      </div>

      <button type="submit" :disabled="state.loading">
        {{ state.loading ? "Criando conta..." : "Criar conta" }}
      </button>

      <p v-if="erro" class="erro">{{ erro }}</p>
    </form>

    <p class="login-link">
      Já tem conta?
      <RouterLink to="/login">Entrar</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  min-height: 100vh;
  padding: 20px;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.mdi-map-marker-radius {
  font-size: 60px;
  color: var(--primary);
}

h1 {
  font-size: 35px;
  margin-bottom: 5px;
  font-weight: bold;
}

h1 span {
  color: var(--primary);
}

h2 {
  font-size: 20px;
  margin-bottom: -10px;
  font-weight: bolder;
}

form, .sucesso-mensagem {
  width: 100%;
  max-width: 350px;
}

.sucesso-mensagem {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--success, #22c55e);
}

.sucesso-mensagem .mdi {
  font-size: 60px;
  margin-bottom: 10px;
}

.input-group {
  position: relative;
  margin-bottom: 15px;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 12px 10px;
  border: none;
  border-bottom: 2px solid var(--primary);
  outline: none;
  background: transparent;
  color: var(--primary);
  font-size: 14px;
}

.input-group select {
  cursor: pointer;
  appearance: none;
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
.input-group input:valid + label,
.input-group select:focus + label,
.input-group select:has(option:selected:not([value=""])) + label {
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

button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: white;
  font-weight: bold;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

button:hover:not(:disabled) {
  background: var(--primary-hover);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.erro {
  color: var(--error);
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}

.login-link {
  margin-top: 20px;
  color: #666;
}

.login-link a {
  color: var(--primary);
  font-weight: bold;
}
</style>
