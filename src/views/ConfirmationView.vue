<script setup>
import { useRouter } from 'vue-router';
import SignupConfirmation from "@/features/auth/components/SignupConfirmation.vue";

const router = useRouter();

const goBack = () => {
  router.push('/signup');
};
</script>

<template>
  <div class="confirmation-wrapper">
    <button type="button" class="btn-back-top" @click="goBack" aria-label="Voltar">
      <BaseIcon name="mdi-arrow-left" />
    </button>
    <SignupConfirmation @continue-signup="goBack" />
  </div>
</template>

<style lang="scss" scoped>
.confirmation-wrapper {
  position: relative;
  min-height: 100vh;
}

.btn-back-top {
  position: absolute;
  top: 20px;
  left: 20px;
  background: none;
  border: none;
  color: var(--text);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: 0.2s;
  z-index: 10;
}

.btn-back-top:hover {
  color: var(--primary);
  left: 10px;
}
</style>
