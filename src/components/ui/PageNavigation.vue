<script setup>
import BaseButton from './BaseButton.vue'

defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
})
defineEmits(['change'])
</script>

<template>
  <nav v-if="totalPages > 1" class="page-navigation" aria-label="Paginação">
    <BaseButton type="button" variant="outline" :disabled="disabled || page <= 1" @click="$emit('change', page - 1)">
      Anterior
    </BaseButton>
    <span aria-live="polite">Página {{ page }} de {{ totalPages }}</span>
    <BaseButton type="button" variant="outline" :disabled="disabled || page >= totalPages" @click="$emit('change', page + 1)">
      Próxima
    </BaseButton>
  </nav>
</template>

<style lang="scss" scoped>
.page-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
</style>
