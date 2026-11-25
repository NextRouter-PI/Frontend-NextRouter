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
    :aria-busy="loading || undefined"
    @click="emit('click', $event)"
  >
    <Transition name="fade-scale" mode="out-in">
      <span v-if="loading" key="spinner" class="spinner" aria-hidden="true"></span>
      <BaseIcon v-else-if="icon" key="icon" :name="icon" />
    </Transition>
    <span class="btn-label"><slot /></span>
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

  position: relative;
  overflow: hidden;
  isolation: isolate;

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

  &.loading {
    opacity: 0.85;
    cursor: progress;
    animation: btn-loading-pulse 1.5s ease-in-out infinite;
  }

  .btn-label {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
  }

  // Padrão de todos os botões: sobe 1px no hover, o ícone dá um girinho e o clique afunda.
  :deep(.base-icon) {
    transition: transform 0.45s $ease-spring;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);

    :deep(.base-icon:not(.mdi-spin)) {
      transform: rotate(-8deg) scale(1.1);
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
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
    background: var(--gradient-brand);
    background-size: 160% 100%;
    background-position: 0% 0%;
    color: var(--color-on-primary);

    // Faixa de brilho que atravessa o botão no hover.
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%);
      transform: translateX(-120%);
      transition: transform 0.7s $ease-fluid;
    }

    &:hover:not(:disabled) {
      background-position: 100% 0%;
      box-shadow: var(--shadow-primary);
      transform: translateY(-1px);

      &::after {
        transform: translateX(120%);
      }
    }

    &:active:not(:disabled) {
      transform: scale(0.97);
    }
  }

  &.variant-secondary {
    background: transparent;
    color: var(--primary);
    outline-color: var(--primary);

    &:hover:not(:disabled) {
      background: var(--primary);
      color: var(--color-on-primary);
      box-shadow: var(--shadow-primary);
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

@keyframes btn-loading-pulse {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .base-btn.loading {
    animation: none;
  }
}
</style>
