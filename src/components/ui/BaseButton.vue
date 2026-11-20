<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  size: { type: String, default: 'md' },
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
    <span v-else-if="icon" class="mdi" :class="icon" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border: 1.5px solid transparent;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s var(--ease-fluid), color 0.2s var(--ease-fluid),
    border-color 0.2s var(--ease-fluid), transform 0.16s var(--ease-fluid),
    box-shadow 0.2s var(--ease-fluid);
}

.base-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.base-btn.block {
  width: 100%;
}

.base-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.size-sm { padding: 8px 14px; font-size: 0.82rem; }
.size-md { padding: 10px 18px; font-size: 0.9rem; }
.size-lg { padding: 13px 22px; font-size: 0.98rem; }

.variant-primary {
  background: var(--primary);
  color: #ffffff;
}
.variant-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  box-shadow: var(--shadow-primary);
}

.variant-secondary {
  background: transparent;
  color: var(--primary);
  border-color: var(--primary);
}
.variant-secondary:hover:not(:disabled) {
  background: var(--primary);
  color: #ffffff;
}

.variant-outline {
  background: transparent;
  color: var(--text);
  border-color: var(--border);
}
.variant-outline:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(236, 131, 20, 0.06);
}
.variant-outline.selected {
  background: rgba(236, 131, 20, 0.1);
  color: var(--primary);
  border-color: var(--primary);
}

.variant-ghost {
  background: transparent;
  color: var(--text-muted);
}
.variant-ghost:hover:not(:disabled) {
  background: var(--altbg);
  color: var(--text);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
