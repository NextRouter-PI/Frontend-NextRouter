<script setup>
import { useRouter } from 'vue-router'
import PublicShell from '@/components/layout/PublicShell.vue'
import PasswordResetForm from '@/components/auth/PasswordResetForm.vue'

const router = useRouter()
</script>

<template>
  <PublicShell
    show-back
    title-prefix="Recuperar "
    title-highlight="Senha"
    @back="router.push('/login')"
  >
    <div class="forgot-card">
      <PasswordResetForm />
      <div class="forgot-footer">
        <RouterLink to="/login" class="back-link">Voltar para login</RouterLink>
      </div>
    </div>
  </PublicShell>
</template>

<style scoped>
.forgot-card {
  width: 100%;
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 26px 20px;
  box-shadow: var(--shadow);
}

.forgot-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  text-align: center;
}

.back-link {
  color: var(--primary);
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
}

.back-link:hover {
  opacity: 0.85;
}

@media (min-width: 768px) {
  .forgot-card {
    padding: 36px 32px;
    margin-top: 18px;
  }
}
</style>
