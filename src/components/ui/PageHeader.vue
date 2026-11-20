<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  accent: { type: Boolean, default: false },
})
</script>

<template>
  <header class="page-header">
    <div v-if="accent" class="page-header-accent" aria-hidden="true"></div>
    <div class="page-header-row">
      <div class="page-header-copy">
        <h1 class="page-header-title">{{ title }}</h1>
        <p v-if="subtitle" class="page-header-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="page-header-actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-bottom: $space-4;

  &-accent {
    width: 44px;
    height: 4px;
    border-radius: $radius-pill;
    background: var(--primary);
  }

  &-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: $space-3;
  }

  &-copy {
    display: flex;
    flex-direction: column;
    gap: $space-1;
    min-width: 0;
  }

  &-title {
    font-size: $text-xl;
    font-weight: $font-extrabold;
    color: var(--text);
  }

  &-subtitle {
    font-size: $text-md;
    color: var(--text-muted);
    line-height: 1.5;
  }

  &-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-2;
  }
}
</style>
