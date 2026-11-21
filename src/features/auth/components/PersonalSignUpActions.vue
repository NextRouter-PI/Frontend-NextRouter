<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  currentPage: { type: Number, required: true },
  loading: { type: Boolean, default: false },
  sendingCode: { type: Boolean, default: false },
  step2Loading: { type: Boolean, default: false },
  step2Label: { type: String, default: 'Continuar' },
  backDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['next', 'continue', 'back'])
</script>

<template>
  <BaseButton
    v-if="currentPage === 1"
    block
    size="lg"
    :loading="loading"
    @click="emit('next')"
  >
    Avançar
  </BaseButton>

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
