<script setup>
import { useRoute, useRouter } from 'vue-router';
import SignupConfirmation from "@/components/auth/SignupConfirmation.vue";

const route = useRoute();
const router = useRouter();

const email = route.query.email || 'seuemail@gmail.com';

const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <SignupConfirmation :email="email" @go-to-login="goToLogin" />
</template>
