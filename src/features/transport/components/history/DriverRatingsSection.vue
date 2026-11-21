<script setup>
import { ref } from 'vue'
import { SERVICE_DIRECTIONS, USER_ROLES } from '@/constants'
import { formatDateBr, formatDateTimeBr } from '@/utils/formatters'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  role: { type: String, default: '' },
  ratings: { type: Array, required: true },
  rateableTravels: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['submit-rating'])

const form = ref({ travel_id: '', score: 5, comment: '' })

function submit() {
  if (!form.value.travel_id) return
  emit('submit-rating', {
    ...form.value,
    onSuccess: () => {
      form.value = { travel_id: '', score: 5, comment: '' }
    },
  })
}
</script>

<template>
  <BaseCard
    :title="`Avaliações de Viagens Finalizadas (${ratings.length})`"
    subtitle="Passageiros que concluíram o desembarque em uma viagem finalizada podem avaliar o motorista (nota de 1 a 5)."
  >
    <form v-if="role === USER_ROLES.PASSENGER && rateableTravels.length" class="inline-form" @submit.prevent="submit">
      <select v-model="form.travel_id" required :disabled="busy" aria-label="Selecionar viagem para avaliar">
        <option value="">Selecionar viagem finalizada com desembarque...</option>
        <option v-for="t in rateableTravels" :key="t.id" :value="t.id">
          Viagem #{{ t.id }} · {{ formatDateBr(t.date) }} ({{ t.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }})
        </option>
      </select>
      <select v-model="form.score" required :disabled="busy" aria-label="Nota de 1 a 5">
        <option v-for="s in [5, 4, 3, 2, 1]" :key="s" :value="s">Nota {{ s }} ★</option>
      </select>
      <input
        v-model="form.comment"
        placeholder="Comentário opcional (até 500 caracteres)"
        maxlength="500"
        :disabled="busy"
      />
      <BaseButton type="submit" size="sm" :disabled="busy">Enviar avaliação</BaseButton>
    </form>

    <p v-if="!ratings.length && !loading" class="status-msg">Nenhuma avaliação registrada.</p>
    <div v-else class="item-list">
      <div v-for="r in ratings" :key="r.id" class="history-card">
        <strong>Viagem #{{ r.travel }} · Motorista #{{ r.driver }} · Nota {{ r.score }}/5 ★</strong>
        <p v-if="r.comment" class="meta-line">“{{ r.comment }}”</p>
        <p class="meta-line">Registrada em {{ formatDateTimeBr(r.created_at) }}</p>
      </div>
    </div>
  </BaseCard>
</template>

<style lang="scss" scoped>
.inline-form {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  input,
  select {
    flex: 1 1 160px;
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

.status-msg,
.meta-line {
  font-size: $text-xs;
  color: var(--text-muted);
}
</style>
