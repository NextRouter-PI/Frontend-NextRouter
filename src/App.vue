<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import { state } from './stores/state.js'
import AppHeader from './components/layout/AppHeader.vue'
import Sidebar from './components/layout/AppSideBar.vue'
import AppBottomNavigationBar from './components/layout/AppBottomNavigationBar.vue'

const { isMobile } = useDeviceLayout()
const route = useRoute()
const router = useRouter()

const showNav = computed(() => state.logged && !route.meta?.hideNav)
const transitionName = ref('page-fade')

const viewKey = computed(() => route.matched[0]?.path || route.path)
const isAuthSlide = computed(() =>
  transitionName.value === 'slide-forward' || transitionName.value === 'slide-back',
)

router.beforeEach((to, from) => {
  if (!isMobile.value && from.path === '/login' && to.path === '/signup') {
    transitionName.value = 'slide-forward'
  } else if (!isMobile.value && from.path === '/signup' && to.path === '/login') {
    transitionName.value = 'slide-back'
  } else {
    transitionName.value = 'page-fade'
  }
})
</script>

<template>
  <div v-if="!state.checkingAuth" class="app-layout">
    <Transition name="chrome-slide-down">
      <AppHeader v-if="showNav" />
    </Transition>

    <Transition name="chrome-slide-left">
      <Sidebar v-if="!isMobile && showNav" />
    </Transition>

    <main :class="['main-content', { logged: showNav, 'logged-desktop': showNav && !isMobile }]">
      <router-view v-slot="{ Component }">
        <Transition :name="transitionName" :mode="isAuthSlide ? undefined : 'out-in'">
          <component :is="Component" :key="viewKey" />
        </Transition>
      </router-view>
    </main>

    <Transition name="chrome-slide-up">
      <AppBottomNavigationBar v-if="isMobile && showNav" />
    </Transition>
  </div>
</template>

<!-- Sem scoped: as classes são aplicadas na raiz das páginas e chrome -->
<style>
.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--bg);
  transition: transform 0.55s cubic-bezier(0.77, 0, 0.18, 1);
}

.slide-forward-enter-from { transform: translateX(-100%); }
.slide-forward-leave-to   { transform: translateX(100%); }

.slide-back-enter-from { transform: translateX(100%); }
.slide-back-leave-to   { transform: translateX(-100%); }

.chrome-slide-down-enter-active,
.chrome-slide-down-leave-active,
.chrome-slide-up-enter-active,
.chrome-slide-up-leave-active,
.chrome-slide-left-enter-active,
.chrome-slide-left-leave-active {
  transition: opacity 0.25s var(--ease-fluid), transform 0.28s var(--ease-fluid);
}

.chrome-slide-down-enter-from,
.chrome-slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.chrome-slide-up-enter-from,
.chrome-slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.chrome-slide-left-enter-from,
.chrome-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
