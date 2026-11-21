<script setup>
import { computed } from 'vue'
import { SERVICE_DIRECTIONS } from '@/constants'
import BaseButton from '@/components/ui/BaseButton.vue'

const changeLeg = defineModel('changeLeg', { type: String, default: SERVICE_DIRECTIONS.OUTBOUND })
const proposedServiceId = defineModel('proposedServiceId', { type: String, default: '' })

const props = defineProps({
  eligibility: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['submit'])

const extensionServices = computed(() =>
  changeLeg.value === SERVICE_DIRECTIONS.OUTBOUND
    ? props.eligibility.outboundServices
    : props.eligibility.returnServices,
)

function selectLeg(leg) {
  changeLeg.value = leg
  proposedServiceId.value = ''
}
</script>

<template>
  <form class="response-form" @submit.prevent="emit('submit')">
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
        @click="selectLeg(SERVICE_DIRECTIONS.OUTBOUND)"
      >
        Alterar Ida
      </BaseButton>
      <BaseButton
        variant="outline"
        size="sm"
        :class="{ selected: changeLeg === SERVICE_DIRECTIONS.RETURN }"
        :disabled="busy"
        @click="selectLeg(SERVICE_DIRECTIONS.RETURN)"
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
        <BaseIcon name="mdi-clock-edit-outline" class="option-icon" />
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

.sub-info {
  font-size: $text-sm;
  color: var(--text-muted);
  line-height: 1.45;
}

.leg-switch {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
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

  &:hover:not(:disabled) {
    outline-color: var(--primary);
  }

  &.selected {
    outline-color: var(--primary);
    background: var(--color-primary-soft);
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
</style>
