<script setup>
import { computed, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import { ROUTE_PATHS, USER_ROLES } from '@/constants'
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import { useDocumentTheme } from '@/composables/useDocumentTheme'
import { useRouteProgress } from '@/composables/useRouteProgress'
import { navigationItems } from '@/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import AppTopBar from '@/components/layout/AppTopBar.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import ThemeButton from '@/components/ui/ThemeButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const { isMobile } = useDeviceLayout()
const route = useRoute()
const auth = useAuthStore()
const { theme: toasterTheme } = useDocumentTheme()
const { transitionName, isNavigating, isAuthSlide } = useRouteProgress({ isMobile })

const showTopBar = computed(() => !route.meta?.hideChrome)
const showNavigation = computed(() => auth.logged && !route.meta?.hideChrome)
const isCompany = computed(() => auth.role === USER_ROLES.COMPANY)
const navItems = computed(() => navigationItems(auth.role))
const isUserRoute = computed(
  () => route.path === ROUTE_PATHS.USER || route.path.startsWith(`${ROUTE_PATHS.USER}/`),
)
const brandDestination = computed(() => (auth.logged ? ROUTE_PATHS.HOME : ROUTE_PATHS.LOGIN))
const avatarFailed = shallowRef(false)
const userAvatarUrl = computed(() =>
  avatarFailed.value ? '' : auth.user?.profile_picture_data?.url || '',
)
const viewKey = computed(() => route.matched[0]?.path || route.path)

watch(
  () => auth.user?.profile_picture_data?.url,
  () => {
    avatarFailed.value = false
  },
)
</script>

<template>
  <Transition name="fade-scale" mode="out-in">
    <div v-if="!auth.checkingAuth" key="ready" class="app-layout">
      <div
        v-if="isNavigating"
        class="route-progress-bar"
        role="progressbar"
        aria-label="Carregando página"
      ></div>

      <AppTopBar
        v-if="showTopBar"
        :brand-to="brandDestination"
        :offset-for-sidebar="showNavigation && !isMobile"
      >
        <template #actions>
          <ThemeButton />
          <RouterLink
            v-if="auth.logged"
            :to="ROUTE_PATHS.USER_PROFILE"
            class="top-bar-user-btn"
            :class="{ active: isUserRoute, 'has-avatar': Boolean(userAvatarUrl) }"
            title="Usuário"
            aria-label="Seção de usuário"
          >
            <img
              v-if="userAvatarUrl"
              :src="userAvatarUrl"
              alt="Foto de perfil"
              class="top-bar-user-avatar"
              @error="avatarFailed = true"
            />
            <BaseIcon v-else name="mdi-account" />
          </RouterLink>
        </template>
      </AppTopBar>

      <AppNavigation
        v-if="showNavigation"
        :is-mobile="isMobile"
        :badge="isCompany ? 'ADMIN' : ''"
      >
        <template #default="{ isActive, isMobile: mobileMode }">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="[mobileMode ? 'bottom-nav-item' : 'sidebar-nav-item', { active: isActive(item) }]"
            :title="item.title"
            :aria-label="item.title"
            :aria-current="isActive(item) ? 'page' : undefined"
          >
            <span class="nav-icon-wrap">
              <BaseIcon :name="item.icon" />
            </span>
            <small v-if="!mobileMode" class="nav-label">{{ item.title }}</small>
          </RouterLink>
        </template>
      </AppNavigation>

      <main
        :class="[
          'main-content',
          {
            'with-top-bar': showTopBar,
            logged: showNavigation,
            'logged-desktop': showNavigation && !isMobile,
          },
        ]"
      >
        <router-view v-slot="{ Component }">
          <Transition :name="transitionName" :mode="isAuthSlide ? undefined : 'out-in'">
            <component :is="Component" :key="viewKey" />
          </Transition>
        </router-view>
      </main>
    </div>

    <div v-else key="boot" class="app-boot-loader">
      <LoadingSpinner size="lg" text="Carregando NextRouter..." />
    </div>
  </Transition>

  <Toaster
    :theme="toasterTheme"
    position="top-right"
    :offset="{ top: '70px', right: '16px' }"
    rich-colors
    close-button
  />
</template>

<style lang="scss" scoped>
.app-boot-loader {
  min-height: 100vh;
  @include flex-center;
  background: var(--bg);
}

.route-progress-bar {
  position: fixed;
  top: var(--safe-top);
  left: 0;
  right: 0;
  height: 2.5px;
  z-index: $z-toast;
  background: linear-gradient(90deg, transparent, var(--primary), var(--primary-light), transparent);
  background-size: 200% 100%;
  animation: route-progress 1s ease-in-out infinite;
  pointer-events: none;
}

@keyframes route-progress {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.top-bar-user-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  aspect-ratio: 1;
  border-radius: $radius-round;
  overflow: hidden;
  @include flex-center;
  color: var(--chrome-text);
  background: var(--chrome-hover);
  border: 2px solid transparent;
  transition:
    background-color $duration-normal $ease-fluid,
    border-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid,
    box-shadow $duration-normal $ease-fluid;

  .mdi {
    font-size: 22px;
  }

  &.has-avatar {
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:hover {
    color: var(--primary);
    background: var(--color-primary-tint);
    border-color: var(--primary);
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.94);
  }

  &.active {
    background: var(--primary);
    color: var(--color-on-primary);
    border-color: var(--primary);
    box-shadow: var(--shadow-primary);

    &.has-avatar {
      background: transparent;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--chrome-bg), 0 0 0 4px var(--primary);
    }
  }
}

.top-bar-user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sidebar-nav-item {
  position: relative;
  color: var(--chrome-muted);
  display: flex;
  align-items: center;
  gap: 14px;
  width: calc(100% - #{$space-4});
  padding: 6px 10px;
  border-radius: 12px;
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    transform 0.18s $ease-fluid;

  &:hover {
    background: var(--chrome-hover);
    color: var(--chrome-text);

    .nav-icon-wrap {
      color: var(--primary);
      transform: scale(1.06);
    }
  }

  &:active {
    transform: scale(0.96);
  }

  .nav-icon-wrap {
    width: 42px;
    height: 42px;
    min-width: 42px;
    min-height: 42px;
    flex-shrink: 0;
    aspect-ratio: 1;
    border-radius: $radius-round;
    @include flex-center;
    font-size: 22px;
    transition:
      background-color 0.25s $ease-fluid,
      color 0.25s $ease-fluid,
      transform 0.25s $ease-fluid;
  }

  .nav-label {
    font-size: $text-md;
    font-weight: $font-semibold;
    opacity: 0;
    transform: translateX(-8px);
    transition:
      opacity $duration-normal $ease-fluid,
      transform $duration-normal $ease-fluid;
    white-space: nowrap;
  }

  &.active {
    color: var(--chrome-text);

    .nav-icon-wrap {
      color: var(--color-on-primary);
      background: var(--primary);
    }
  }
}

.bottom-nav-item {
  flex: 1 1 0;
  min-width: 0;
  position: relative;
  color: var(--chrome-muted);
  @include flex-center;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.28s $ease-fluid;

  .nav-icon-wrap {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    aspect-ratio: 1;
    border-radius: $radius-round;
    border: 3px solid transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    will-change: transform;
    transition:
      transform 0.42s cubic-bezier(0.34, 1.45, 0.64, 1),
      background-color 0.3s $ease-fluid,
      border-color 0.3s $ease-fluid,
      color 0.25s $ease-fluid,
      box-shadow 0.32s $ease-fluid;

    .mdi {
      font-size: 28px;
      line-height: 1;
      transition: transform 0.36s cubic-bezier(0.34, 1.45, 0.64, 1);
    }
  }

  &:hover {
    color: var(--chrome-text);

    &:not(.active) .nav-icon-wrap {
      transform: translateY(-2px);
    }
  }

  &:active .nav-icon-wrap {
    transform: scale(0.9);
  }

  &.active {
    color: var(--primary);

    .nav-icon-wrap {
      background: var(--primary);
      color: var(--color-on-primary);
      border-color: var(--chrome-bg);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
      transform: translateY(-16px) scale(1.1);

      .mdi {
        transform: scale(1.04);
      }
    }

    &:active .nav-icon-wrap {
      transform: translateY(-13px) scale(1.02);
    }
  }
}
</style>
