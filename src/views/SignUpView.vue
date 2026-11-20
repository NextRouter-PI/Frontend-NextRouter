<script setup>
import { RouterLink } from 'vue-router'
import PublicShell from '@/components/layout/PublicShell.vue'
import RoleSelector from '@/components/auth/RoleSelector.vue'
</script>

<template>
  <PublicShell>
    <section class="signup-choice">
      <h1 class="choice-heading">Escolha sua forma<br />de cadastro</h1>

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

.choice-heading {
  margin: 0 0 36px;
  font-size: 1.9rem;
  line-height: 1.2;
  font-weight: 800;
  color: var(--text);
  text-align: center;
}

.signup-footer {
  text-align: center;
  padding-top: 18px;
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
</style>
