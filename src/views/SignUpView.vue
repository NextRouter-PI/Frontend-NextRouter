<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="signup-view">
    <div class="role-message">
      <h1>Escolha a sua forma de cadastro.</h1>
    </div>

    <div class="role-select">
      <RouterLink to="/register" class="role-button">
        Criar conta
      </RouterLink>
      <RouterLink to="/signup/usuario/cidade" class="role-button secondary">
        Cadastro detalhado (Passageiro)
      </RouterLink>
      <RouterLink to="/signup/motorista/empresa" class="role-button secondary">
        Cadastro detalhado (Motorista)
      </RouterLink>
      <RouterLink to="/signup/empresa" class="role-button secondary">
        Cadastro detalhado (Empresa)
      </RouterLink>
    </div>

    <p class="login-link">
      Já tem conta?
      <RouterLink to="/login">Entrar</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.signup-view {
  max-width: 740px;
  margin: 3rem auto;
  padding: 1.5rem;
}

.signup-view h1 {
  text-align: center;
  margin-bottom: 1.2rem;
}

.role-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  max-width: 420px;
  margin: 0 auto 1.5rem;
}

.role-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 56px;
  padding: 1rem 1.4rem;
  border: none;
  border-radius: 12px;
  background: #f97316;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.role-button:hover {
  background: #fb923c;
  transform: translateY(-1px);
}

.role-message {
  text-align: center;
  color: #000;
  margin-bottom: 1rem;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
  color: var(--primary);
  font-weight: bold;
}

.role-button.secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}

.role-button.secondary:hover {
  background: rgba(249, 115, 22, 0.1);
}
</style>
