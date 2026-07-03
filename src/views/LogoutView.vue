<script setup>
import { onMounted } from 'vue'
import api from '@/api/client'
import { state } from '@/stores/state'

onMounted(async () => {
  localStorage.setItem('manualLogout', 'true')
  try {
    await api.post('logout/')
  } catch (error) {
    console.error(error)
  }
  localStorage.removeItem('access')
  localStorage.removeItem('user')
  state.logged = false
  state.user = null
  state.access = null
  state.error = null
  window.location.href = '/login'
})
</script>

<template>
  <div class="logout-container">
    <p>Saindo...</p>
  </div>
</template>

<style scoped>
.logout-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  color: var(--text-muted);
}
</style>
