<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginState } from '@/stores/useLoginState'
import { state } from '@/stores/state'

const router = useRouter()
const { logout } = useLoginState()
async function leave() {
  if (await logout()) window.location.replace(router.resolve({ name: 'login' }).href)
}
onMounted(leave)
</script>

<template>
  <section class="logout-container">
    <p v-if="state.loading" role="status">Saindo...</p>
    <template v-else>
      <p role="alert">{{ state.error }}</p>
      <button type="button" @click="leave">Tentar sair novamente</button>
      <RouterLink to="/">Voltar</RouterLink>
    </template>
  </section>
</template>

<style scoped>
.logout-container {
  display: grid;
  justify-content: center;
  align-content: center;
  gap: 1rem;
  min-height: 80vh;
  padding: 2rem;
  color: var(--text);
}
</style>
