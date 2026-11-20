<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Logo from '@/assets/images/logo.png'
import { state } from '@/stores/state'
import { navigationItems } from '@/navigation'

const route = useRoute()
const isCompany = computed(() => state.role === 'company')
const items = computed(() => navigationItems(state.role))

function isActive(to) {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <aside class="sidebar">
    <RouterLink to="/" class="logo">
      <div class="logo-content">
        <img :src="Logo" alt="NextRouter" />
        <h1>NextRouter <small v-if="isCompany" class="admin-tag">ADMIN</small></h1>
      </div>
    </RouterLink>

    <nav class="nav" aria-label="Navegação principal">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
        :title="item.title"
        :aria-current="isActive(item.to) ? 'page' : undefined"
      >
        <span class="nav-icon-wrap">
          <span class="mdi" :class="item.icon" aria-hidden="true"></span>
        </span>
        <small>{{ item.title }}</small>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--chrome-bg);
  border-right: 2px solid var(--primary);
  z-index: 101;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 20px;
  gap: 24px;
  transition: width 0.3s var(--ease-fluid);
  overflow: hidden;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.22);
}

.sidebar:hover {
  width: 224px;
}

.logo {
  width: 100%;
  text-decoration: none;
  border: none;
}

.logo-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 18px;
}

.logo-content img {
  height: 36px;
  width: auto;
  flex-shrink: 0;
}

.logo-content h1 {
  font-size: 17px;
  font-weight: 700;
  color: var(--chrome-text);
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.25s var(--ease-fluid), transform 0.25s var(--ease-fluid);
  white-space: nowrap;
}

.sidebar:hover .logo-content h1 {
  opacity: 1;
  transform: translateX(0);
}

.admin-tag {
  font-size: 10px;
  font-weight: 600;
  color: var(--primary);
  margin-left: 2px;
}

.nav {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.nav-item {
  position: relative;
  text-decoration: none;
  border: none;
  color: var(--chrome-muted);
  display: flex;
  align-items: center;
  gap: 14px;
  width: calc(100% - 16px);
  padding: 6px 10px;
  border-radius: 12px;
  transition: background-color 0.22s var(--ease-fluid), color 0.22s var(--ease-fluid),
    transform 0.18s var(--ease-fluid);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--chrome-text);
}

.nav-item:active {
  transform: scale(0.96);
}

.nav-icon-wrap {
  width: 42px;
  height: 42px;
  min-width: 42px;
  min-height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  background: transparent;
  transition: background-color 0.25s var(--ease-fluid), color 0.25s var(--ease-fluid),
    transform 0.25s var(--ease-fluid);
}

.nav-item:hover .nav-icon-wrap {
  color: var(--primary);
  transform: scale(1.06);
}

.nav-item small {
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.22s var(--ease-fluid), transform 0.22s var(--ease-fluid);
  white-space: nowrap;
}

.sidebar:hover .nav-item small {
  opacity: 1;
  transform: translateX(0);
}

.nav-item.active {
  color: var(--chrome-text);
}

.nav-item.active .nav-icon-wrap {
  color: #ffffff;
  background: var(--primary);
}
</style>
