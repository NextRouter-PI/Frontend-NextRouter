<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'

const outboundChoice = defineModel('outboundChoice', { type: String, default: '' })
const returnChoice = defineModel('returnChoice', { type: String, default: '' })

defineProps({
  eligibility: { type: Object, required: true },
  alreadyAnswered: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'cancel-edit'])
</script>

<template>
  <form class="response-form" @submit.prevent="emit('submit')">
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
          <BaseIcon name="mdi-close-circle-outline" class="option-icon" />
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
          <BaseIcon name="mdi-bus-clock" class="option-icon" />
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
          <BaseIcon name="mdi-close-circle-outline" class="option-icon" />
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
          <BaseIcon name="mdi-bus-clock" class="option-icon" />
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
      <BaseButton v-if="alreadyAnswered" variant="outline" :disabled="busy" @click="emit('cancel-edit')">
        Cancelar alteração
      </BaseButton>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.response-form {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding-top: $space-3;
  border-top: 1px solid var(--border);
}

.form-title {
  font-size: $text-base;
  font-weight: $font-bold;
  color: var(--text);
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

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
