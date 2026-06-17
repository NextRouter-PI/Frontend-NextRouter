<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  size: { type: String, default: 'md' }
})

const emit = defineEmits(['click'])
</script>

<template>
  <button
    :class="['base-btn', `variant-${variant}`, `size-${size}`, { block, loading }]"
    :disabled="disabled || loading"
    @click="emit('click')"
  >
    <span v-if="loading" class="spinner"></span>
    <span v-else-if="icon" class="mdi" :class="icon"></span>
    <slot />
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.base-btn.block {
  width: 100%;
}

.base-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.size-sm { padding: 8px 16px; font-size: 13px; }
.size-md { padding: 10px 20px; font-size: 14px; }
.size-lg { padding: 14px 24px; font-size: 16px; }

.variant-primary {
  background: var(--primary);
  color: white;
}
.variant-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.variant-secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}
.variant-secondary:hover:not(:disabled) {
  background: var(--primary);
  color: white;
}

.variant-outline {
  background: transparent;
  color: #333;
  border: 2px solid #ddd;
}
.variant-outline:hover:not(:disabled) {
  border-color: var(--primary);
  background: #fff8f0;
}
.variant-outline.selected {
  background: #333;
  color: white;
  border-color: #333;
}

.variant-ghost {
  background: transparent;
  color: #666;
}
.variant-ghost:hover:not(:disabled) {
  background: #f5f5f5;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
