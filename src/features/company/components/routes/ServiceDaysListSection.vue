<script setup>
import { computed } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { buildOperationIndexes } from '@/features/company/utils/operationIndexes'
import EmptyState from '@/components/ui/EmptyState.vue'
import ServiceDayCard from './ServiceDayCard.vue'
import TravelOperationCard from './TravelOperationCard.vue'

defineProps({
  days: { type: Array, default: () => [] },
  dayLoading: { type: Boolean, default: false },
  statusFilter: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  veiculosAtivos: { type: Array, default: () => [] },
  motoristasAtivos: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'close-window',
  'revise',
  'cancel-day',
  'open-calculate',
  'publish-travel',
  'cancel-travel',
  'assign-vehicle',
  'invite-driver',
])

const store = useRotasStore()
const idx = computed(() => buildOperationIndexes(store))
</script>

<template>
  <Transition name="fade-slide" mode="out-in">
    <EmptyState v-if="dayLoading" key="loading" loading description="Carregando atendimentos e viagens..." />
    <EmptyState
      v-else-if="!days.length"
      key="empty"
      icon="mdi-calendar-remove-outline"
      description="Nenhum dia de atendimento encontrado para os filtros informados."
    />

    <div v-else key="list" class="days-stack">
      <ServiceDayCard
        v-for="(day, index) in days"
        :key="day.id"
        :day="day"
        :group-name="idx.getGroupName(day.route_group)"
        :resumo="idx.getResumo(day.id)"
        :travels-count="idx.getTravels(day.id).length"
        :busy="busy"
        :default-expanded="index === 0 && statusFilter === 'em_andamento'"
        @close-window="emit('close-window', $event)"
        @revise="emit('revise', $event)"
        @cancel="emit('cancel-day', $event)"
      >
        <p v-if="!idx.getTravels(day.id).length" class="sub-meta">
          Nenhuma viagem gerada para este atendimento.
        </p>
        <TravelOperationCard
          v-for="travel in idx.getTravels(day.id)"
          :key="travel.id"
          :travel="travel"
          :service-name="idx.getServiceName(travel.service)"
          :day-window="day.window"
          :participants-count="idx.getParticipantsCount(travel.id)"
          :snapshot="idx.getSnapshot(travel)"
          :job="idx.getJob(travel)"
          :veiculos-ativos="veiculosAtivos"
          :motoristas-ativos="motoristasAtivos"
          :busy="busy"
          @open-calculate="emit('open-calculate', travel.id)"
          @publish="emit('publish-travel', $event)"
          @cancel="emit('cancel-travel', travel)"
          @assign-vehicle="emit('assign-vehicle', $event)"
          @invite-driver="emit('invite-driver', $event)"
        />
      </ServiceDayCard>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.days-stack {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.sub-meta {
  font-size: $text-xs;
  color: var(--text-muted);
}
</style>
