<script setup>
defineProps({
  type: { type: String, default: 'button' },
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
    :type="type"
    :class="['base-btn', `variant-${variant}`, `size-${size}`, { block, loading }]"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
  >
    <span v-if="loading" class="spinner" aria-hidden="true"></span>
    <BaseIcon v-else-if="icon" :name="icon" />
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.base-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: $space-2;
  border: none;
  outline: 1.5px solid transparent;
  outline-offset: -1.5px;
  border-radius: $radius-md;
  font-weight: $font-semibold;
  cursor: pointer;
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    outline-color $duration-normal $ease-fluid,
    transform $duration-fast $ease-fluid,
    box-shadow $duration-normal $ease-fluid;

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &.block {
    width: 100%;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &.size-sm {
    padding: $space-2 14px;
    font-size: $text-sm;
  }

  &.size-md {
    padding: 10px 18px;
    font-size: $text-md;
  }

  &.size-lg {
    padding: 13px 22px;
    font-size: 0.98rem;
  }

  &.variant-primary {
    background: var(--primary);
    color: var(--color-on-primary);

    &:hover:not(:disabled) {
      background: var(--primary-hover);
      box-shadow: var(--shadow-primary);
    }
  }

  &.variant-secondary {
    background: transparent;
    color: var(--primary);
    outline-color: var(--primary);

    &:hover:not(:disabled) {
      background: var(--primary);
      color: var(--color-on-primary);
    }
  }

  &.variant-outline {
    background: transparent;
    color: var(--text);
    outline-color: var(--border);

    &:hover:not(:disabled) {
      outline-color: var(--primary);
      color: var(--primary);
      background: var(--color-primary-soft);
    }

    &.selected {
      background: var(--color-primary-soft);
      color: var(--primary);
      outline-color: var(--primary);
    }
  }

  &.variant-ghost {
    background: transparent;
    color: var(--text-muted);

    &:hover:not(:disabled) {
      background: var(--altbg);
      color: var(--text);
    }
  }
}

.spinner {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: $radius-round;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
