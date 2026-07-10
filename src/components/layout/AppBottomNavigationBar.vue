<script setup>
import { useLoginState } from '@/stores/useLoginState'
import { computed } from 'vue'
import { state } from '@/stores/state'

const { logout } = useLoginState()
const isCompany = computed(() => state.user?.type === 'company')

async function handleLogout() {
  await logout()
}
</script>

<template>
  <footer class="bottom-nav">
    <router-link :to="`/`" class="nav-item" title="Home">
      <span class="mdi mdi-home"></span>
      <small>Home</small>
    </router-link>

    <router-link :to="`/usuario`" class="nav-item" title="Usuário">
      <span class="mdi mdi-account"></span>
      <small>Usuário</small>
    </router-link>

    <router-link :to="`/transporte`" class="nav-item" :title="isCompany ? 'Veículos' : 'Transporte'">
      <span :class="isCompany ? 'mdi mdi-bus' : 'mdi mdi-car'"></span>
      <small>{{ isCompany ? 'Veículos' : 'Transporte' }}</small>
    </router-link>

    <router-link :to="`/lista`" class="nav-item" :title="isCompany ? 'Rotas' : 'Lista'">
      <span :class="isCompany ? 'mdi mdi-map-outline' : 'mdi mdi-format-list-bulleted'"></span>
      <small>{{ isCompany ? 'Rotas' : 'Lista' }}</small>
    </router-link>

    <button class="nav-item logout-btn" title="Sair" @click="handleLogout">
      <span class="mdi mdi-logout"></span>
      <small>Sair</small>
    </button>
  </footer>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background: var(--superfice);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  border-top: 1px solid rgba(223, 128, 26, 0.1);
}

.nav-item {
  text-decoration: none;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 12px;
}

.nav-item span {
  font-size: 26px;
  transition: all 0.4s ease;
}

.nav-item small {
  font-size: 11px;
  transition: all 0.4s ease;
}

.nav-item:hover span {
  transform: scale(1.1);
}

.nav-item:active span {
  transform: scale(0.9);
}

.nav-item.router-link-active span {
  background: var(--gradient-primary);
  color: var(--superfice);
  box-shadow: var(--shadow-primary);
  padding: 6px 12px;
  border-radius: 50%;
  transform: scale(1.3) translateY(-6px);
}

.nav-item.router-link-active small {
  color: var(--primary);
  transform: translateY(-4px);
}

.logout-btn {
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  color: var(--text-muted);
}
</style>
