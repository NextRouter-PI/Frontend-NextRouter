<script setup>
import Logo from '@/assets/images/logo.webp'
import { ROUTE_PATHS } from '@/constants'

defineProps({
  brandTo: { type: String, default: ROUTE_PATHS.HOME },
  offsetForSidebar: { type: Boolean, default: false },
})
</script>

<template>
  <header class="app-top-bar" :class="{ 'has-sidebar-offset': offsetForSidebar }">
    <div class="top-bar-left">
      <slot name="brand">
        <RouterLink
          v-if="!offsetForSidebar"
          :to="brandTo"
          class="top-bar-logo"
          aria-label="NextRouter"
        >
          <img :src="Logo" alt="NextRouter" />
        </RouterLink>
      </slot>
    </div>

    <div v-if="$slots.center" class="top-bar-center">
      <slot name="center" />
    </div>

    <div class="top-bar-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  padding: 0 18px;
  background: var(--chrome-bg);
  border-bottom: 2px solid var(--primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-3;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  z-index: $z-header;
  transition: padding-left $duration-slow $ease-fluid;

  &.has-sidebar-offset {
    left: var(--sidebar-width);
    padding-left: 18px;
  }
}

.top-bar-left,
.top-bar-center,
.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-bar-logo {
  display: inline-flex;
  align-items: center;

  img {
    height: 36px;
    width: auto;
  }
}
</style>
