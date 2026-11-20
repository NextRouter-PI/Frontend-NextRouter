<script setup>
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
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
const secaoAtiva = shallowRef('config')
const carregando = shallowRef(true)
const erro = shallowRef('')
const agendaStatus = shallowRef(null)

const grupoAtual = computed(() => store.grupos.find((g) => g.id === id) || null)
const servicosHabituais = computed(() => (grupoAtual.value?.services || []).filter((s) => !s.is_shared))
const servicosCompartilhados = computed(() =>
  (grupoAtual.value?.services || []).filter((s) => Boolean(s.is_shared)),
)

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

onMounted(carregarTudo)
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
      <div class="section-tabs" role="tablist" aria-label="Seções do grupo">
        <button
          type="button"
          role="tab"
          :aria-selected="secaoAtiva === 'config'"
          :class="['section-tab', { active: secaoAtiva === 'config' }]"
          @click="secaoAtiva = 'config'"
        >
          1. Configurações do Grupo
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="secaoAtiva === 'rotas'"
          :class="['section-tab', { active: secaoAtiva === 'rotas' }]"
          @click="secaoAtiva = 'rotas'"
        >
          2. Rotas do Grupo
          ({{ (grupoAtual.habitualRoutes?.length || 0) + (grupoAtual.sharedRoutes?.length || 0) }})
        </button>
      </div>

      <div v-if="secaoAtiva === 'config'" class="sections-stack">
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
        :group-id="id"
        :destination-coords="grupoAtual.destinationCoords"
        :habitual-routes="grupoAtual.habitualRoutes || []"
        :shared-routes="grupoAtual.sharedRoutes || []"
        @updated="carregarTudo"
      />
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

.section-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.section-tab {
  flex: 1 1 220px;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--text-muted);
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  font-size: $text-sm;
  font-weight: $font-semibold;
  transition: all $duration-normal $ease-fluid;

  &:hover {
    color: var(--text);
    outline-color: var(--primary);
  }

  &.active {
    background: var(--primary);
    color: var(--color-on-primary);
    outline-color: var(--primary);
  }
}

.sections-stack {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
</style>
