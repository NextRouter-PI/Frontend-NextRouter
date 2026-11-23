<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

defineProps({
  title: { type: String, required: true },
  busy: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'cancel'])
const reason = ref('')
</script>

<template>
  <form class="membership-confirm" @submit.prevent="emit('confirm', reason)">
    <p>{{ title }}</p>
    <BaseInput v-model="reason" label="Motivo (opcional, até 500 caracteres)" :maxlength="500" :disabled="busy || disabled" />
    <div class="membership-actions">
      <BaseButton type="submit" :loading="busy" :disabled="disabled">Confirmar</BaseButton>
      <BaseButton type="button" variant="outline" :disabled="busy" @click="emit('cancel')">Cancelar</BaseButton>
    </div>
  </form>
</template>
