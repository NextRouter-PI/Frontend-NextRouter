<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { ROUTE_PATHS, USER_ROLES } from '@/constants'
import { useAuthStore } from '@/stores/useAuthStore'

defineProps({
  isMobile: { type: Boolean, default: false },
  badge: { type: String, default: '' },
})

const route = useRoute()
const auth = useAuthStore()

const ROLE_LABELS = {
  [USER_ROLES.COMPANY]: 'Empresa',
  [USER_ROLES.DRIVER]: 'Motorista',
  [USER_ROLES.PASSENGER]: 'Passageiro',
}

const roleLabel = computed(() => ROLE_LABELS[auth.role] || 'Conta')
const userName = computed(() => auth.user?.name || auth.user?.email || 'Minha conta')
const userEmail = computed(() => auth.user?.email || '')
const avatarUrl = computed(() => auth.user?.profile_picture_data?.url || '')
const initials = computed(() =>
  userName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join(''),
)

function isActive(target) {
  const path = typeof target === 'string' ? target : target?.matchPrefix || target?.to || ''
  if (path === ROUTE_PATHS.HOME) return route.path === ROUTE_PATHS.HOME
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <aside v-if="!isMobile" class="app-sidebar">
    <div class="sidebar-inner">
      <RouterLink :to="ROUTE_PATHS.HOME" class="sidebar-brand" aria-label="NextRouter - Início">
        <BrandLogo class="sidebar-brand-logo" />
        <span class="sidebar-brand-text">
          <strong>Next<span>Router</span></strong>
          <small>{{ roleLabel }}</small>
        </span>
      </RouterLink>

      <p class="sidebar-section">Navegação</p>
      <nav class="sidebar-nav" aria-label="Navegação principal">
        <slot :is-active="isActive" :is-mobile="false" />
      </nav>

      <div class="sidebar-user">
        <RouterLink
          :to="ROUTE_PATHS.USER_PROFILE"
          class="sidebar-user-card"
          :class="{ active: isActive(ROUTE_PATHS.USER_PROFILE) || isActive(ROUTE_PATHS.USER_SECURITY) }"
          title="Abrir minha conta"
        >
          <span class="sidebar-avatar">
            <img v-if="avatarUrl" :src="avatarUrl" alt="" />
            <template v-else>{{ initials }}</template>
          </span>
          <span class="sidebar-user-text">
            <strong>{{ userName }}</strong>
            <small>{{ userEmail }}</small>
          </span>
          <BaseIcon name="mdi-chevron-right" class="sidebar-user-arrow" />
        </RouterLink>
        <RouterLink :to="ROUTE_PATHS.LOGOUT" class="sidebar-logout">
          <BaseIcon name="mdi-logout" />
          <span>Sair da conta</span>
        </RouterLink>
      </div>
    </div>
  </aside>

  <nav v-else class="app-bottom-nav" aria-label="Navegação principal">
    <slot :is-active="isActive" :is-mobile="true" />
  </nav>
</template>

<style lang="scss" scoped>
// Menu lateral: branco no tema claro, grafite no escuro, com laranja nos destaques. Sem brilhos.
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--side-bg);
  border-right: 1px solid var(--side-line);
  overflow: hidden;
  // Abre e fecha devagar, com desaceleração suave (sem quique).
  --sidebar-ease: cubic-bezier(0.25, 1, 0.5, 1);
  transition:
    width 0.42s var(--sidebar-ease),
    box-shadow 0.42s var(--sidebar-ease),
    background-color $duration-normal $ease-fluid;
  z-index: $z-sidebar;

  // Fechada mostra só ícones; abre por cima da página com o mouse ou com o teclado (Tab).
  // :focus-visible e não :focus-within: depois de clicar num link o foco fica nele, e
  // a sidebar continuaria aberta mesmo com o mouse fora.
  &:hover,
  &:has(:focus-visible) {
    width: $sidebar-width-expanded;
    box-shadow: 16px 0 40px -20px rgba(0, 0, 0, 0.45);
  }

  // Textos: aparecem deslizando um pouco da esquerda depois que a largura começa a abrir;
  // ao fechar, somem rápido antes de serem cortados.
  .sidebar-brand-text,
  .sidebar-section,
  .sidebar-user-text,
  .sidebar-user-arrow,
  .sidebar-logout span {
    white-space: nowrap;
    opacity: 0;
    transform: translateX(-6px);
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }

  &:hover,
  &:has(:focus-visible) {
    .sidebar-brand-text,
    .sidebar-section,
    .sidebar-user-text,
    .sidebar-user-arrow,
    .sidebar-logout span {
      opacity: 1;
      transform: none;
      transition:
        opacity 0.3s ease 0.12s,
        transform 0.36s var(--sidebar-ease) 0.12s;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &,
    * {
      transition-duration: 0.01ms !important;
      transition-delay: 0s !important;
    }
  }
}

.sidebar-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: $space-5 $space-3 $space-4;
  overflow-x: hidden;
  overflow-y: auto;
}

.sidebar-brand {
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2 $space-1 $space-5;
  margin-bottom: $space-2;
  border-bottom: 1px solid var(--side-line);

  .sidebar-brand-logo {
    flex-shrink: 0;
    width: 49px;
    transition: transform $duration-slow $ease-spring;
  }
}

.sidebar-brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;

  strong {
    font-size: 1.05rem;
    font-weight: $font-extrabold;
    color: var(--side-text);

    span {
      color: var(--primary);
    }
  }

  small {
    margin-top: 3px;
    align-self: flex-start;
    padding: 1px 8px;
    border-radius: $radius-pill;
    background: var(--side-chip);
    color: var(--side-muted);
    font-size: 0.68rem;
    font-weight: $font-bold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
}

.sidebar-section {
  margin: $space-4 $space-3 $space-2;
  color: var(--side-faint);
  font-size: 0.68rem;
  font-weight: $font-bold;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-user {
  margin-top: auto;
  padding-top: $space-4;
  border-top: 1px solid var(--side-line);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.sidebar-user-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2;
  border-radius: $radius-md;
  border: 1px solid var(--side-line);
  transition:
    background-color $duration-normal $ease-fluid,
    border-color $duration-normal $ease-fluid;

  &:hover,
  &.active {
    background: var(--side-hover);
    border-color: var(--primary);
  }

  &:hover .sidebar-user-arrow {
    transform: translateX(3px);
    color: var(--primary);
  }
}

.sidebar-user-arrow {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--side-faint);
  font-size: 1.2rem;
  transition:
    transform $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid;
}

.sidebar-avatar {
  @include flex-center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: $radius-round;
  overflow: hidden;
  background: var(--primary);
  color: #fff;
  font-weight: $font-bold;
  font-size: $text-sm;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.sidebar-user-text {
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    @include truncate;
    color: var(--side-text);
    font-size: $text-sm;
  }

  small {
    @include truncate;
    color: var(--side-muted);
    font-size: $text-xs;
  }
}

.sidebar-logout {
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: 10px 17px;
  border-radius: $radius-md;
  border: 1px solid var(--side-line);
  color: var(--side-muted);
  font-size: $text-sm;
  font-weight: $font-semibold;
  transition:
    background-color $duration-normal $ease-fluid,
    border-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid;

  &:hover {
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.45);
    color: #f87171;
  }
}

.app-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background: var(--side-bg);
  display: flex;
  align-items: center;
  padding: 0 calc(#{$space-1} + var(--safe-right)) var(--safe-bottom) calc(#{$space-1} + var(--safe-left));
  z-index: $z-bottom-nav;
  border-top: 1px solid var(--side-line);
  box-shadow: 0 -8px 24px -14px rgba(0, 0, 0, 0.25);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--chrome-line);
    pointer-events: none;
  }
}
</style>
