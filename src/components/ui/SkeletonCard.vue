<script setup>
defineProps({
  count: { type: Number, default: 2 },
  lines: { type: Number, default: 3 },
  avatar: { type: Boolean, default: false },
})
</script>

<template>
  <div class="skeleton-stack" role="status" aria-label="Carregando conteúdo">
    <div v-for="i in count" :key="i" class="skeleton-card">
      <div class="skeleton-row">
        <div v-if="avatar" class="skeleton-shimmer skeleton-avatar"></div>
        <div class="skeleton-lines">
          <div class="skeleton-shimmer skeleton-title"></div>
          <div
            v-for="l in Math.max(1, lines - 1)"
            :key="l"
            class="skeleton-shimmer skeleton-line"
            :style="{ width: l === lines - 1 ? '62%' : '92%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.skeleton-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0;
}

.skeleton-card {
  padding: 16px 18px;
  border-radius: 14px;
  background: var(--color-surface);
  outline: 1px solid var(--border);
  outline-offset: -1px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.skeleton-title {
  height: 14px;
  width: 48%;
  border-radius: 6px;
}

.skeleton-line {
  height: 11px;
  border-radius: 6px;
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--input-surface) 25%,
    var(--altbg) 50%,
    var(--input-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.35s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
