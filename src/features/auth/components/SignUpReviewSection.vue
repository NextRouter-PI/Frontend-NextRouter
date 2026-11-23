<script setup>
defineProps({
  title: { type: String, required: true },
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="review-section">
    <h3 class="review-title">{{ title }}</h3>
    <dl class="review-list">
      <div v-for="item in items" :key="item.label" class="review-item">
        <dt class="review-label">{{ item.label }}</dt>
        <dd class="review-value">{{ item.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<style lang="scss" scoped>
.review-section {
  background: var(--altbg);
  border: 1px solid var(--border);
  border-radius: $radius-lg;
  padding: $space-4;
  margin-bottom: $space-4;
}

.review-title {
  font-size: $text-base;
  font-weight: $font-bold;
  color: var(--primary);
  margin-bottom: $space-3;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.review-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: $space-1 $space-3;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
  font-size: $text-md;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.review-label {
  font-weight: $font-semibold;
  color: var(--text-muted);
}

.review-value {
  color: var(--text);
  font-weight: $font-medium;
  text-align: right;
  overflow-wrap: anywhere;
}
</style>
