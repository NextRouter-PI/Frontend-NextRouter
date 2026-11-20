<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  eligibility: { type: Object, required: true },
  responseStateLabel: { type: String, required: true },
  serviceLabel: { type: Function, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['withdraw-leg'])

const hasActiveOutbound = computed(() =>
  Boolean(props.eligibility.response?.outbound_service && !props.eligibility.response?.outbound_withdrawn_at),
)
const hasActiveReturn = computed(() =>
  Boolean(props.eligibility.response?.return_service && !props.eligibility.response?.return_withdrawn_at),
)
</script>

<template>
  <div class="axes-wrapper">
    <div class="axes-box">
      <div class="axis-block">
        <strong>1. Sua intenção registrada:</strong>
        <p>{{ responseStateLabel }}</p>
        <p v-if="eligibility.response?.answered_at">
          Ida:
          <strong>
            {{
              eligibility.response.outbound_withdrawn_at
                ? 'Desistência registrada'
                : serviceLabel(eligibility, eligibility.response.outbound_service)
            }}
          </strong>
          · Retorno:
          <strong>
            {{
              eligibility.response.return_withdrawn_at
                ? 'Desistência registrada'
                : serviceLabel(eligibility, eligibility.response.return_service)
            }}
          </strong>
        </p>
      </div>

      <div class="axis-block">
        <strong>2. Alocação e 3. Publicação de Viagem:</strong>
        <p v-if="!eligibility.participations.length">
          Nenhuma alocação em viagem até o momento. Enviar resposta ou ter pedido aprovado não publica viagem automaticamente.
        </p>
        <ul v-else class="part-list">
          <li v-for="part in eligibility.participations" :key="part.id">
            Trecho <strong>{{ part.leg === 'outbound' ? 'Ida' : 'Retorno' }}</strong> ·
            Participação: <strong>{{ part.status }}</strong> ·
            Viagem #{{ part.travel }}:
            <strong v-if="part.isPublicationCurrent">
              Publicada (revisão vigente {{ part.travelData?.published_revision }})
            </strong>
            <strong v-else-if="part.isPublished">
              Publicação anterior (aguardando republicação da revisão atual)
            </strong>
            <strong v-else>Ainda não publicada pela empresa</strong>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="hasActiveOutbound || hasActiveReturn" class="withdraw-box">
      <h3 class="withdraw-title">Desistir de um trecho antes do embarque</h3>
      <p class="withdraw-desc">
        Desistir de um trecho invalida pedidos conflitantes daquele trecho sem desfazer o outro trecho.
      </p>
      <div class="withdraw-actions">
        <BaseButton
          v-if="hasActiveOutbound"
          variant="outline"
          size="sm"
          :disabled="busy"
          @click="emit('withdraw-leg', 'outbound')"
        >
          Desistir da Ida
        </BaseButton>
        <BaseButton
          v-if="hasActiveReturn"
          variant="outline"
          size="sm"
          :disabled="busy"
          @click="emit('withdraw-leg', 'return')"
        >
          Desistir do Retorno
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.axes-wrapper {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.axes-box {
  display: grid;
  gap: $space-3;
  padding: $space-4;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  font-size: $text-md;
}

.axis-block {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  p {
    color: var(--text-muted);
    line-height: 1.45;
  }

  strong {
    color: var(--text);
  }
}

.part-list {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  color: var(--text-muted);
}

.withdraw-box {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px dashed var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.withdraw-title {
  font-size: $text-base;
  font-weight: $font-bold;
  color: var(--text);
}

.withdraw-desc {
  font-size: $text-sm;
  color: var(--text-muted);
}

.withdraw-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
