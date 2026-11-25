<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  currentPage: { type: Number, required: true },
  loading: { type: Boolean, default: false },
  sendingCode: { type: Boolean, default: false },
  step2Loading: { type: Boolean, default: false },
  step2Label: { type: String, default: 'Continuar' },
  backDisabled: { type: Boolean, default: false },
  formStep: { type: Number, default: 1 },
})

const emit = defineEmits(['next', 'continue', 'back', 'step-back'])
</script>

<template>
  <div v-if="currentPage === 1" class="step-actions">
    <BaseButton
      v-if="formStep > 1"
      variant="outline"
      size="lg"
      icon="mdi-arrow-left"
      class="step-back"
      :disabled="loading"
      @click="emit('step-back')"
    >
      Voltar
    </BaseButton>
    <BaseButton block size="lg" class="step-next" :loading="loading" @click="emit('next')">
      {{ formStep < 3 ? 'Avançar' : 'Revisar cadastro' }}
      <BaseIcon name="mdi-arrow-right" class="step-next-arrow" />
    </BaseButton>
  </div>

  <BaseButton
    v-if="currentPage === 2"
    block
    size="lg"
    :loading="step2Loading"
    @click="emit('continue')"
  >
    {{ step2Label }}
  </BaseButton>

  <BaseButton
    v-if="currentPage === 3"
    type="submit"
    block
    size="lg"
    :loading="loading"
    :disabled="sendingCode"
  >
    {{ loading ? 'Enviando cadastro...' : 'Confirmar e Criar Conta' }}
  </BaseButton>

  <BaseButton
    v-if="currentPage > 1"
    variant="outline"
    block
    :disabled="backDisabled"
    @click="emit('back')"
  >
    Voltar e corrigir dados
  </BaseButton>
</template>

<style lang="scss" scoped>
.step-actions {
  display: flex;
  gap: $space-3;
}

.step-back {
  flex-shrink: 0;
}

.step-next {
  flex: 1;
}

.step-next-arrow {
  transition: transform $duration-normal $ease-fluid;

  .step-next:hover & {
    transform: translateX(4px);
  }
}
</style>
