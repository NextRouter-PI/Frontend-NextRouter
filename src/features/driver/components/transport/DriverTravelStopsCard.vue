<script setup>
import { DOMAIN_STATUS_LABELS, PARTICIPATION_STATUS_LABELS } from '@/constants'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  stops: { type: Array, required: true },
  participations: { type: Array, required: true },
  isInProgress: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['handle-stop', 'record-presence'])
</script>

<template>
  <div class="stops-and-participants">
    <BaseCard :title="`Paradas na Ordem do Percurso (${stops.length})`">
      <p v-if="!stops.length" class="sub-text">Nenhuma parada materializada para este percurso.</p>
      <ul v-else class="stop-list">
        <li v-for="stop in stops" :key="stop.id" class="stop-item">
          <div class="stop-header">
            <strong>{{ stop.position }}. {{ stop.pointLabel }}</strong>
            <span class="stop-state">{{ stop.state }}</span>
          </div>
          <p v-if="stop.enrichedParticipants.length" class="sub-text">
            Atendimentos nesta parada:
            <span
              v-for="sp in stop.enrichedParticipants"
              :key="`${stop.id}-${sp.participation}-${sp.operation}`"
            >
              {{ sp.name }} ({{ sp.operation === 'board' ? 'Embarque' : 'Desembarque' }} — {{ DOMAIN_STATUS_LABELS[sp.status] || sp.status }}) ·
            </span>
          </p>
          <div v-if="isInProgress && stop.state === 'waiting'" class="action-row">
            <BaseButton size="sm" :disabled="busy" @click="emit('handle-stop', stop.id, false)">
              Concluir parada
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="busy"
              @click="emit('handle-stop', stop.id, true)"
            >
              Ignorar parada
            </BaseButton>
          </div>
        </li>
      </ul>
    </BaseCard>

    <BaseCard
      :title="`Participações e Presença (${participations.length})`"
      subtitle="Participações contêm apenas o nome do passageiro e o estado operacional; dados cadastrais e endereço pessoal não são expostos."
    >
      <p v-if="!participations.length" class="sub-text">Nenhum participante alocado nesta viagem.</p>
      <ul v-else class="passenger-list">
        <li v-for="part in participations" :key="part.id" class="passenger-item">
          <div class="passenger-avatar">{{ (part.name || 'P').charAt(0) }}</div>
          <div class="passenger-info">
            <span class="passenger-name">{{ part.name || `Participante #${part.id}` }}</span>
            <span class="passenger-status">{{ PARTICIPATION_STATUS_LABELS[part.status] || part.status }}</span>
          </div>
          <div v-if="isInProgress" class="action-row">
            <BaseButton
              v-if="part.status === 'allocated'"
              size="sm"
              :disabled="busy"
              @click="emit('record-presence', part.id, 'boarded')"
            >
              Embarcou
            </BaseButton>
            <BaseButton
              v-if="part.status === 'allocated'"
              variant="outline"
              size="sm"
              :disabled="busy"
              @click="emit('record-presence', part.id, 'no_show')"
            >
              Ausente
            </BaseButton>
            <BaseButton
              v-if="part.status === 'on_board'"
              size="sm"
              :disabled="busy"
              @click="emit('record-presence', part.id, 'dropped_off')"
            >
              Desembarcou
            </BaseButton>
          </div>
        </li>
      </ul>
    </BaseCard>
  </div>
</template>

<style lang="scss" scoped>
.stops-and-participants {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.sub-text {
  font-size: $text-sm;
  color: var(--text-muted);
  line-height: 1.45;
}

.stop-list,
.passenger-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.stop-item {
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.stop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  font-size: $text-md;
}

.stop-state {
  font-size: $text-xs;
  font-weight: $font-bold;
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
}

.passenger-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  flex-wrap: wrap;
}

.passenger-avatar {
  width: 36px;
  height: 36px;
  border-radius: $radius-round;
  @include flex-center;
  background: var(--primary);
  color: var(--color-on-primary);
  font-weight: $font-bold;
  flex-shrink: 0;
}

.passenger-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 140px;
}

.passenger-name {
  font-weight: $font-semibold;
  font-size: $text-md;
  color: var(--text);
}

.passenger-status {
  font-size: $text-xs;
  color: var(--text-muted);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
