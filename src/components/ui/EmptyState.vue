<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="empty-state" :role="loading ? 'status' : undefined">
    <div v-if="loading" class="empty-state-spinner" aria-hidden="true"></div>
    <span v-else-if="icon" class="mdi empty-state-icon" :class="icon" aria-hidden="true"></span>
    <h2 v-if="title" class="empty-state-title">{{ title }}</h2>
    <p v-if="description" class="empty-state-desc">{{ description }}</p>
    <div v-if="$slots.actions" class="empty-state-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.empty-state {
  @include surface-card($space-8 $space-5, $radius-lg);
  @include flex-center($space-3);
  flex-direction: column;
  text-align: center;

  &-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: $radius-round;
    animation: empty-spin 0.75s linear infinite;
  }

  &-icon {
    font-size: 2.2rem;
    color: var(--primary);
  }

  &-title {
    font-size: $text-lg;
    font-weight: $font-bold;
    color: var(--text);
  }

  &-desc {
    max-width: 520px;
    font-size: $text-md;
    color: var(--text-muted);
    line-height: 1.5;
  }

  &-actions {
    margin-top: $space-2;
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
  }
}

@keyframes empty-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
