<script setup>
import { computed, shallowRef } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useDatedOperationCoordinator } from '@/features/company/composables/useDatedOperationCoordinator'
import { createDatedOperationHandlers } from '@/features/company/composables/useDatedOperationActions'
import {
  destinationPointForTravel,
  jobDoSnapshot,
  nomeServico,
  originPointForTravel,
  participacoesListaDaViagem,
  snapshotDaViagem,
} from '@/features/company/utils/operationLookups'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import BatchHorizonCard from './BatchHorizonCard.vue'
import OperationFiltersCard from './OperationFiltersCard.vue'
import ChangeRequestsCard from './ChangeRequestsCard.vue'
import ServiceDaysListSection from './ServiceDaysListSection.vue'
import RouteCalculationModal from './RouteCalculationModal.vue'

const emit = defineEmits(['toast'])

// Os formulários de lote/cancelamento ficam fechados: abrem pelo botão da barra de ações.
const showBatch = shallowRef(false)

const store = useRotasStore()
const scope = useAccountScope()

const {
  busy,
  filtroGrupoId,
  filtroData,
  filtroStatusDia,
  calcTravelId,
  pendingCancel,
  motoristasAtivos,
  veiculosAtivos,
  diasAtendimentoFiltrados,
  consultarOperacao,
  runAction,
  executePendingCancel,
  handleGenerateHorizon,
  handleCancelDate,
  handleCancelDay,
  handleCancelTravel,
  handleInviteDriver,
} = useDatedOperationCoordinator({
  store,
  scope,
  onToast: (payload) => emit('toast', payload),
})

const calcTravel = computed(() =>
  calcTravelId.value ? store.viagensDia.find((t) => t.id === calcTravelId.value) || null : null,
)
const calcSnapshot = computed(() => (calcTravel.value ? snapshotDaViagem(store.snapshotsViagem, calcTravel.value) : null))
const calcJob = computed(() => (calcTravel.value ? jobDoSnapshot(store.snapshotsViagem, store.jobsCalculo, calcTravel.value) : null))
const calcParticipants = computed(() =>
  calcTravel.value ? participacoesListaDaViagem(store.participacoesViagem, calcTravel.value.id) : [],
)

const {
  handleDecideRequest,
  handleApplyRequest,
  handleCloseDayWindow,
  handleReviseDay,
  handlePublishTravel,
  handleAssignVehicle,
  handleCalculateTravel,
  handlePublishModalTravel,
} = createDatedOperationHandlers({ store, scope, calcTravelId, runAction })
</script>

<template>
  <div class="operation-tab">
    <div class="operation-actions">
      <div class="operation-actions-copy">
        <strong>Dias de atendimento</strong>
        <span>{{ store.diasAtendimento.length }} dias carregados · filtre, revise e publique as viagens.</span>
      </div>
      <button type="button" class="operation-add" :class="{ open: showBatch }" @click="showBatch = !showBatch">
        <BaseIcon :name="showBatch ? 'mdi-close' : 'mdi-plus'" />
        {{ showBatch ? 'Fechar' : 'Aplicar atendimentos ou cancelar data' }}
      </button>
    </div>

    <Transition name="fade-slide">
      <BatchHorizonCard
        v-if="showBatch"
        :grupos="store.grupos"
        :busy="busy"
        @generate-horizon="handleGenerateHorizon"
        @cancel-date="handleCancelDate"
      />
    </Transition>

    <OperationFiltersCard
      v-model:group-id="filtroGrupoId"
      v-model:date="filtroData"
      v-model:status-filter="filtroStatusDia"
      :grupos="store.grupos"
      :total-days="store.diasAtendimento.length"
      :disabled="busy || store.dayLoading"
      @refresh="consultarOperacao"
    />

    <ChangeRequestsCard
      :requests="store.pedidosAlteracao"
      :service-label="(serviceId) => nomeServico(store.servicos, serviceId)"
      :busy="busy"
      @decide="handleDecideRequest"
      @apply="handleApplyRequest"
    />

    <ServiceDaysListSection
      :days="diasAtendimentoFiltrados"
      :day-loading="store.dayLoading"
      :status-filter="filtroStatusDia"
      :busy="busy"
      :veiculos-ativos="veiculosAtivos"
      :motoristas-ativos="motoristasAtivos"
      @close-window="handleCloseDayWindow"
      @revise="handleReviseDay"
      @cancel-day="handleCancelDay"
      @open-calculate="calcTravelId = $event"
      @publish-travel="handlePublishTravel"
      @cancel-travel="handleCancelTravel"
      @assign-vehicle="handleAssignVehicle"
      @invite-driver="handleInviteDriver"
    />

    <RouteCalculationModal
      :open="Boolean(calcTravel)"
      :travel="calcTravel"
      :service-name="calcTravel ? nomeServico(store.servicos, calcTravel.service) : ''"
      :origin-point="originPointForTravel({ travel: calcTravel, ...store })"
      :destination-point="destinationPointForTravel({ travel: calcTravel, ...store })"
      :participants="calcParticipants"
      :snapshot="calcSnapshot"
      :job="calcJob"
      :busy="busy"
      @close="calcTravelId = null"
      @calculate="handleCalculateTravel"
      @publish="handlePublishModalTravel"
    />

    <ConfirmDialog
      :open="Boolean(pendingCancel)"
      :title="pendingCancel?.title || 'Confirmar cancelamento'"
      :message="pendingCancel?.message || ''"
      :warning="pendingCancel?.warning || ''"
      :confirm-label="pendingCancel?.confirmLabel || 'Confirmar'"
      :busy="busy"
      @cancel="pendingCancel = null"
      @confirm="executePendingCancel"
    />
  </div>
</template>

<style lang="scss" scoped>
.operation-tab {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.operation-actions {
  @include surface-card($space-4, $radius-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $space-3;
}

.operation-actions-copy {
  display: flex;
  flex-direction: column;

  span {
    font-size: $text-sm;
    color: var(--text-muted);
  }
}

.operation-add {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  height: 44px;
  padding: 0 $space-5;
  border-radius: $radius-md;
  background: var(--gradient-brand);
  color: var(--color-on-primary);
  font-weight: $font-bold;
  box-shadow: var(--shadow-primary);
  transition:
    transform $duration-normal $ease-fluid,
    box-shadow $duration-normal $ease-fluid;

  .mdi {
    font-size: 1.2rem;
    transition: transform $duration-slow $ease-spring;
  }

  &:hover {
    transform: translateY(-2px);

    .mdi {
      transform: rotate(90deg);
    }
  }

  &.open {
    background: var(--color-surface);
    color: var(--text);
    outline: 1.5px solid var(--border);
    box-shadow: none;
  }
}
</style>
