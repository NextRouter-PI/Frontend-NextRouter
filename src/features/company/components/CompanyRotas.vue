<script setup>
import { onMounted, shallowRef } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import CompanyRouteGroupsTab from '@/features/company/components/routes/CompanyRouteGroupsTab.vue'
import CompanyDatedOperationTab from '@/features/company/components/routes/CompanyDatedOperationTab.vue'
import TransportHistoryNotifications from '@/features/transport/components/TransportHistoryNotifications.vue'

const store = useRotasStore()
const scope = useAccountScope()
const { toast, showToast } = useToast()

const aba = shallowRef('grupos')

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

    <Transition name="fade-slide">
      <StatusBanner
        v-if="toast"
        :variant="toast.type === 'error' ? 'danger' : 'success'"
        :icon="toast.type === 'error' ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'"
        :message="toast.message"
      />
    </Transition>

    <div class="tab-bar" role="tablist" aria-label="Programação habitual, operação por data e histórico">
      <button
        type="button"
        role="tab"
        :aria-selected="aba === 'grupos'"
        :class="['tab-btn', { active: aba === 'grupos' }]"
        @click="aba = 'grupos'"
      >
        Grupos e Programação Habitual ({{ store.grupos.length }})
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="aba === 'operacao'"
        :class="['tab-btn', { active: aba === 'operacao' }]"
        @click="aba = 'operacao'"
      >
        Atendimentos, Respostas e Viagens por Data ({{ store.diasAtendimento.length }})
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="aba === 'historico'"
        :class="['tab-btn', { active: aba === 'historico' }]"
        @click="aba = 'historico'"
      >
        Avisos, Avaliações e Objetos Perdidos
      </button>
    </div>

    <CompanyRouteGroupsTab v-if="aba === 'grupos'" />
    <CompanyDatedOperationTab v-else-if="aba === 'operacao'" @toast="handleToast" />
    <TransportHistoryNotifications v-else />
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

.tab-bar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.tab-btn {
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
</style>
