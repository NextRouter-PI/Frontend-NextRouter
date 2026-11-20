<script setup>
import { ref, useTemplateRef } from 'vue'
import { PERSONAL_ROLES, SERVICE_DIRECTIONS, USER_ROLES } from '@/constants'
import { formatDateTimeBr } from '@/utils/formatters'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  role: { type: String, default: '' },
  finishedTravels: { type: Array, required: true },
  reportableTravels: { type: Array, required: true },
  lostItems: { type: Array, required: true },
  participationsByTravel: { type: Object, required: true },
  droppedOffTravelIds: { type: Object, required: true },
  formatDate: { type: Function, required: true },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['submit-lost-item', 'advance-lost-item'])

const lostItemsSectionEl = useTemplateRef('lostItemsAnchor')
const form = ref({ travel_id: '', item_description: '' })

const PARTICIPATION_LABELS = {
  allocated: 'Alocado',
  on_board: 'Embarcado',
  dropped_off: 'Desembarcado',
  no_show: 'Ausente',
  withdrawn: 'Desistência',
}

const LOST_ITEM_LABELS = {
  reported: 'Relatado',
  found: 'Encontrado',
  returned: 'Devolvido',
}

function canReportLostItem(travel) {
  if (props.role === USER_ROLES.DRIVER) return true
  if (props.role === USER_ROLES.PASSENGER) return props.droppedOffTravelIds.has(travel.id)
  return false
}

function selectTravelForLostItem(travelId) {
  form.value.travel_id = travelId
  lostItemsSectionEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function submit() {
  if (!form.value.travel_id || !form.value.item_description.trim()) return
  emit('submit-lost-item', {
    ...form.value,
    onSuccess: () => {
      form.value = { travel_id: '', item_description: '' }
    },
  })
}
</script>

<template>
  <div class="travels-and-lost">
    <BaseCard :title="`Viagens Passadas (${finishedTravels.length})`">
      <p v-if="!finishedTravels.length && !loading" class="status-msg">
        Nenhuma viagem finalizada registrada no seu histórico até o momento.
      </p>
      <div v-else class="item-list">
        <div v-for="travel in finishedTravels" :key="travel.id" class="history-card">
          <div class="card-row">
            <div>
              <strong>
                Viagem #{{ travel.id }} · {{ formatDate(travel.date) }}
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
              @click="selectTravelForLostItem(travel.id)"
            >
              Relatar item perdido
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>

    <div ref="lostItemsAnchor">
      <BaseCard
        :title="`Itens Perdidos (${lostItems.length})`"
        subtitle="Registre itens perdidos nas viagens finalizadas e acompanhe o andamento com a empresa (Relatado → Encontrado → Devolvido)."
      >
        <form
          v-if="PERSONAL_ROLES.includes(role) && reportableTravels.length"
          class="inline-form"
          @submit.prevent="submit"
        >
          <select v-model="form.travel_id" required :disabled="busy" aria-label="Selecionar viagem finalizada">
            <option value="">Selecionar viagem finalizada...</option>
            <option v-for="t in reportableTravels" :key="t.id" :value="t.id">
              Viagem #{{ t.id }} · {{ formatDate(t.date) }}
              ({{ t.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }})
            </option>
          </select>
          <input
            v-model="form.item_description"
            placeholder="Descrição do item perdido (até 255 caracteres)"
            maxlength="255"
            required
            :disabled="busy"
          />
          <BaseButton type="submit" size="sm" :disabled="busy">Registrar item perdido</BaseButton>
        </form>
        <p v-else-if="PERSONAL_ROLES.includes(role) && !loading" class="status-msg">
          Você poderá registrar itens perdidos assim que tiver uma viagem finalizada concluída.
        </p>

        <p v-if="!lostItems.length && !loading" class="status-msg">Nenhum item perdido registrado.</p>
        <div v-else class="item-list">
          <div v-for="item in lostItems" :key="item.id" class="history-card">
            <div class="card-row">
              <div>
                <strong>
                  Item #{{ item.id }} · Viagem #{{ item.travel }} · Estado:
                  {{ LOST_ITEM_LABELS[item.status] || item.status }}
                </strong>
                <p class="item-desc">{{ item.item_description }}</p>
                <p class="meta-line">
                  Histórico:
                  <span v-for="ev in item.events || []" :key="ev.id">
                    [{{ LOST_ITEM_LABELS[ev.status] || ev.status }} em {{ formatDateTimeBr(ev.occurred_at) }}]
                  </span>
                </p>
              </div>
              <div v-if="role === USER_ROLES.COMPANY" class="action-buttons">
                <BaseButton
                  v-if="item.status === 'reported'"
                  size="sm"
                  :disabled="busy"
                  @click="emit('advance-lost-item', { item, targetStatus: 'found' })"
                >
                  Marcar encontrado
                </BaseButton>
                <BaseButton
                  v-else-if="item.status === 'found'"
                  size="sm"
                  :disabled="busy"
                  @click="emit('advance-lost-item', { item, targetStatus: 'returned' })"
                >
                  Marcar devolvido
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.travels-and-lost {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.inline-form {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  input,
  select {
    flex: 1 1 180px;
    padding: 9px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
  }
}

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

.item-desc {
  margin: $space-1 0;
  font-size: $text-md;
  color: var(--text);
}

.status-msg,
.meta-line {
  font-size: $text-xs;
  color: var(--text-muted);

  strong {
    color: var(--text);
  }
}

.action-buttons {
  display: flex;
  gap: $space-2;
}
</style>
