<script setup>
defineProps({
  text: { type: String, default: '' },
  size: { type: String, default: 'md' },
  inline: { type: Boolean, default: false },
})
</script>

<template>
  <div :class="['loading-container', `size-${size}`, { inline }]" role="status">
    <div class="spinner" aria-hidden="true"></div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 16px;
  text-align: center;
}

.loading-container.inline {
  flex-direction: row;
  padding: 8px 0;
}

.spinner {
  border-radius: 50%;
  border-style: solid;
  border-color: var(--border);
  border-top-color: var(--primary);
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.size-sm .spinner {
  width: 18px;
  height: 18px;
  border-width: 2.5px;
}

.size-md .spinner {
  width: 30px;
  height: 30px;
  border-width: 3px;
}

.size-lg .spinner {
  width: 42px;
  height: 42px;
  border-width: 3.5px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 500;
}
</style>
