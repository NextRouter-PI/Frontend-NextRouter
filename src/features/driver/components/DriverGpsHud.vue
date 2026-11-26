<script setup>
defineProps({
  hud: { type: Object, default: null },
})
</script>

<template>
  <!-- Cartão compacto no canto, como o de manobra dos apps de motorista: deixa o mapa livre. -->
  <div v-if="hud" class="gps-top-hud" role="status" aria-label="Próxima parada">
    <div class="gps-hud-distance">
      <BaseIcon name="mdi-navigation-variant" />
      <strong>{{ hud.distanceLabel || '—' }}</strong>
    </div>
    <div class="gps-hud-info">
      <strong class="gps-hud-title">{{ hud.title }}</strong>
      <span class="gps-hud-sub">{{ hud.subtitle }}</span>
      <span v-if="hud.etaLabel || hud.expectedLabel" class="gps-hud-time">
        <template v-if="hud.etaLabel">{{ hud.etaLabel }}</template>
        <template v-if="hud.expectedLabel"> · chega {{ hud.expectedLabel }}</template>
        <em v-if="hud.delayMinutes > 0"> · +{{ hud.delayMinutes }} min</em>
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.gps-top-hud {
  position: fixed;
  top: calc(var(--header-height) + 16px);
  left: 16px;
  z-index: 4;
  width: min(calc(100vw - 100px), 320px);
  display: flex;
  align-items: stretch;
  overflow: hidden;
  border-radius: 16px;
  background: rgba(18, 18, 22, 0.94);
  color: #ffffff;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
}

.gps-hud-distance {
  flex-shrink: 0;
  min-width: 76px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: var(--primary);

  .mdi {
    font-size: 1.5rem;
  }

  strong {
    font-size: 0.9rem;
    font-weight: 800;
    white-space: nowrap;
  }
}

.gps-hud-info {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.gps-hud-title,
.gps-hud-sub {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gps-hud-title {
  font-size: 0.92rem;
  font-weight: 700;
}

.gps-hud-sub,
.gps-hud-time {
  font-size: 0.76rem;
  color: rgba(255, 255, 255, 0.74);
}

.gps-hud-time em {
  font-style: normal;
  color: #fbbf24;
}

// Celular: largura toda (os botões do mapa ficam embaixo, sem disputar espaço com o cartão).
@media (max-width: 900px) {
  .gps-top-hud {
    left: 12px;
    right: 12px;
    width: auto;
  }
}

// No computador o mapa fica atrás da sidebar fechada; o cartão começa depois dela.
@media (min-width: 901px) {
  .gps-top-hud {
    left: calc(var(--sidebar-width) + 16px);
  }
}
</style>
