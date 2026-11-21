<script setup>
defineProps({
  ariaLabel: { type: String, required: true },
  headerIcon: { type: String, required: true },
  headerTitle: { type: String, required: true },
  userName: { type: String, default: '' },
  avatarIcon: { type: String, required: true },
  roleLabel: { type: String, required: true },
  roleIcon: { type: String, default: '' },
})

const expanded = defineModel('expanded', { type: Boolean, default: true })
</script>

<template>
  <section class="map-sheet" :class="{ collapsed: !expanded }" :aria-label="ariaLabel">
    <button
      type="button"
      class="sheet-handle-btn"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="sheet-pill" aria-hidden="true"></span>
      <div class="sheet-summary-row">
        <div class="sheet-location">
          <BaseIcon :name="headerIcon" />
          <span>{{ headerTitle }}</span>
        </div>
        <div class="sheet-status-right">
          <slot name="summary-status" />
          <BaseIcon :class="{ rotated: expanded }" name="mdi-chevron-up" class="chevron-icon" />
        </div>
      </div>
    </button>

    <div
      class="sheet-body-collapse"
      :class="{ open: expanded }"
      :aria-hidden="!expanded"
      :inert="!expanded || undefined"
    >
      <div class="sheet-body-inner">
        <div class="sheet-body">
          <div class="sheet-user-row">
            <div class="sheet-avatar">
              <BaseIcon :name="avatarIcon" />
            </div>
            <div class="sheet-user-info">
              <h1>Olá, {{ userName }}</h1>
              <span class="sheet-role-badge">
                <BaseIcon v-if="roleIcon" :name="roleIcon" />
                {{ roleLabel }}
              </span>
            </div>
          </div>

          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.map-sheet {
  position: relative;
  z-index: 2;
  width: 100%;
  background: var(--chrome-bg);
  color: var(--chrome-text);
  border-top: 2px solid var(--primary);
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.35);
  animation: sheet-slide-up 0.34s $ease-fluid;
}

@keyframes sheet-slide-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sheet-body-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.34s $ease-fluid,
    opacity 0.24s $ease-fluid;

  &.open {
    grid-template-rows: 1fr;
    opacity: 1;
  }
}

.sheet-body-inner {
  overflow: hidden;
  min-height: 0;
}

.sheet-handle-btn {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 18px 12px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
}

.sheet-pill {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
}

.sheet-summary-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sheet-location {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-on-primary);
  min-width: 0;

  .mdi {
    color: var(--primary);
    font-size: 1.15rem;
  }
}

.sheet-status-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.chevron-icon {
  font-size: 1.25rem;
  color: var(--chrome-muted);
  transition: transform $duration-normal $ease-fluid;

  &.rotated {
    transform: rotate(180deg);
  }
}

.sheet-body {
  padding: 2px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sheet-user-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sheet-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-primary-tint);
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
  flex-shrink: 0;
}

.sheet-user-info h1 {
  margin: 0 0 2px;
  font-size: 1.12rem;
  color: var(--color-on-primary);
}

.sheet-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--primary);
}

@media (min-width: 901px) {
  .map-sheet {
    max-width: 390px;
    border: 1.5px solid rgba(236, 131, 20, 0.45);
    border-radius: 20px;
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.42);
  }
}
</style>
