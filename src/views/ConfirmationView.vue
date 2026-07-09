<script setup>
import { useRoute, useRouter } from 'vue-router';
import SignupConfirmation from "@/components/auth/SignupConfirmation.vue";

const route = useRoute();
const router = useRouter();

const email = route.query.email || 'seuemail@gmail.com';

const goToLogin = () => {
  router.push('/login');
};

const goBack = () => {
  router.push('/signup');
};
</script>

<template>
  <div class="confirmation-wrapper">
    <button class="btn-back-top" @click="goBack" aria-label="Voltar">
      <span class="mdi mdi-arrow-left"></span>
    </button>
    <SignupConfirmation :email="email" @go-to-login="goToLogin" />
  </div>
</template>

<style scoped>
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
