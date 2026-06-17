<script setup>
defineProps({
  text: { type: String, default: '' }
})
</script>

<template>
  <div class="loading-container">
    <div class="spinner"></div>
    <p v-if="text">{{ text }}</p>
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
  border-top-color: var(--primary);
  border-radius: 50%;
  margin-bottom: 20px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

p {
  color: #666;
  font-size: 14px;
}
</style>
