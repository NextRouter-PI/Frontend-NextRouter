<script setup>
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar ação' },
  message: { type: String, default: '' },
  warning: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirmar' },
  cancelLabel: { type: String, default: 'Cancelar' },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-scale">
      <div
        v-if="open"
        class="confirm-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @click.self="!busy && emit('cancel')"
      >
        <div class="confirm-dialog">
          <div class="confirm-header">
            <BaseIcon name="mdi-alert-circle-outline" class="confirm-icon" />
            <h3>{{ title }}</h3>
          </div>
          <p v-if="message" class="confirm-message">{{ message }}</p>
          <p v-if="warning" class="confirm-warning">
            <BaseIcon name="mdi-alert-outline" />
            <span>{{ warning }}</span>
          </p>
          <slot />
          <div class="confirm-actions">
            <BaseButton variant="outline" size="sm" :disabled="busy" @click="emit('cancel')">
              {{ cancelLabel }}
            </BaseButton>
            <button type="button" class="confirm-danger-btn" :disabled="busy" @click="emit('confirm')">
              {{ busy ? 'Processando...' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.confirm-dialog {
  width: 100%;
  max-width: 440px;
  background: var(--color-surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: $radius-lg;
  box-shadow: var(--shadow), 0 18px 42px rgba(0, 0, 0, 0.35);
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: $space-2;

  h3 {
    margin: 0;
    font-size: $text-lg;
    font-weight: $font-bold;
  }
}

.confirm-icon {
  font-size: 1.5rem;
  color: var(--danger);
}

.confirm-message {
  margin: 0;
  font-size: $text-md;
  color: var(--text);
  line-height: 1.5;
}

.confirm-warning {
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--danger-soft);
  border: 1px solid var(--danger);
  color: var(--danger);
  font-size: $text-sm;
  font-weight: $font-semibold;
  line-height: 1.45;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  margin-top: $space-2;
}

.confirm-danger-btn {
  @include action-button;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: 1px solid var(--danger);
  background: var(--danger);
  color: var(--color-on-primary);
  font-size: $text-sm;
  font-weight: $font-semibold;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
