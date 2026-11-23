<script setup>
import { ref } from 'vue'
import {
  CHANGE_REQUEST_APPLICATION_LABELS,
  CHANGE_REQUEST_STATUS_LABELS,
  SERVICE_DIRECTIONS,
} from '@/constants'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  requests: { type: Array, required: true },
  serviceLabel: { type: Function, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['decide', 'apply'])
const motivoDecisao = ref({})
</script>

<template>
  <BaseCard
    v-if="requests.length"
    :title="`Pedidos na Prorrogação (${requests.length})`"
    subtitle="Aprovar um pedido reserva vaga e inicia o cálculo, mantendo a escolha e a alocação anteriores até que o cálculo termine e a empresa clique em Aplicar."
  >
    <div class="item-stack">
      <div v-for="req in requests" :key="req.id" class="sub-box">
        <p class="sub-title">
          Pedido #{{ req.id }} · Trecho:
          <strong>{{ req.leg === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }}</strong> ·
          Serviço proposto: {{ serviceLabel(req.proposed_service) }}
        </p>
        <p class="sub-meta">
          Decisão: <strong>{{ CHANGE_REQUEST_STATUS_LABELS[req.status] || req.status }}</strong> · Aplicação:
          <strong>{{ CHANGE_REQUEST_APPLICATION_LABELS[req.application] || req.application || 'não iniciada' }}</strong>
          <span v-if="req.reason"> · Motivo: {{ req.reason }}</span>
        </p>

        <div v-if="req.status === 'pending'" class="op-grid">
          <input
            v-model="motivoDecisao[req.id]"
            placeholder="Motivo opcional (até 500 caracteres)"
            maxlength="500"
            :disabled="busy"
          />
          <BaseButton
            size="sm"
            :disabled="busy"
            @click="emit('decide', { req, action: 'approve', reason: motivoDecisao[req.id] || '' })"
          >
            Aprovar e calcular
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="busy"
            @click="emit('decide', { req, action: 'reject', reason: motivoDecisao[req.id] || '' })"
          >
            Recusar
          </BaseButton>
        </div>

        <div v-else-if="req.status === 'approved' && req.application === 'preparing'" class="op-grid">
          <BaseButton size="sm" :disabled="busy" @click="emit('apply', req)">
            Aplicar alteração após cálculo pronto
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<style lang="scss" scoped>
.item-stack {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.sub-box {
  padding: $space-4;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.sub-title {
  font-size: $text-md;
}

.sub-meta {
  font-size: $text-xs;
  color: var(--text-muted);

  strong {
    color: var(--text);
  }
}

.op-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  input {
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
</style>
