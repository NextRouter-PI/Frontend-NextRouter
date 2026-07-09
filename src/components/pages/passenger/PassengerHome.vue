<script setup>
import { computed } from 'vue'
import { state } from '@/stores/state'

const userLogged = computed(() => state.user)
</script>

<template>
  <div class="home-page">
    <div class="welcome-card">
      <div class="icon-wrap">
        <span class="mdi mdi-account-circle-outline"></span>
      </div>
      <h1>Olá, {{ userLogged.name }}</h1>
      <p class="subtitle">Bem-vindo ao NextRouter</p>
      <div class="badge">
        <span class="mdi mdi-account-check"></span>
        {{ userLogged.type === 'passenger' ? 'Passageiro' : 'Motorista' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
}

.welcome-card {
  text-align: center;
  max-width: 360px;
  width: 100%;
  padding: 40px 24px;
  background: var(--superfice);
  border: 1px solid rgba(223, 128, 26, 0.12);
  border-radius: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.dark .welcome-card {
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
}

.icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(223,128,26,0.1);
  margin-bottom: 20px;
}

.icon-wrap .mdi {
  font-size: 2.5rem;
  color: var(--primary);
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 6px;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0 0 16px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 16px;
  background: rgba(223,128,26,0.1);
  color: var(--primary);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}
</style>
