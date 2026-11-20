<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { state } from '@/stores/state'
import { navigationItems } from '@/navigation'

const route = useRoute()
const items = computed(() => navigationItems(state.role))

function isActive(to) {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <footer class="bottom-nav">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item.to) }"
      :title="item.title"
      :aria-label="item.title"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      <span class="nav-icon-wrap">
        <span class="mdi" :class="item.icon" aria-hidden="true"></span>
      </span>
      <small>{{ item.title }}</small>
    </RouterLink>
  </footer>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background: var(--chrome-bg);
  border-top: 2px solid var(--primary);
  display: flex;
  align-items: center;
  padding: 0 4px;
  z-index: 1000;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.25);
}

.nav-item {
  flex: 1 1 0;
  min-width: 0;
  position: relative;
  text-decoration: none;
  border: none;
  color: var(--chrome-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 100%;
  transition: color 0.22s var(--ease-fluid);
}

.nav-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.28s var(--ease-fluid), background-color 0.25s var(--ease-fluid),
    color 0.25s var(--ease-fluid), width 0.25s var(--ease-fluid), height 0.25s var(--ease-fluid);
}

.nav-icon-wrap .mdi {
  font-size: 24px;
  line-height: 1;
}

.nav-item small {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: color 0.22s var(--ease-fluid), transform 0.25s var(--ease-fluid);
}

.nav-item:hover {
  color: var(--chrome-text);
}

.nav-item:active .nav-icon-wrap {
  transform: scale(0.92);
}

.nav-item.active {
  color: var(--primary);
}

.nav-item.active .nav-icon-wrap {
  width: 48px;
  height: 48px;
  background: var(--primary);
  color: #ffffff;
  border: 3px solid var(--chrome-bg);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.32);
  transform: translateY(-16px);
}

.nav-item.active small {
  color: var(--primary);
  transform: translateY(-10px);
}
</style>
