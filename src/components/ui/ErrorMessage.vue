<script setup>
defineProps({
  message: { type: String, default: '' }
})
</script>

<template>
  <div v-if="message" class="error-message">
    <span class="mdi mdi-alert-circle"></span>
    <span>{{ message }}</span>
  </div>
</template>

<style scoped>
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 12px;
}

.mdi-alert-circle {
  font-size: 18px;
  flex-shrink: 0;
}
</style>
