<script setup>
import { shallowRef } from 'vue'
import { formatDateTimeBr } from '@/utils/formatters'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const props = defineProps({
  day: { type: Object, required: true },
  groupName: { type: String, required: true },
  resumo: { type: Object, required: true },
  travelsCount: { type: Number, default: 0 },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['close-window', 'revise', 'cancel'])
const motivo = shallowRef('')

function submitCancel() {
  emit('cancel', {
    day: props.day,
    reason: motivo.value,
    onSuccess: () => {
      motivo.value = ''
    },
  })
}
</script>

<template>
  <BaseCard
    :title="`${day.date} · ${groupName} (Dia #${day.id})`"
    :subtitle="`Janela: ${day.window} · Revisão: ${day.revision}${day.canceled_at ? ` · Cancelado em ${formatDateTimeBr(day.canceled_at)}` : ''}`"
  >
    <template v-if="!day.canceled_at" #actions>
      <BaseButton
        v-if="day.window === 'closed' || day.window === 'extension'"
        size="sm"
        :disabled="busy"
        @click="emit('close-window', day)"
      >
        Consolidar respostas e alocar
      </BaseButton>
      <BaseButton variant="outline" size="sm" :disabled="busy" @click="emit('revise', day)">
        Revisar atendimento
      </BaseButton>
    </template>

    <StatusBanner
      v-if="day.issues?.length"
      variant="danger"
      :message="`Pendências do atendimento: ${day.issues.join(' · ')}`"
    />

    <div class="resumo-demanda">
      <span>Elegíveis: <strong>{{ resumo.total }}</strong></span>
      <span>Com ida: <strong>{{ resumo.comIda }}</strong></span>
      <span>Com retorno: <strong>{{ resumo.comRetorno }}</strong></span>
      <span>Negativas explícitas: <strong>{{ resumo.negativas }}</strong></span>
      <span>Sem resposta: <strong>{{ resumo.semResposta }}</strong></span>
    </div>

    <div v-if="!day.canceled_at" class="cancel-row">
      <input
        v-model="motivo"
        placeholder="Motivo para cancelar este atendimento..."
        maxlength="500"
        :disabled="busy"
      />
      <BaseButton variant="outline" size="sm" :disabled="busy" @click="submitCancel">
        Cancelar atendimento
      </BaseButton>
    </div>

    <div class="travels-section">
      <h3 class="travels-heading">Viagens do Atendimento ({{ travelsCount }})</h3>
      <slot />
    </div>
  </BaseCard>
</template>

<style lang="scss" scoped>
.resumo-demanda {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  font-size: $text-sm;
}

.cancel-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  input {
    flex: 1 1 200px;
    padding: 9px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
  }
}

.travels-section {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.travels-heading {
  font-size: $text-base;
  font-weight: $font-bold;
}
</style>
