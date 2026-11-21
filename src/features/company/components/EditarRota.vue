<script setup>
import { computed, onMounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTabs from '@/components/ui/BaseTabs.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import HabitualRouteBuilder from '@/features/transport/components/HabitualRouteBuilder.vue'
import RouteGroupBasicForm from '@/features/company/components/route-editor/RouteGroupBasicForm.vue'
import ResponsePolicyForm from '@/features/company/components/route-editor/ResponsePolicyForm.vue'
import RecurringServicesSection from '@/features/company/components/route-editor/RecurringServicesSection.vue'
import GroupMembersSection from '@/features/company/components/route-editor/GroupMembersSection.vue'
import AutomationScheduleSection from '@/features/company/components/route-editor/AutomationScheduleSection.vue'

const router = useRouter()
const route = useRoute()
const store = useRotasStore()
const scope = useAccountScope()

const id = Number(route.params.id)
const tabTransition = shallowRef('tab-slide-left')
const carregando = shallowRef(true)
const erro = shallowRef('')
const agendaStatus = shallowRef(null)

const secaoAtiva = computed(() => (route.params.tab === 'routes' ? 'routes' : 'settings'))
const grupoAtual = computed(() => store.grupos.find((g) => g.id === id) || null)
const servicosHabituais = computed(() => (grupoAtual.value?.services || []).filter((s) => !s.is_shared))
const servicosCompartilhados = computed(() =>
  (grupoAtual.value?.services || []).filter((s) => Boolean(s.is_shared)),
)

const sectionTabs = computed(() => [
  {
    value: 'settings',
    to: `/routes/${id}/edit/settings`,
    label: '1. Configurações do Grupo',
    icon: 'mdi-cog-outline',
  },
  {
    value: 'routes',
    to: `/routes/${id}/edit/routes`,
    label: '2. Rotas do Grupo',
    icon: 'mdi-map-marker-path',
    badge: (grupoAtual.value?.habitualRoutes?.length || 0) + (grupoAtual.value?.sharedRoutes?.length || 0),
  },
])

watch(secaoAtiva, (next, prev) => {
  const order = { settings: 0, routes: 1 }
  tabTransition.value = (order[next] ?? 0) >= (order[prev] ?? 0) ? 'tab-slide-left' : 'tab-slide-right'
})

async function carregarTudo() {
  carregando.value = true
  erro.value = ''
  await store.fetchRotas({ signal: scope.signal })
  if (!scope.current()) return
  if (!grupoAtual.value) {
    erro.value = 'Grupo de atendimento não encontrado.'
    carregando.value = false
    return
  }
  const auto = await store.consultarAgendaAutomatica(id, { signal: scope.signal })
  if (!scope.current()) return
  agendaStatus.value = auto
  carregando.value = false
}

onMounted(() => {
  if (!route.params.tab) {
    router.replace(`/routes/${id}/edit/settings`)
  }
  carregarTudo()
})
</script>

<template>
  <div class="route-editor-page">
    <PageHeader :title="`Configurar Grupo #${id}`" accent>
      <template #actions>
        <BaseButton variant="outline" size="sm" icon="mdi-arrow-left" @click="router.push(ROUTE_PATHS.LIST)">
          Voltar para rotas
        </BaseButton>
      </template>
    </PageHeader>

    <EmptyState v-if="carregando" loading description="Carregando configuração do grupo..." />
    <StatusBanner v-else-if="erro" variant="danger" :message="erro" />

    <template v-else-if="grupoAtual">
      <BaseTabs
        :items="sectionTabs"
        aria-label="Seções do grupo"
      />

      <div class="tab-stage">
        <Transition :name="tabTransition" mode="out-in">
          <div v-if="secaoAtiva === 'settings'" key="settings" class="sections-stack">
            <RouteGroupBasicForm :group-id="id" :grupo="grupoAtual" @updated="carregarTudo" />
            <ResponsePolicyForm :group-id="id" :policy="grupoAtual.policy" @updated="carregarTudo" />
            <RecurringServicesSection
              :group-id="id"
              :services="servicosHabituais"
              @updated="carregarTudo"
            />
            <RecurringServicesSection
              :group-id="id"
              :services="servicosCompartilhados"
              is-shared
              @updated="carregarTudo"
            />
            <GroupMembersSection :group-id="id" :grupo="grupoAtual" @updated="carregarTudo" />
            <AutomationScheduleSection :group-id="id" :status="agendaStatus" @updated="carregarTudo" />
          </div>

          <HabitualRouteBuilder
            v-else
            key="routes"
            :group-id="id"
            :destination-coords="grupoAtual.destinationCoords"
            :habitual-routes="grupoAtual.habitualRoutes || []"
            :shared-routes="grupoAtual.sharedRoutes || []"
            @updated="carregarTudo"
          />
        </Transition>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.route-editor-page {
  max-width: $container-lg;
  margin: 0 auto;
  padding: $space-5 18px 120px;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.tab-stage {
  overflow-x: hidden;
}

.sections-stack {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
</style>
