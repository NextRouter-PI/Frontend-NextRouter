<script setup>
import { computed } from 'vue'
import router from '@/router'
import { state } from '@/store/state'
import { useLoginState } from '@/store/useLoginState'

const userLogged = computed(() => state.user)
const { logout } = useLoginState()

function handleLogout() {
  logout()
  router.push('/login')

}
</script>

<template>
  <div class="container">
    <h1>Home {{ userLogged.type }}</h1>

    <p>
      Bem-vindo, {{ userLogged.name }}
    </p>

    <button @click="handleLogout">Sair</button>
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
  background: var(--primary);
  color: white;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  opacity: 0.9;
}
</style>
