<script setup>
import router from "@/router";
import { useLoginState } from "@/store/useLoginState";

const { state, logout } = useLoginState();

function Realogout() {
  logout();
  router.push("/login");
}
</script>

<template>
  <div class="container">
    <h1>Home Motoristas</h1>

    <p v-if="state.user">
      Bem-vindo, {{ state.user.nome }}
    </p>

    <button @click="Realogout()">
      Sair
    </button>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  padding: 20px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

h1 {
  font-size: 32px;
  margin: 0;
}

p {
  font-size: 18px;
  margin: 0;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  opacity: 0.9;
}
</style>