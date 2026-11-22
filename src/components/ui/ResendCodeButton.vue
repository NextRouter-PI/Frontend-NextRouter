<script setup>
import { computed, onScopeDispose, shallowRef, watch } from 'vue'

const props = defineProps({
  cooldown: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  promptText: { type: String, default: 'Não recebeu?' },
  label: { type: String, default: 'Enviar novo código' },
  loadingLabel: { type: String, default: 'Reenviando código...' },
  cooldownPrefix: { type: String, default: 'Reenviar código em' },
  sentLabel: { type: String, default: 'Código reenviado!' },
  variant: { type: String, default: 'inline' },
})

const emit = defineEmits(['resend'])

const justSent = shallowRef(false)
let sentTimer = null

watch(
  () => props.loading,
  (isLoading, wasLoading) => {
    if (wasLoading && !isLoading && props.cooldown > 0) {
      justSent.value = true
      if (sentTimer) clearTimeout(sentTimer)
      sentTimer = setTimeout(() => {
        justSent.value = false
        sentTimer = null
      }, 1800)
    }
  },
)

onScopeDispose(() => {
  if (sentTimer) clearTimeout(sentTimer)
})

const stateKey = computed(() => {
  if (props.loading) return 'loading'
  if (justSent.value) return 'sent'
  if (props.cooldown > 0) return 'cooldown'
  return 'ready'
})

const isButtonDisabled = computed(() => props.disabled || props.loading || props.cooldown > 0)
</script>

<template>
  <div :class="['resend-control', `variant-${variant}`]">
    <Transition name="fade-slide" mode="out-in">
      <div v-if="stateKey === 'loading'" key="loading" class="resend-pill is-loading" role="status">
        <span class="resend-spinner" aria-hidden="true"></span>
        <span>{{ loadingLabel }}</span>
      </div>

      <div v-else-if="stateKey === 'sent'" key="sent" class="resend-pill is-sent" role="status">
        <BaseIcon name="mdi-check-circle-outline" class="sent-icon" />
        <span>{{ sentLabel }}</span>
      </div>

      <div v-else-if="stateKey === 'cooldown'" key="cooldown" class="resend-pill is-cooldown" role="status">
        <BaseIcon name="mdi-timer-sand" class="cooldown-icon" />
        <span>
          {{ cooldownPrefix }} <strong class="cooldown-digits">{{ cooldown }}s</strong>
        </span>
      </div>

      <div v-else key="ready" class="resend-ready">
        <span v-if="variant === 'inline' && promptText" class="resend-prompt">{{ promptText }}</span>
        <button
          type="button"
          :class="['resend-action', `action-${variant}`]"
          :disabled="isButtonDisabled"
          @click="emit('resend')"
        >
          <BaseIcon name="mdi-refresh" class="resend-icon" />
          <span>{{ label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.resend-control {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 36px;

  &.variant-button {
    justify-content: flex-start;
  }
}

.resend-pill {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 6px 14px;
  border-radius: $radius-pill;
  font-size: $text-sm;
  font-weight: $font-medium;

  &.is-loading {
    background: var(--color-primary-soft);
    color: var(--primary);
    border: 1px solid var(--color-primary-tint);
    animation: resend-pulse 1.4s ease-in-out infinite;
  }

  &.is-sent {
    background: var(--success-soft);
    color: var(--success);
    border: 1px solid rgba(34, 197, 94, 0.28);
  }

  &.is-cooldown {
    background: var(--altbg);
    color: var(--text-muted);
    border: 1px solid var(--border);
  }
}

.resend-spinner {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: $radius-round;
  animation: resend-spin 0.65s linear infinite;
}

.sent-icon {
  font-size: 1rem;
  animation: resend-pop 0.32s $ease-fluid;
}

.cooldown-icon {
  font-size: 0.95rem;
  color: var(--primary);
}

.cooldown-digits {
  font-variant-numeric: tabular-nums;
  color: var(--text);
  font-weight: $font-semibold;
}

.resend-ready {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: $space-1;
  font-size: $text-sm;
  color: var(--text-muted);
}

.resend-prompt {
  margin-right: 2px;
}

.resend-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: $text-sm;
  font-weight: $font-semibold;
  cursor: pointer;
  border: none;
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    border-color $duration-normal $ease-fluid,
    transform $duration-fast $ease-fluid;

  .resend-icon {
    font-size: 1rem;
    transition: transform 0.35s $ease-fluid;
  }

  &:hover:not(:disabled) .resend-icon {
    transform: rotate(180deg);
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &.action-inline {
    background: transparent;
    color: var(--primary);
    padding: 4px 10px;
    border-radius: $radius-pill;

    &:hover:not(:disabled) {
      background: var(--color-primary-soft);
    }
  }

  &.action-button {
    background: transparent;
    color: var(--text);
    padding: 9px 16px;
    border-radius: $radius-md;
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;

    &:hover:not(:disabled) {
      color: var(--primary);
      outline-color: var(--primary);
      background: var(--color-primary-soft);
    }
  }
}

@keyframes resend-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes resend-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.72;
  }
}

@keyframes resend-pop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  70% {
    transform: scale(1.12);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .resend-pill.is-loading,
  .sent-icon {
    animation: none;
  }

  .resend-action:hover:not(:disabled) .resend-icon {
    transform: none;
  }
}
</style>
