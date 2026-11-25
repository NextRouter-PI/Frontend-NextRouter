<script setup>
import { computed, defineAsyncComponent, onMounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTabs from '@/components/ui/BaseTabs.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import RouteGroupBasicForm from '@/features/company/components/route-editor/RouteGroupBasicForm.vue'
import ResponsePolicyForm from '@/features/company/components/route-editor/ResponsePolicyForm.vue'
import RecurringServicesSection from '@/features/company/components/route-editor/RecurringServicesSection.vue'
import GroupMembersSection from '@/features/company/components/route-editor/GroupMembersSection.vue'
import AutomationScheduleSection from '@/features/company/components/route-editor/AutomationScheduleSection.vue'

const HabitualRouteBuilder = defineAsyncComponent({
  loader: () => import('@/features/transport/components/HabitualRouteBuilder.vue'),
  loadingComponent: LoadingSpinner,
  delay: 150,
})

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

async function carregarTudo({ force = false } = {}) {
  carregando.value = true
  erro.value = ''
  await store.fetchRotas({ signal: scope.signal, force })
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
  carregarTudo()
})
</script>

<template>
  <div class="route-editor-page">
    <PageHeader :title="`Configurar grupo #${id}`" highlight="grupo" eyebrow="Painel da empresa" icon="mdi-map-outline">
      <template #actions>
        <BaseButton variant="outline" size="sm" icon="mdi-arrow-left" @click="router.push(ROUTE_PATHS.LIST_GROUPS)">
          Voltar para rotas
        </BaseButton>
      </template>
    </PageHeader>

    <Transition name="fade-slide" mode="out-in">
      <EmptyState v-if="carregando" key="loading" loading description="Carregando configuração do grupo..." />
      <StatusBanner v-else-if="erro" key="error" variant="danger" :message="erro" />

      <div v-else-if="grupoAtual" key="content" class="sections-stack">
        <BaseTabs
          :items="sectionTabs"
          aria-label="Seções do grupo"
        />

        <div class="tab-stage">
          <Transition :name="tabTransition" mode="out-in">
            <div v-if="secaoAtiva === 'settings'" key="settings" class="sections-stack">
              <RouteGroupBasicForm :group-id="id" :grupo="grupoAtual" @updated="carregarTudo({ force: true })" />
              <ResponsePolicyForm :group-id="id" :policy="grupoAtual.policy" @updated="carregarTudo({ force: true })" />
              <RecurringServicesSection
                :group-id="id"
                :services="servicosHabituais"
                @updated="carregarTudo({ force: true })"
              />
              <RecurringServicesSection
                :group-id="id"
                :services="servicosCompartilhados"
                is-shared
                @updated="carregarTudo({ force: true })"
              />
              <GroupMembersSection :group-id="id" :grupo="grupoAtual" @updated="carregarTudo({ force: true })" />
              <AutomationScheduleSection :group-id="id" :status="agendaStatus" @updated="carregarTudo({ force: true })" />
            </div>

            <HabitualRouteBuilder
              v-else
              key="routes"
              :group-id="id"
              :destination-coords="grupoAtual.destinationCoords"
              :habitual-routes="grupoAtual.habitualRoutes || []"
              :shared-routes="grupoAtual.sharedRoutes || []"
              @updated="carregarTudo({ force: true })"
            />
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.route-editor-page {
  @include section-container(120px);
}

.tab-stage {
  @include tab-stage;
}

.sections-stack {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
</style>
