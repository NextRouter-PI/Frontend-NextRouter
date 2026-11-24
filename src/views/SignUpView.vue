<script setup>
import { RouterLink } from 'vue-router'
import PublicShell from '@/components/layout/PublicShell.vue'
import RoleSelector from '@/features/auth/components/RoleSelector.vue'
</script>

<template>
  <PublicShell wide>
    <section class="signup-choice">
      <div class="choice-header">
        <p class="choice-eyebrow">Criar conta</p>
        <h1 class="choice-heading">Como você vai usar o <span>NextRouter</span>?</h1>
        <span class="choice-bar" aria-hidden="true"></span>
      </div>

      <RoleSelector />

      <div class="signup-footer">
        <p class="footer-row">
          <RouterLink to="/companies" class="footer-link">Pesquisar empresas sem criar conta</RouterLink>
        </p>
        <p class="footer-row">
          Já possui uma conta?
          <RouterLink to="/login" class="footer-link">Fazer login</RouterLink>
        </p>
      </div>
    </section>
  </PublicShell>
</template>

<style lang="scss" scoped>
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

.choice-heading span {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.choice-eyebrow {
  margin-bottom: 6px;
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
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
    font-size: 2.2rem;
    letter-spacing: -0.02em;
  }

  .choice-bar {
    display: block;
    width: 64px;
    height: 3px;
    margin-top: 14px;
    border-radius: 999px;
    background: var(--gradient-brand);
  }
}
</style>
