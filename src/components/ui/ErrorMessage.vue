<script setup>
defineProps({
  message: { type: String, default: '' }
})
</script>

<template>
  <div v-if="message" class="error-message">
    <BaseIcon name="mdi-alert-circle" />
    <span>{{ message }}</span>
  </div>
</template>

<style lang="scss" scoped>
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 12px;
  color: var(--danger);
  font-size: 13px;
  font-weight: 500;
  white-space: pre-line;
  margin-bottom: 12px;
}

.mdi-alert-circle {
  font-size: 18px;
  flex-shrink: 0;
}
</style>
