<script setup>
import { useRoute } from 'vue-router'
import Logo from '@/assets/images/logo.webp'
import { ROUTE_PATHS } from '@/constants'

defineProps({
  isMobile: { type: Boolean, default: false },
  badge: { type: String, default: '' },
})

const route = useRoute()

function isActive(target) {
  const path = typeof target === 'string' ? target : target?.matchPrefix || target?.to || ''
  if (path === ROUTE_PATHS.HOME) return route.path === ROUTE_PATHS.HOME
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <aside v-if="!isMobile" class="app-sidebar">
    <div class="sidebar-inner">
      <slot name="brand">
        <RouterLink :to="ROUTE_PATHS.HOME" class="sidebar-logo" aria-label="NextRouter - Início">
          <div class="sidebar-logo-content">
            <img :src="Logo" alt="NextRouter" />
            <span class="sidebar-brand-title">
              NextRouter <small v-if="badge" class="sidebar-badge">{{ badge }}</small>
            </span>
          </div>
        </RouterLink>
      </slot>

      <nav class="sidebar-nav" aria-label="Navegação principal">
        <slot :is-active="isActive" :is-mobile="false" />
      </nav>
    </div>
  </aside>

  <nav v-else class="app-bottom-nav" aria-label="Navegação principal">
    <slot :is-active="isActive" :is-mobile="true" />
  </nav>
</template>

<style lang="scss" scoped>
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--chrome-bg);
  z-index: $z-sidebar;
  transition: width $duration-slow $ease-fluid;

  &::after {
    content: '';
    position: absolute;
    top: calc(var(--header-height) - 2px);
    right: 0;
    bottom: 0;
    width: 2px;
    background: var(--primary);
    box-shadow: 4px 0 14px rgba(0, 0, 0, 0.22);
    pointer-events: none;
  }

  &:hover,
  &:has(:focus-visible) {
    width: $sidebar-width-expanded;

    .sidebar-brand-title,
    :deep(.nav-label) {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

.sidebar-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 $space-5;
  gap: $space-6;
  overflow: hidden;
}

.sidebar-logo {
  width: 100%;
  height: var(--header-height);
  padding-top: var(--safe-top);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  text-decoration: none;

  &-content {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: 0 13px;

    img {
      height: 36px;
      width: auto;
      max-width: none;
      flex-shrink: 0;
    }
  }
}

.sidebar-brand-title {
  font-size: 17px;
  font-weight: $font-bold;
  color: var(--chrome-text);
  opacity: 0;
  transform: translateX(-8px);
  transition:
    opacity 0.25s $ease-fluid,
    transform 0.25s $ease-fluid;
  white-space: nowrap;
}

.sidebar-badge {
  font-size: 10px;
  font-weight: $font-semibold;
  color: var(--primary);
  margin-left: 2px;
}

.sidebar-nav {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.app-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background: var(--chrome-bg);
  border-top: 2px solid var(--primary);
  display: flex;
  align-items: center;
  padding: 0 calc(#{$space-1} + var(--safe-right)) var(--safe-bottom) calc(#{$space-1} + var(--safe-left));
  z-index: $z-bottom-nav;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.25);
}
</style>
