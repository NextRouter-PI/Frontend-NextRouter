<script setup>
import { PERSONAL_ROLES, SERVICE_DIRECTIONS, USER_ROLES } from '@/constants'
import { formatDateBr } from '@/utils/formatters'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const PARTICIPATION_LABELS = {
  allocated: 'Alocado',
  on_board: 'Embarcado',
  dropped_off: 'Desembarcado',
  no_show: 'Ausente',
  withdrawn: 'Desistência',
}

const props = defineProps({
  role: { type: String, default: '' },
  finishedTravels: { type: Array, required: true },
  participationsByTravel: { type: Object, required: true },
  droppedOffTravelIds: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['select-lost-item'])

function canReportLostItem(travel) {
  if (props.role === USER_ROLES.DRIVER) return true
  if (props.role === USER_ROLES.PASSENGER) return props.droppedOffTravelIds.has(travel.id)
  return false
}
</script>

<template>
  <BaseCard :title="`Viagens Passadas (${finishedTravels.length})`">
    <p v-if="!finishedTravels.length && !loading" class="status-msg">
      Nenhuma viagem finalizada registrada no seu histórico até o momento.
    </p>
    <div v-else class="item-list">
      <div v-for="travel in finishedTravels" :key="travel.id" class="history-card">
        <div class="card-row">
          <div>
            <strong>
              Viagem #{{ travel.id }} · {{ formatDateBr(travel.date) }}
              ({{ travel.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }})
            </strong>
            <p class="meta-line">
              Veículo: {{ travel.vehicle ? `#${travel.vehicle}` : 'Não informado' }} ·
              Motorista: {{ travel.driver ? `#${travel.driver}` : 'Não informado' }}
              <template v-if="role === USER_ROLES.PASSENGER && participationsByTravel.get(travel.id)">
                · Sua presença:
                <strong>
                  {{
                    PARTICIPATION_LABELS[participationsByTravel.get(travel.id).status] ||
                    participationsByTravel.get(travel.id).status
                  }}
                </strong>
              </template>
            </p>
          </div>
          <BaseButton
            v-if="PERSONAL_ROLES.includes(role) && canReportLostItem(travel)"
            variant="outline"
            size="sm"
            icon="mdi-bag-personal-off-outline"
            :disabled="busy"
            @click="emit('select-lost-item', travel.id)"
          >
            Relatar item perdido
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<style lang="scss" scoped>
.item-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.history-card {
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;
}

.status-msg,
.meta-line {
  font-size: $text-xs;
  color: var(--text-muted);

  strong {
    color: var(--text);
  }
}
</style>
