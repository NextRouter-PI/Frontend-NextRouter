<script setup>
import { computed } from 'vue'
import { state } from '@/stores/state'
import { navigationItems } from '@/navigation'

const items = computed(() => navigationItems(state.role))
</script>

<template>
  <footer class="bottom-nav">
    <router-link v-for="item in items" :key="item.to" :to="item.to" class="nav-item" :title="item.title">
      <span class="mdi" :class="item.icon"></span>
      <small>{{ item.title }}</small>
    </router-link>
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
</style>
