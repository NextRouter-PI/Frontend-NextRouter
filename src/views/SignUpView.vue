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
}

.signup-container {
  width: 100%;
  border-radius: 32px;
}

.signup-header {
  text-align: center;
  margin-bottom: 3rem;
}

.signup-header h1 {
  font-size: 2.5rem;
  color: var(--primary);
  margin-bottom: 0.75rem;
  font-weight: 700;
}

.subtitle {
  font-size: 1.1rem;
  color: #666;
  line-height: 1.5;
}

.signup-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.login-link {
  color: #666;
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
  color: #fb923c;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .signup-container {
    padding: 1.5rem;
  }

  .signup-header h1 {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 1rem;
  }
}
</style>
