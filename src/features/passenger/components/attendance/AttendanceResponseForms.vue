<script setup>
import { SERVICE_DIRECTIONS, WINDOW_STATES } from '@/constants'
import BaseButton from '@/components/ui/BaseButton.vue'
import AttendanceNormalForm from './AttendanceNormalForm.vue'
import AttendanceExtensionForm from './AttendanceExtensionForm.vue'

const outboundChoice = defineModel('outboundChoice', { type: String, default: '' })
const returnChoice = defineModel('returnChoice', { type: String, default: '' })
const changeLeg = defineModel('changeLeg', { type: String, default: SERVICE_DIRECTIONS.OUTBOUND })
const proposedServiceId = defineModel('proposedServiceId', { type: String, default: '' })
const editingAnswer = defineModel('editingAnswer', { type: Boolean, default: false })

defineProps({
  eligibility: { type: Object, required: true },
  alreadyAnswered: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  serviceLabel: { type: Function, required: true },
})

const emit = defineEmits(['submit-normal', 'submit-extension', 'cancel-request'])
</script>

<template>
  <div class="response-forms">
    <div
      v-if="eligibility.dayData.window === WINDOW_STATES.NORMAL && alreadyAnswered && !editingAnswer"
      class="answered-box"
    >
      <p class="answered-title">
        <span class="mdi mdi-check-circle-outline" aria-hidden="true"></span>
        Você já respondeu este atendimento.
      </p>
      <p class="sub-info">
        Para evitar conflitos, sua resposta atual está salva acima. Caso precise mudar sua ida ou retorno antes do fechamento da janela, clique abaixo.
      </p>
      <div>
        <BaseButton variant="outline" size="sm" :disabled="busy" @click="editingAnswer = true">
          Alterar minha resposta
        </BaseButton>
      </div>
    </div>

    <AttendanceNormalForm
      v-else-if="eligibility.dayData.window === WINDOW_STATES.NORMAL"
      v-model:outbound-choice="outboundChoice"
      v-model:return-choice="returnChoice"
      :eligibility="eligibility"
      :already-answered="alreadyAnswered"
      :busy="busy"
      @submit="emit('submit-normal')"
      @cancel-edit="editingAnswer = false"
    />

    <AttendanceExtensionForm
      v-else-if="eligibility.dayData.window === WINDOW_STATES.EXTENSION"
      v-model:change-leg="changeLeg"
      v-model:proposed-service-id="proposedServiceId"
      :eligibility="eligibility"
      :busy="busy"
      @submit="emit('submit-extension')"
    />

    <div v-if="eligibility.requests.length" class="requests-box">
      <h3 class="form-title">Pedidos na Prorrogação deste Atendimento</h3>
      <div v-for="req in eligibility.requests" :key="req.id" class="req-item">
        <div>
          <strong>
            Pedido #{{ req.id }} ({{ req.leg === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }})
          </strong>
          → {{ serviceLabel(eligibility, req.proposed_service) }}
          <p class="sub-info">
            Decisão: <strong>{{ req.status }}</strong> · Aplicação:
            <strong>{{ req.application || 'não aplicada' }}</strong>
            <span v-if="req.reason"> · Motivo: {{ req.reason }}</span>
          </p>
        </div>
        <BaseButton
          v-if="req.status === 'pending'"
          variant="outline"
          size="sm"
          :disabled="busy"
          @click="emit('cancel-request', req.id)"
        >
          Retirar pedido
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.response-forms {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.answered-box,
.requests-box {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding-top: $space-3;
  border-top: 1px solid var(--border);
}

.answered-title {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-weight: $font-bold;
  color: var(--success);
}

.form-title {
  font-size: $text-base;
  font-weight: $font-bold;
}

.sub-info {
  font-size: $text-sm;
  color: var(--text-muted);
  line-height: 1.45;
}

.req-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  font-size: $text-md;
}
</style>
