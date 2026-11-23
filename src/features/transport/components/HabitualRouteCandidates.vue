<script setup>
import { formatAddress } from '@/utils/formatters'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  candidates: { type: Array, default: () => [] },
  selectedCount: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'focus'])
</script>

<template>
  <div class="candidates-box">
    <h4>
      Passageiros disponíveis no grupo ({{ candidates.length }}) · Selecionados
      ({{ selectedCount }})
    </h4>
    <p v-if="loading" class="empty-hint">Carregando passageiros sem rota...</p>
    <p v-else-if="!candidates.length" class="empty-hint">
      Todos os passageiros deste grupo já possuem rota habitual (ou nenhum passageiro foi atribuído ao grupo ainda).
    </p>
    <ul v-else class="candidate-list">
      <li
        v-for="item in candidates"
        :key="item.group_membership_id"
        :class="['candidate-item', { selected: item.selected }]"
      >
        <label class="candidate-check">
          <input
            type="checkbox"
            :checked="item.selected"
            :disabled="disabled"
            @change="emit('toggle', item)"
          />
          <div class="candidate-info">
            <strong>{{ item.passenger_name }}</strong>
            <span class="candidate-addr">{{ formatAddress(item) }}</span>
            <span v-if="item.latitude != null && item.longitude != null" class="candidate-coords">
              Ponto: {{ Number(item.latitude).toFixed(5) }}, {{ Number(item.longitude).toFixed(5) }}
            </span>
            <span v-else class="candidate-coords missing">
              Sem coordenadas do CEP — ao selecionar, um pino arrastável será colocado no mapa.
            </span>
          </div>
        </label>
        <BaseButton
          v-if="item.latitude != null && item.longitude != null"
          variant="outline"
          size="sm"
          @click="emit('focus', item)"
        >
          Ver no mapa
        </BaseButton>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.candidates-box,
.candidate-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.empty-hint {
  font-size: $text-xs;
  color: var(--text-muted);
  margin-bottom: $space-2;
}

.candidate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);

  &.selected {
    border-color: var(--primary);
    background: var(--color-primary-soft);
  }
}

.candidate-check {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  cursor: pointer;
  flex: 1;
  min-width: 200px;
}

.candidate-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: $text-sm;
}

.candidate-addr,
.candidate-coords {
  font-size: $text-xs;
  color: var(--text-muted);

  &.missing {
    color: var(--danger);
  }
}
</style>
