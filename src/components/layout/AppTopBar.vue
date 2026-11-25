<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { ROUTE_PATHS } from '@/constants'

defineProps({
  brandTo: { type: String, default: ROUTE_PATHS.HOME },
  logoSpin: { type: String, default: 'hover' },
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
          <BrandLogo class="top-bar-logo-img" :spin="logoSpin" />
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
// Header invisível: só a logo e os botões flutuam por cima da página.
.app-top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  padding: var(--safe-top) calc(18px + var(--safe-right)) 0 calc(18px + var(--safe-left));
  background: transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-3;
  z-index: $z-header;
  // A faixa vazia não bloqueia cliques no conteúdo por baixo.
  pointer-events: none;
  transition: padding-left $duration-slow $ease-fluid;

  > * {
    pointer-events: auto;
  }

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

// Logo e botões em "pílulas" de vidro, legíveis sobre foto ou fundo.
.top-bar-logo,
.top-bar-actions {
  padding: 4px;
  border-radius: $radius-pill;
  background: color-mix(in srgb, var(--color-surface) 72%, transparent);
  backdrop-filter: saturate(1.4) blur(12px);
  -webkit-backdrop-filter: saturate(1.4) blur(12px);
  box-shadow: 0 6px 20px -10px rgba(0, 0, 0, 0.35);
  outline: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  outline-offset: -1px;
}

.top-bar-logo {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;

  .top-bar-logo-img {
    width: 46px;
    transition: transform $duration-slow $ease-spring;
  }
}
</style>
