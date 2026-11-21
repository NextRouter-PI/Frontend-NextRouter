<script setup>
import { computed, onMounted, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseTabs from '@/components/ui/BaseTabs.vue'
import CompanyRouteGroupsTab from '@/features/company/components/routes/CompanyRouteGroupsTab.vue'
import CompanyDatedOperationTab from '@/features/company/components/routes/CompanyDatedOperationTab.vue'
import TransportHistoryNotifications from '@/features/transport/components/TransportHistoryNotifications.vue'

const route = useRoute()
const store = useRotasStore()
const scope = useAccountScope()
const { showToast } = useToast()

const tabTransition = shallowRef('tab-slide-left')
const tabOrder = { groups: 0, operations: 1, history: 2 }

const aba = computed(() => {
  const param = String(route.params.tab || '')
  return param in tabOrder ? param : 'groups'
})

const routeTabs = computed(() => [
  {
    value: 'groups',
    to: ROUTE_PATHS.LIST_GROUPS,
    label: 'Grupos e Programação',
    icon: 'mdi-routes',
    badge: store.grupos.length,
  },
  {
    value: 'operations',
    to: ROUTE_PATHS.LIST_OPERATIONS,
    label: 'Operação por Data',
    icon: 'mdi-calendar-clock',
    badge: store.diasAtendimento.length,
  },
  {
    value: 'history',
    to: ROUTE_PATHS.LIST_HISTORY,
    label: 'Avisos e Histórico',
    icon: 'mdi-history',
  },
])

watch(aba, (next, prev) => {
  tabTransition.value = (tabOrder[next] ?? 0) >= (tabOrder[prev] ?? 0) ? 'tab-slide-left' : 'tab-slide-right'
})

onMounted(async () => {
  await store.fetchRotas({ signal: scope.signal })
  if (!scope.current()) return
  await store.fetchOperacaoDatada({}, { signal: scope.signal })
})

function handleToast({ message, type }) {
  showToast(message, type)
}
</script>

<template>
  <div class="company-routes-page">
    <PageHeader title="Grupos e Operação de Rotas" accent />

    <BaseTabs
      :items="routeTabs"
      aria-label="Programação habitual, operação por data e histórico"
    />

    <div class="tab-stage">
      <Transition :name="tabTransition" mode="out-in">
        <CompanyRouteGroupsTab v-if="aba === 'groups'" key="groups" />
        <CompanyDatedOperationTab v-else-if="aba === 'operations'" key="operations" @toast="handleToast" />
        <TransportHistoryNotifications v-else key="history" />
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.company-routes-page {
  @include section-container(120px);
}

.tab-stage {
  @include tab-stage;
}
</style>
