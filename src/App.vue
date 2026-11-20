<script setup>
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_PATHS, USER_ROLES } from '@/constants'
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import { navigationItems } from '@/navigation'
import { state } from '@/stores/state'
import AppTopBar from '@/components/layout/AppTopBar.vue'
import AppNavigation from '@/components/layout/AppNavigation.vue'
import ThemeButton from '@/components/ui/ThemeButton.vue'

const { isMobile } = useDeviceLayout()
const route = useRoute()
const router = useRouter()

const showTopBar = computed(() => !route.meta?.hideChrome)
const showNavigation = computed(() => state.logged && !route.meta?.hideChrome)
const isCompany = computed(() => state.role === USER_ROLES.COMPANY)
const navItems = computed(() => navigationItems(state.role))
const isUserRoute = computed(() => route.path.startsWith(ROUTE_PATHS.USER))
const brandDestination = computed(() => (state.logged ? ROUTE_PATHS.HOME : ROUTE_PATHS.LOGIN))

const transitionName = shallowRef('page-fade')
const viewKey = computed(() => route.matched[0]?.path || route.path)
const isAuthSlide = computed(
  () => transitionName.value === 'slide-forward' || transitionName.value === 'slide-back',
)

router.beforeEach((to, from) => {
  if (!isMobile.value && from.path === ROUTE_PATHS.LOGIN && to.path === ROUTE_PATHS.SIGNUP) {
    transitionName.value = 'slide-forward'
  } else if (!isMobile.value && from.path === ROUTE_PATHS.SIGNUP && to.path === ROUTE_PATHS.LOGIN) {
    transitionName.value = 'slide-back'
  } else {
    transitionName.value = 'page-fade'
  }
})
</script>

<template>
  <div v-if="!state.checkingAuth" class="app-layout">
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
          :class="{ active: isUserRoute }"
          title="Usuário"
          aria-label="Seção de usuário"
        >
          <span class="mdi mdi-account" aria-hidden="true"></span>
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
</template>

<style lang="scss">
.top-bar-user-btn {
  width: 38px;
  height: 38px;
  border-radius: $radius-round;
  @include flex-center;
  color: var(--chrome-text);
  background: var(--chrome-hover);
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid,
    box-shadow $duration-normal $ease-fluid;

  .mdi {
    font-size: 22px;
  }

  &:hover {
    color: var(--primary);
    background: var(--color-primary-tint);
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.94);
  }

  &.active {
    background: var(--primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-primary);
  }
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
