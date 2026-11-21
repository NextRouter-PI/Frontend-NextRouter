<script setup>
defineProps({
  hud: { type: Object, default: null },
  is3d: { type: Boolean, default: true },
})

const emit = defineEmits(['toggle-3d'])
</script>

<template>
  <div v-if="hud" class="gps-top-hud" role="status" aria-label="Próxima parada GPS">
    <div class="gps-hud-icon">
      <BaseIcon name="mdi-navigation-variant" />
    </div>
    <div class="gps-hud-info">
      <strong class="gps-hud-title">{{ hud.title }}</strong>
      <span class="gps-hud-sub">
        {{ hud.subtitle }}
        <template v-if="hud.distanceLabel"> · {{ hud.distanceLabel }}</template>
        <template v-if="hud.etaLabel"> ({{ hud.etaLabel }})</template>
      </span>
    </div>
    <button
      type="button"
      class="gps-mode-toggle"
      :aria-pressed="is3d"
      @click="emit('toggle-3d')"
    >
      {{ is3d ? '3D' : '2D' }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.gps-top-hud {
  position: fixed;
  top: calc(var(--header-height) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  width: min(92vw, 480px);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(18, 18, 22, 0.92);
  color: #ffffff;
  border: 1.5px solid rgba(236, 131, 20, 0.55);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(8px);
}

.gps-hud-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.gps-hud-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gps-hud-title {
  font-size: 0.94rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gps-hud-sub {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.76);
}

.gps-mode-toggle {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
}
</style>
