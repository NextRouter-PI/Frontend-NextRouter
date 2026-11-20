<script setup>
import { RouterLink } from 'vue-router'
import PublicShell from '@/components/layout/PublicShell.vue'
import RoleSelector from '@/features/auth/components/RoleSelector.vue'
</script>

<template>
  <PublicShell wide>
    <section class="signup-choice">
      <div class="choice-header">
        <h1 class="choice-heading">Escolha sua forma de cadastro</h1>
        <span class="choice-bar" aria-hidden="true"></span>
      </div>

      <RoleSelector />

      <div class="signup-footer">
        <p class="footer-row">
          <RouterLink to="/empresas" class="footer-link">Pesquisar empresas sem criar conta</RouterLink>
        </p>
        <p class="footer-row">
          Já possui uma conta?
          <RouterLink to="/login" class="footer-link">Fazer login</RouterLink>
        </p>
      </div>
    </section>
  </PublicShell>
</template>

<style scoped>
.signup-choice {
  padding: 20px 6px 12px;
}

.choice-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 34px;
}

.choice-heading {
  margin: 0;
  font-size: 1.75rem;
  line-height: 1.2;
  font-weight: 800;
  color: var(--text);
  text-align: center;
}

.choice-bar {
  display: none;
}

.signup-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-row {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.footer-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.footer-link:hover {
  opacity: 0.85;
}

@media (min-width: 768px) {
  .signup-choice {
    padding: 36px 8px 20px;
  }

  .choice-heading {
    color: var(--primary);
    font-size: 1.85rem;
  }

  .choice-bar {
    display: block;
    width: 180px;
    height: 2px;
    margin-top: 10px;
    border-radius: 999px;
    background: var(--primary);
  }
}
</style>
