<script setup>
import AuthBranding from '@/components/ui/AuthBranding.vue'
import PasswordResetForm from '@/components/auth/PasswordResetForm.vue'
</script>

<template>
  <div class="forgot-password-container">
    <AuthBranding />

    <PasswordResetForm />
    <RouterLink to="/login" class="back-link">Voltar para login</RouterLink>
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

.back-link { color: var(--text); margin-top: 20px; text-align: center; }
</style>
