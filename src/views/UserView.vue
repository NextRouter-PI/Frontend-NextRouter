<script setup>
import { shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE_NAMES, ROUTE_PATHS } from '@/constants'
import { state } from '@/stores/state'
import BaseTabs from '@/components/ui/BaseTabs.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import '@/styles/profile.scss'

const route = useRoute()
const tabTransition = shallowRef('tab-slide-left')

const accountTabs = [
  { value: ROUTE_NAMES.USER_PROFILE, to: ROUTE_PATHS.USER_PROFILE, label: 'Perfil', icon: 'mdi-account-outline' },
  { value: ROUTE_NAMES.USER_SECURITY, to: ROUTE_PATHS.USER_SECURITY, label: 'Segurança', icon: 'mdi-shield-lock-outline' },
]

const tabOrder = {
  [ROUTE_NAMES.USER_PROFILE]: 0,
  [ROUTE_NAMES.USER_SECURITY]: 1,
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
      <PageHeader
        title="Minha conta"
        eyebrow="Perfil e segurança"
        icon="mdi-account-outline"
        subtitle="Seus dados, foto, documentos, senha e sessões em um só lugar."
      />
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
  @include tab-stage;
}
</style>
