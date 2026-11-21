<script setup>
import { computed, watch } from 'vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (v) => ['info', 'success', 'warning', 'danger'].includes(v),
  },
  message: { type: String, default: '' },
  icon: { type: String, default: '' },
  persistent: { type: Boolean, default: false },
})

const { showToast } = useToast()
const ariaRole = computed(() => (props.variant === 'danger' ? 'alert' : 'status'))

watch(
  () => [props.message, props.variant, props.persistent],
  ([msg, variant, persistent]) => {
    if (!persistent && msg) {
      showToast(msg, variant)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="persistent && (message || $slots.default)"
    class="status-banner"
    :class="`variant-${variant}`"
    :role="ariaRole"
  >
    <BaseIcon v-if="icon" :name="icon" class="status-banner-icon" />
    <div class="status-banner-content">
      <slot>{{ message }}</slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status-banner {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  margin-bottom: $space-3;
  line-height: 1.45;

  &-icon {
    font-size: 1.15rem;
    flex-shrink: 0;
    margin-top: 1px;
  }

  &-content {
    min-width: 0;
  }

  &.variant-info {
    @include status-banner(var(--primary), var(--color-primary-soft));

    .status-banner-icon {
      color: var(--primary);
    }
  }

  &.variant-success {
    @include status-banner(var(--success), var(--success-soft));

    .status-banner-icon {
      color: var(--success);
    }
  }

  &.variant-warning {
    @include status-banner(var(--warning), var(--warning-soft));

    .status-banner-icon {
      color: var(--warning);
    }
  }

  &.variant-danger {
    @include status-banner(var(--danger), var(--danger-soft));

    .status-banner-icon {
      color: var(--danger);
    }
  }
}
</style>
