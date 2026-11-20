<script setup>
import { shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { state } from '@/stores/state'
import BaseTabs from '@/components/ui/BaseTabs.vue'
import '@/styles/profile.scss'

const route = useRoute()
const tabTransition = shallowRef('tab-slide-left')

const accountTabs = [
  { value: 'usuario-profile', to: '/usuario/profile', label: 'Perfil', icon: 'mdi-account-outline' },
  { value: 'usuario-security', to: '/usuario/security', label: 'Segurança', icon: 'mdi-shield-lock-outline' },
]

const tabOrder = {
  'usuario-profile': 0,
  'usuario-security': 1,
}

watch(
  () => route.name,
  (next, prev) => {
    const nextIdx = tabOrder[next] ?? 0
    const prevIdx = tabOrder[prev] ?? 0
    tabTransition.value = nextIdx >= prevIdx ? 'tab-slide-left' : 'tab-slide-right'
  },
)
</script>

<template>
  <div class="account-workspace" :class="{ authenticated: state.logged }">
    <div class="account-content">
      <BaseTabs class="account-tabs" :items="accountTabs" aria-label="Seções da conta" />

      <div class="account-tab-stage">
        <router-view v-slot="{ Component }">
          <Transition :name="tabTransition" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.account-tabs {
  margin-bottom: 16px;
}

.account-tab-stage {
  overflow-x: hidden;
}
</style>
