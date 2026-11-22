<script setup>
import { computed } from 'vue'
import { SERVICE_DIRECTIONS } from '@/constants'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const props = defineProps({
  transport: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-travel', 'unavailable'])
const isInProgress = computed(() => props.transport.travelStatus === 'in_progress')
</script>

<template>
  <BaseCard
    :title="`Viagem #${transport.travel.id} · ${transport.travel.date} (${transport.travel.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno'})`"
    :subtitle="`Revisão ${transport.revision} · Publicada: ${transport.publishedRevision ?? 'nenhuma'} · Planejamento: ${transport.planningStatus}`"
  >
    <template #actions>
      <span class="status-badge" :class="isInProgress ? 'active' : 'inactive'">
        {{ transport.travelStatus }}
      </span>
    </template>

    <p class="sub-text">
      Veículo designado: <strong>{{ transport.vehicleId ? `#${transport.vehicleId}` : 'Não atribuído' }}</strong> ·
      Participantes: <strong>{{ transport.passageirosNaRota }}</strong> ·
      Embarcados: <strong>{{ transport.passageirosEmbarcados }}</strong> ·
      Pendentes: <strong>{{ transport.passageirosPendentes }}</strong>
    </p>

    <StatusBanner
      v-if="!isInProgress && !transport.publicationCurrent"
      variant="warning"
      :message="`Bloqueio de início: a revisão atual (${transport.revision}) ainda não está pronta e publicada pela empresa.`"
    />

    <StatusBanner
      v-if="isInProgress && (transport.passageirosEmbarcados > 0 || transport.passageirosPendentes > 0)"
      variant="warning"
      message="Para finalizar a viagem, registre embarque/ausência de todos os participantes alocados e o desembarque de quem está a bordo."
    />

    <div class="action-row">
      <BaseButton
        v-if="transport.travelStatus === 'scheduled' || isInProgress"
        :icon="isInProgress ? 'mdi-flag-checkered' : 'mdi-arrow-right'"
        :disabled="busy || (!isInProgress && !transport.publicationCurrent)"
        @click="emit('toggle-travel')"
      >
        {{ isInProgress ? 'Finalizar Viagem' : `Iniciar Viagem Publicada (Revisão ${transport.revision})` }}
      </BaseButton>

      <BaseButton
        v-if="transport.travelStatus === 'scheduled'"
        variant="outline"
        :disabled="busy"
        @click="emit('unavailable', transport.travel)"
      >
        Informar Indisponibilidade
      </BaseButton>
    </div>
  </BaseCard>
</template>

<style lang="scss" scoped>
.status-badge {
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  font-size: $text-xs;
  font-weight: $font-bold;

  &.active {
    background: var(--success-soft);
    color: var(--success);
  }

  &.inactive {
    background: var(--color-primary-soft);
    color: var(--primary);
  }
}

.sub-text {
  font-size: $text-sm;
  color: var(--text-muted);
  line-height: 1.5;

  strong {
    color: var(--text);
  }
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
