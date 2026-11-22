<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  eligibility: { type: Object, required: true },
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
</template>

<style lang="scss" scoped>
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
