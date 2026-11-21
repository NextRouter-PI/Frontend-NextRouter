<script setup>
import { useRotasStore } from '@/stores/useRotasStore'
import {
  jobDoSnapshot,
  nomeGrupo,
  nomeServico,
  participacoesListaDaViagem,
  resumoRespostasDia,
  snapshotDaViagem,
  viagensDoDia,
} from '@/features/company/utils/operationLookups'
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
</script>

<template>
  <EmptyState v-if="dayLoading" loading description="Carregando atendimentos e viagens..." />
  <EmptyState
    v-else-if="!days.length"
    icon="mdi-calendar-remove-outline"
    description="Nenhum dia de atendimento encontrado para os filtros informados."
  />

  <ServiceDayCard
    v-for="(day, index) in days"
    :key="day.id"
    :day="day"
    :group-name="nomeGrupo(store.grupos, day.route_group)"
    :resumo="resumoRespostasDia(store.elegibilidadesDia, day.id)"
    :travels-count="viagensDoDia(store.viagensDia, day.id).length"
    :busy="busy"
    :default-expanded="index === 0 && statusFilter === 'em_andamento'"
    @close-window="emit('close-window', $event)"
    @revise="emit('revise', $event)"
    @cancel="emit('cancel-day', $event)"
  >
    <p v-if="!viagensDoDia(store.viagensDia, day.id).length" class="sub-meta">
      Nenhuma viagem gerada para este atendimento.
    </p>
    <TravelOperationCard
      v-for="travel in viagensDoDia(store.viagensDia, day.id)"
      :key="travel.id"
      :travel="travel"
      :service-name="nomeServico(store.servicos, travel.service)"
      :day-window="day.window"
      :participants-count="participacoesListaDaViagem(store.participacoesViagem, travel.id).length"
      :snapshot="snapshotDaViagem(store.snapshotsViagem, travel)"
      :job="jobDoSnapshot(store.snapshotsViagem, store.jobsCalculo, travel)"
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
</template>

<style lang="scss" scoped>
.sub-meta {
  font-size: $text-xs;
  color: var(--text-muted);
}
</style>
