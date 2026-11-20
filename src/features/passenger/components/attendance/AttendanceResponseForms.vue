<script setup>
import { computed } from 'vue'
import { SERVICE_DIRECTIONS, WINDOW_STATES } from '@/constants'
import BaseButton from '@/components/ui/BaseButton.vue'

const outboundChoice = defineModel('outboundChoice', { type: String, default: '' })
const returnChoice = defineModel('returnChoice', { type: String, default: '' })
const changeLeg = defineModel('changeLeg', { type: String, default: SERVICE_DIRECTIONS.OUTBOUND })
const proposedServiceId = defineModel('proposedServiceId', { type: String, default: '' })
const editingAnswer = defineModel('editingAnswer', { type: Boolean, default: false })

const props = defineProps({
  eligibility: { type: Object, required: true },
  alreadyAnswered: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  serviceLabel: { type: Function, required: true },
})

const emit = defineEmits(['submit-normal', 'submit-extension', 'cancel-request'])

const extensionServices = computed(() =>
  changeLeg.value === SERVICE_DIRECTIONS.OUTBOUND
    ? props.eligibility.outboundServices
    : props.eligibility.returnServices,
)

function selectExtensionLeg(leg) {
  changeLeg.value = leg
  proposedServiceId.value = ''
}
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
      <BaseButton variant="outline" size="sm" :disabled="busy" @click="editingAnswer = true">
        Alterar minha resposta
      </BaseButton>
    </div>

    <form
      v-else-if="eligibility.dayData.window === WINDOW_STATES.NORMAL"
      class="response-form"
      @submit.prevent="emit('submit-normal')"
    >
      <h3 class="form-title">
        {{ alreadyAnswered ? 'Alterar resposta na Janela Normal' : 'Responder na Janela Normal' }}
        (Revisão esperada: {{ eligibility.response?.revision ?? 0 }})
      </h3>

      <div class="question-block">
        <div class="question-header">
          <span class="question-badge">1</span>
          <span>Trecho de Ida (escolha apenas uma opção)</span>
        </div>
        <div class="options-grid" role="radiogroup" aria-label="Opções de ida">
          <button
            type="button"
            role="radio"
            :aria-checked="outboundChoice === ''"
            :class="['option-card', { selected: outboundChoice === '' }]"
            :disabled="busy"
            @click="outboundChoice = ''"
          >
            <span class="mdi mdi-close-circle-outline option-icon" aria-hidden="true"></span>
            <div class="option-copy">
              <span class="option-time">Não vou na ida</span>
              <span class="option-sub">Negativa para o trecho de ida</span>
            </div>
          </button>

          <button
            v-for="srv in eligibility.outboundServices"
            :key="srv.id"
            type="button"
            role="radio"
            :aria-checked="outboundChoice === String(srv.id)"
            :class="['option-card', { selected: outboundChoice === String(srv.id) }]"
            :disabled="busy"
            @click="outboundChoice = String(srv.id)"
          >
            <span class="mdi mdi-bus-clock option-icon" aria-hidden="true"></span>
            <div class="option-copy">
              <span class="option-time">{{ srv.targetTimeLabel }}</span>
              <span class="option-sub">
                {{ srv.name }} · {{ srv.is_shared ? 'Compartilhado' : 'Habitual' }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div class="question-block">
        <div class="question-header">
          <span class="question-badge">2</span>
          <span>Trecho de Retorno (escolha apenas um horário)</span>
        </div>
        <div class="options-grid" role="radiogroup" aria-label="Opções de retorno">
          <button
            type="button"
            role="radio"
            :aria-checked="returnChoice === ''"
            :class="['option-card', { selected: returnChoice === '' }]"
            :disabled="busy"
            @click="returnChoice = ''"
          >
            <span class="mdi mdi-close-circle-outline option-icon" aria-hidden="true"></span>
            <div class="option-copy">
              <span class="option-time">Não volto com o transporte</span>
              <span class="option-sub">Negativa para o trecho de retorno</span>
            </div>
          </button>

          <button
            v-for="srv in eligibility.returnServices"
            :key="srv.id"
            type="button"
            role="radio"
            :aria-checked="returnChoice === String(srv.id)"
            :class="['option-card', { selected: returnChoice === String(srv.id) }]"
            :disabled="busy"
            @click="returnChoice = String(srv.id)"
          >
            <span class="mdi mdi-bus-clock option-icon" aria-hidden="true"></span>
            <div class="option-copy">
              <span class="option-time">{{ srv.targetTimeLabel }}</span>
              <span class="option-sub">
                {{ srv.name }} · {{ srv.is_shared ? 'Compartilhado' : 'Habitual' }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div class="form-actions">
        <BaseButton type="submit" icon="mdi-check" :loading="busy">
          {{ busy ? 'Enviando...' : 'Salvar Resposta de Ida e Retorno' }}
        </BaseButton>
        <BaseButton
          v-if="alreadyAnswered"
          variant="outline"
          :disabled="busy"
          @click="editingAnswer = false"
        >
          Cancelar alteração
        </BaseButton>
      </div>
    </form>

    <form
      v-else-if="eligibility.dayData.window === WINDOW_STATES.EXTENSION"
      class="response-form"
      @submit.prevent="emit('submit-extension')"
    >
      <h3 class="form-title">Janela em Prorrogação — Solicitar Inclusão ou Troca</h3>
      <p class="sub-info">
        Na prorrogação, alterações dependem de decisão da empresa, recálculo de rota e aplicação validada. Sua escolha e alocação anteriores são preservadas até a aplicação.
      </p>

      <div class="leg-switch">
        <BaseButton
          variant="outline"
          size="sm"
          :class="{ selected: changeLeg === SERVICE_DIRECTIONS.OUTBOUND }"
          :disabled="busy"
          @click="selectExtensionLeg(SERVICE_DIRECTIONS.OUTBOUND)"
        >
          Alterar Ida
        </BaseButton>
        <BaseButton
          variant="outline"
          size="sm"
          :class="{ selected: changeLeg === SERVICE_DIRECTIONS.RETURN }"
          :disabled="busy"
          @click="selectExtensionLeg(SERVICE_DIRECTIONS.RETURN)"
        >
          Alterar Retorno
        </BaseButton>
      </div>

      <div class="options-grid">
        <button
          v-for="srv in extensionServices"
          :key="srv.id"
          type="button"
          :class="['option-card', { selected: proposedServiceId === String(srv.id) }]"
          :disabled="busy"
          @click="proposedServiceId = String(srv.id)"
        >
          <span class="mdi mdi-clock-edit-outline option-icon" aria-hidden="true"></span>
          <div class="option-copy">
            <span class="option-time">{{ srv.targetTimeLabel }}</span>
            <span class="option-sub">
              {{ srv.name }} · {{ srv.is_shared ? 'Compartilhado' : 'Habitual' }}
            </span>
          </div>
        </button>
        <p v-if="!extensionServices.length" class="sub-info">Nenhum serviço autorizado neste sentido.</p>
      </div>

      <BaseButton type="submit" :loading="busy" :disabled="!proposedServiceId">
        {{ busy ? 'Enviando pedido...' : 'Enviar Pedido na Prorrogação' }}
      </BaseButton>
    </form>

    <div v-if="eligibility.requests.length" class="requests-box">
      <h3 class="form-title">Pedidos na Prorrogação deste Atendimento</h3>
      <div v-for="req in eligibility.requests" :key="req.id" class="req-item">
        <div>
          <strong>Pedido #{{ req.id }} ({{ req.leg === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }})</strong>
          → {{ serviceLabel(eligibility, req.proposed_service) }}
          <p class="sub-info">
            Decisão: <strong>{{ req.status }}</strong> ·
            Aplicação: <strong>{{ req.application || 'não aplicada' }}</strong>
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
.response-form,
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
  color: var(--text);
}

.sub-info {
  font-size: $text-sm;
  color: var(--text-muted);
  line-height: 1.45;
}

.question-block {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.question-header {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-weight: $font-semibold;
  font-size: $text-md;
}

.question-badge {
  width: 24px;
  height: 24px;
  border-radius: $radius-round;
  @include flex-center;
  background: var(--primary);
  color: var(--color-on-primary);
  font-size: $text-xs;
  font-weight: $font-bold;
  flex-shrink: 0;
}

.options-grid {
  display: grid;
  gap: $space-2;
}

.option-card {
  display: flex;
  align-items: center;
  gap: $space-3;
  width: 100%;
  text-align: left;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  background: var(--color-surface);
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  color: var(--text);
  transition:
    outline-color $duration-normal $ease-fluid,
    background-color $duration-normal $ease-fluid;

  &:hover:not(:disabled) {
    outline-color: var(--primary);
  }

  &.selected {
    outline-color: var(--primary);
    background: var(--color-primary-soft);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.option-icon {
  font-size: 1.35rem;
  color: var(--primary);
  flex-shrink: 0;
}

.option-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-time {
  font-weight: $font-bold;
  font-size: $text-md;
}

.option-sub {
  font-size: $text-xs;
  color: var(--text-muted);
}

.leg-switch,
.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
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
