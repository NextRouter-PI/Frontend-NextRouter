<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import { state } from './stores/state.js'
import AppHeader from './components/layout/AppHeader.vue'
import Sidebar from './components/layout/AppSideBar.vue'
import AppBottomNavigationBar from './components/layout/AppBottomNavigationBar.vue'

const { isMobile } = useDeviceLayout()
const router = useRouter()

// Nome da transição aplicada na troca de rota (vazio = sem animação)
const transitionName = ref('')

router.beforeEach((to, from) => {
  if (isMobile.value) {
    transitionName.value = ''
  } else if (from.path === '/login' && to.path === '/signup') {
    transitionName.value = 'slide-forward'
  } else if (from.path === '/signup' && to.path === '/login') {
    transitionName.value = 'slide-back'
  } else {
    transitionName.value = ''
  }
})
</script>

<template>
  <div v-if="!state.checkingAuth" class="app-layout">
    <AppHeader v-if="state.logged" />
    <Sidebar v-if="!isMobile && state.logged" />

    <main :class="state.logged ? 'logado' : ''">
      <router-view v-slot="{ Component }">
        <Transition :name="transitionName">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>

    <AppBottomNavigationBar
      v-if="isMobile && state.logged"
    />
  </div>
</template>

<style scoped>
.logado{
  margin: 80px 0;
}
</style>

<!-- Sem scoped: as classes são aplicadas na raiz das páginas -->
<style>
.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--bg);
  transition: transform 0.6s cubic-bezier(0.77, 0, 0.18, 1);
}

/* login -> signup: a tela atual sai para a direita, a nova entra pela esquerda */
.slide-forward-enter-from { transform: translateX(-100%); }
.slide-forward-leave-to   { transform: translateX(100%); }

/* signup -> login: caminho contrário */
.slide-back-enter-from { transform: translateX(100%); }
.slide-back-leave-to   { transform: translateX(-100%); }
</style>
