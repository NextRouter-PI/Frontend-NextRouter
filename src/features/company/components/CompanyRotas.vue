<script setup>
import { computed, onMounted, shallowRef, watch } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseTabs from '@/components/ui/BaseTabs.vue'
import CompanyRouteGroupsTab from '@/features/company/components/routes/CompanyRouteGroupsTab.vue'
import CompanyDatedOperationTab from '@/features/company/components/routes/CompanyDatedOperationTab.vue'
import TransportHistoryNotifications from '@/features/transport/components/TransportHistoryNotifications.vue'

const store = useRotasStore()
const scope = useAccountScope()
const { showToast } = useToast()

const aba = shallowRef('grupos')
const tabTransition = shallowRef('tab-slide-left')
const tabOrder = { grupos: 0, operacao: 1, historico: 2 }

const routeTabs = computed(() => [
  { value: 'grupos', label: 'Grupos e Programação', icon: 'mdi-routes', badge: store.grupos.length },
  { value: 'operacao', label: 'Operação por Data', icon: 'mdi-calendar-clock', badge: store.diasAtendimento.length },
  { value: 'historico', label: 'Avisos e Histórico', icon: 'mdi-history' },
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
      v-model="aba"
      :items="routeTabs"
      aria-label="Programação habitual, operação por data e histórico"
    />

    <div class="tab-stage">
      <Transition :name="tabTransition" mode="out-in">
        <CompanyRouteGroupsTab v-if="aba === 'grupos'" key="grupos" />
        <CompanyDatedOperationTab v-else-if="aba === 'operacao'" key="operacao" @toast="handleToast" />
        <TransportHistoryNotifications v-else key="historico" />
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.company-routes-page {
  margin: 0 auto;
  max-width: $container-lg;
  padding: $space-5 18px 120px;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.tab-stage {
  overflow-x: hidden;
}
</style>
