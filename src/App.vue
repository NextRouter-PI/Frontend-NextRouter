<script setup>
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import { ROUTE_PATHS, USER_ROLES } from '@/constants'
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import { navigationItems } from '@/navigation'
import { state } from '@/stores/state'
import AppTopBar from '@/components/layout/AppTopBar.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import ThemeButton from '@/components/ui/ThemeButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const { isMobile } = useDeviceLayout()
const route = useRoute()
const router = useRouter()

const showTopBar = computed(() => !route.meta?.hideChrome)
const showNavigation = computed(() => state.logged && !route.meta?.hideChrome)
const isCompany = computed(() => state.role === USER_ROLES.COMPANY)
const navItems = computed(() => navigationItems(state.role))
const isUserRoute = computed(() => route.path.startsWith(ROUTE_PATHS.USER))
const brandDestination = computed(() => (state.logged ? ROUTE_PATHS.HOME : ROUTE_PATHS.LOGIN))
const avatarFailed = shallowRef(false)
const userAvatarUrl = computed(() =>
  avatarFailed.value ? '' : state.user?.profile_picture_data?.url || '',
)
const toasterTheme = shallowRef(
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light',
)
let themeObserver = null

watch(
  () => state.user?.profile_picture_data?.url,
  () => {
    avatarFailed.value = false
  },
)

onMounted(() => {
  if (typeof MutationObserver === 'undefined') return
  themeObserver = new MutationObserver(() => {
    toasterTheme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

const transitionName = shallowRef('page-fade')
const isNavigating = shallowRef(false)
let navDelayTimer = null
const viewKey = computed(() => route.matched[0]?.path || route.path)
const isAuthSlide = computed(
  () => transitionName.value === 'slide-forward' || transitionName.value === 'slide-back',
)

function finishNavigation() {
  if (navDelayTimer) {
    clearTimeout(navDelayTimer)
    navDelayTimer = null
  }
  isNavigating.value = false
}

const removeBeforeEach = router.beforeEach((to, from) => {
  if (!isMobile.value && from.path === ROUTE_PATHS.LOGIN && to.path === ROUTE_PATHS.SIGNUP) {
    transitionName.value = 'slide-forward'
  } else if (!isMobile.value && from.path === ROUTE_PATHS.SIGNUP && to.path === ROUTE_PATHS.LOGIN) {
    transitionName.value = 'slide-back'
  } else {
    transitionName.value = 'page-fade'
  }
  if (to.path !== from.path) {
    if (navDelayTimer) clearTimeout(navDelayTimer)
    navDelayTimer = setTimeout(() => {
      isNavigating.value = true
    }, 100)
  }
})
const removeAfterEach = router.afterEach(finishNavigation)
const removeOnError = router.onError(finishNavigation)

onUnmounted(() => {
  themeObserver?.disconnect()
  themeObserver = null
  removeBeforeEach()
  removeAfterEach()
  removeOnError()
  finishNavigation()
})
</script>

<template>
  <Transition name="fade-scale" mode="out-in">
    <div v-if="!state.checkingAuth" key="ready" class="app-layout">
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
            v-if="state.logged"
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
            <span v-else class="mdi mdi-account" aria-hidden="true"></span>
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
            :class="[mobileMode ? 'bottom-nav-item' : 'sidebar-nav-item', { active: isActive(item.to) }]"
            :title="item.title"
            :aria-label="item.title"
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            <span class="nav-icon-wrap">
              <span class="mdi" :class="item.icon" aria-hidden="true"></span>
            </span>
            <small class="nav-label">{{ item.title }}</small>
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

<style lang="scss">
.app-boot-loader {
  min-height: 100vh;
  @include flex-center;
  background: var(--bg);
}

.route-progress-bar {
  position: fixed;
  top: 0;
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
  @include flex-center(2px);
  flex-direction: column;
  height: 100%;
  transition: color $duration-normal $ease-fluid;

  .nav-icon-wrap {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    aspect-ratio: 1;
    border-radius: $radius-round;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.28s $ease-fluid,
      background-color 0.25s $ease-fluid,
      color 0.25s $ease-fluid,
      width 0.25s $ease-fluid,
      height 0.25s $ease-fluid;

    .mdi {
      font-size: 24px;
      line-height: 1;
    }
  }

  .nav-label {
    font-size: 10px;
    font-weight: $font-semibold;
    letter-spacing: 0.01em;
    max-width: 100%;
    @include truncate;
    transition:
      color $duration-normal $ease-fluid,
      transform 0.25s $ease-fluid;
  }

  &:hover {
    color: var(--chrome-text);
  }

  &:active .nav-icon-wrap {
    transform: scale(0.92);
  }

  &.active {
    color: var(--primary);

    .nav-icon-wrap {
      width: 48px;
      height: 48px;
      min-width: 48px;
      min-height: 48px;
      background: var(--primary);
      color: var(--color-on-primary);
      border: 3px solid var(--chrome-bg);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.32);
      transform: translateY(-16px);
    }

    .nav-label {
      color: var(--primary);
      transform: translateY(-10px);
    }
  }
}

.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
  position: fixed;
  top: var(--header-height);
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: var(--bg);
  transition: transform 0.55s cubic-bezier(0.77, 0, 0.18, 1);
}

.slide-forward-enter-from {
  transform: translateX(-100%);
}
.slide-forward-leave-to {
  transform: translateX(100%);
}

.slide-back-enter-from {
  transform: translateX(100%);
}
.slide-back-leave-to {
  transform: translateX(-100%);
}
</style>
