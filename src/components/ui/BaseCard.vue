<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  padding: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
})
</script>

<template>
  <section class="base-card" :class="`pad-${padding}`">
    <header v-if="title || subtitle || $slots.header" class="base-card-header">
      <slot name="header">
        <div class="base-card-heading">
          <h2 v-if="title" class="base-card-title">{{ title }}</h2>
          <p v-if="subtitle" class="base-card-subtitle">{{ subtitle }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="base-card-actions">
        <slot name="actions" />
      </div>
    </header>

    <div v-if="$slots.default" class="base-card-body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="base-card-footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style lang="scss" scoped>
.base-card {
  @include surface-card($space-5, $radius-lg);
  display: flex;
  flex-direction: column;
  gap: $space-3;
  transition:
    background-color $duration-normal $ease-fluid,
    outline-color $duration-normal $ease-fluid,
    box-shadow $duration-normal $ease-fluid;

  &.pad-sm {
    padding: $space-3 $space-4;
  }

  &.pad-md {
    padding: $space-5;
  }

  &.pad-lg {
    padding: $space-6;
  }

  &-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: $space-3;
  }

  &-heading {
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }

  &-title {
    font-size: $text-lg;
    font-weight: $font-bold;
    color: var(--text);
  }

  &-subtitle {
    font-size: $text-sm;
    color: var(--text-muted);
    line-height: 1.45;
  }

  &-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-2;
  }

  &-footer {
    padding-top: $space-3;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-2;
  }
}
</style>
