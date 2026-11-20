<script setup>
import { computed } from 'vue'
import { state } from '@/stores/state'
import { navigationItems } from '@/navigation'

const items = computed(() => navigationItems(state.role))
</script>

<template>
  <footer class="bottom-nav">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :title="item.title"
      :aria-label="item.title"
    >
      <span class="nav-icon-wrap">
        <span class="mdi" :class="item.icon" aria-hidden="true"></span>
      </span>
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
  height: var(--bottom-nav-height);
  background: var(--chrome-bg);
  border-top: 2px solid var(--primary);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 6px;
  z-index: 1000;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.28);
}

.nav-item {
  position: relative;
  text-decoration: none;
  color: var(--chrome-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 52px;
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
    color 0.25s var(--ease-fluid), box-shadow 0.28s var(--ease-fluid),
    width 0.25s var(--ease-fluid), height 0.25s var(--ease-fluid);
}

.nav-icon-wrap .mdi {
  font-size: 24px;
  line-height: 1;
}

.nav-item small {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: color 0.22s var(--ease-fluid), transform 0.25s var(--ease-fluid),
    opacity 0.22s var(--ease-fluid);
}

.nav-item:hover {
  color: var(--chrome-text);
}

.nav-item:active .nav-icon-wrap {
  transform: scale(0.92);
}

.nav-item.router-link-active {
  color: var(--primary);
}

.nav-item.router-link-active .nav-icon-wrap {
  width: 48px;
  height: 48px;
  background: var(--primary);
  color: #ffffff;
  border: 3px solid var(--chrome-bg);
  box-shadow: var(--shadow-primary);
  transform: translateY(-16px);
}

.nav-item.router-link-active small {
  color: var(--primary);
  transform: translateY(-10px);
}
</style>
