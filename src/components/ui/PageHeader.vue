<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  accent: { type: Boolean, default: true },
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
    height: 3px;
    border-radius: $radius-pill;
    background: var(--gradient-brand);
    transform-origin: left;
    animation: accent-grow 0.7s $ease-fluid both;
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
    font-size: clamp(1.35rem, 1.1rem + 1vw, 1.75rem);
    font-weight: $font-extrabold;
    letter-spacing: -0.02em;
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

@keyframes accent-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
</style>
