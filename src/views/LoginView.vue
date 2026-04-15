<script setup>
import { ref } from "vue";
import { useLoginState } from "@/store/useLoginState";
import { useRouter } from "vue-router";
import { RouterLink } from "vue-router";

const email = ref("");
const senha = ref("");
const erro = ref("");
const mostrarSenha = ref(false);

const { login, state } = useLoginState();
const router = useRouter();

async function handleLogin() {
  erro.value = "";

  const sucesso = await login(email.value, senha.value);

  if (sucesso) {
    router.push("/");
  } else {
    erro.value = state.error || "Email ou senha inválidos";
  }
}

function toggleSenha() {
  mostrarSenha.value = !mostrarSenha.value;
}
</script>

<template>
  <div class="login-container">
    <div class="header">
  <span class="mdi mdi-map-marker-radius"></span>
  <h2>Bem vindo ao</h2>
  <h1><span>NEXT</span>ROUTER</h1>
</div>
    <p>Entrar em sua conta:</p>

    <div class="input-group">
      <input v-model="email" required />
      <label>Nome de usuário</label>
    </div>

    <div class="input-group">
      <input
        v-model="senha"
        :type="mostrarSenha ? 'text' : 'password'"
        required
      />
      <label>Senha</label>

      <span
        class="mdi toggle"
        :class="mostrarSenha ? 'mdi-eye-off' : 'mdi-eye'"
        @click="toggleSenha"
      ></span>
    </div>

    <button @click="handleLogin" :disabled="state.loading">
      {{ state.loading ? "Carregando..." : "Entrar" }}
    </button>

    <p v-if="erro" class="erro">{{ erro }}</p>

    <p>
      Esqueceu a senha?
      <RouterLink to="/forgot-password">Clique Aqui</RouterLink>
    </p>

    <RouterLink to="/signup" class="secondary">Criar nova conta</RouterLink>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  height: 100vh;
}

.login-container > * {
  width: 100%;
  max-width: 350px;
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

p {
  margin-bottom: 15px;
  text-align: center;
  color: #666;
}

.input-group {
  position: relative;
  margin-bottom: 15px;
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

button,
.secondary {
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

.secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}

.secondary:hover {
  background: var(--primary);
  color: white;
}

a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

a:hover {
  text-decoration: underline;
}

.erro {
  color: var(--error);
  font-size: 14px;
}
</style>
