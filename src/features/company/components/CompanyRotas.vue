<script setup>
import { computed, defineAsyncComponent, onMounted, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'
import BaseTabs from '@/components/ui/BaseTabs.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import CompanyRouteGroupsTab from '@/features/company/components/routes/CompanyRouteGroupsTab.vue'

const CompanyDatedOperationTab = defineAsyncComponent({
  loader: () => import('@/features/company/components/routes/CompanyDatedOperationTab.vue'),
  loadingComponent: LoadingSpinner,
  delay: 150,
})
const TransportHistoryNotifications = defineAsyncComponent({
  loader: () => import('@/features/transport/components/TransportHistoryNotifications.vue'),
  loadingComponent: LoadingSpinner,
  delay: 150,
})

const route = useRoute()
const store = useRotasStore()
const scope = useAccountScope()
const { showToast } = useToast()

const tabTransition = shallowRef('tab-slide-left')
const carregando = shallowRef(true)

const resumo = computed(() => {
  const viagens = store.viagensDia || []
  return {
    grupos: store.grupos.length,
    servicos: store.servicos.length,
    passageiros: store.grupos.reduce((acc, g) => acc + g.members.length, 0),
    viagens: viagens.length,
    publicadas: viagens.filter((t) => t.publication_current || t.status !== 'scheduled').length,
  }
})
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
  carregando.value = false
  if (!scope.current()) return
  await store.fetchOperacaoDatada({}, { signal: scope.signal })
})

function handleToast({ message, type }) {
  showToast(message, type)
}
</script>

<template>
  <div class="company-routes-page">
    <PageHeader
      title="Grupos e Operação de Rotas"
      eyebrow="Painel da empresa"
      icon="mdi-map-outline"
      subtitle="Monte os grupos, programe idas e retornos e acompanhe cada dia de atendimento."
    />

    <section class="stat-grid" aria-label="Resumo das rotas">
      <StatTile icon="mdi-routes" label="Grupos" :value="resumo.grupos" :loading="carregando" hint="Grupos de atendimento" />
      <StatTile icon="mdi-calendar-clock" label="Serviços habituais" :value="resumo.servicos" :loading="carregando" tone="blue" hint="Idas e retornos programados" />
      <StatTile icon="mdi-account-group" label="Passageiros" :value="resumo.passageiros" :loading="carregando" tone="green" hint="Alocados em grupos" />
      <StatTile
        icon="mdi-bus-clock"
        label="Viagens do dia"
        :value="resumo.viagens"
        :loading="carregando"
        tone="gray"
        :hint="`${resumo.publicadas} publicadas ou em andamento`"
      />
    </section>

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
  --page-max: 1040px;
  @include section-container(120px);
}

.tab-stage {
  @include tab-stage;
}
</style>
