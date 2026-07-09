<script setup>
import { RouterLink } from 'vue-router';
import RoleSelector from "@/components/auth/RoleSelector.vue";

</script>

<template>
  <div class="signup-view">
    <div class="signup-container">
      <div class="signup-header">
        <h1>Comece sua jornada</h1>
        <p class="subtitle">Escolha como deseja utilizar nossa plataforma</p>
      </div>

      <RoleSelector />

      <div class="signup-footer">
        <p class="login-link">
          Já possui uma conta?
          <RouterLink to="/login" class="login-button">Fazer login</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signup-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.signup-container {
  width: 100%;
  max-width: 500px;
}

.signup-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.signup-header h1 {
  font-size: 2rem;
  color: var(--text);
  margin-bottom: 0.75rem;
  font-weight: 800;
}

.subtitle {
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.signup-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
}

.login-link {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.login-button {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.25rem;
  transition: color 0.2s ease;
}

.login-button:hover {
  color: var(--primary-light);
  text-decoration: underline;
}
</style>
