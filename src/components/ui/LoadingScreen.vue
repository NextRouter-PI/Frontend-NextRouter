<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'

// Tela de carregamento única, no mesmo visual da cortina laranja entre páginas.
defineProps({
  title: { type: String, default: 'Carregando NextRouter...' },
  subtitle: { type: String, default: '' },
  fullscreen: { type: Boolean, default: false },
  overlay: { type: Boolean, default: false },
})

const WORD = [...'NextRouter']
</script>

<template>
  <div :class="['loading-screen', { fullscreen, overlay }]" role="status" aria-live="polite">
    <svg class="loading-route" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path class="loading-route-line" d="M-40 760 C 220 760, 260 560, 470 600 S 760 820, 960 640 S 1220 300, 1480 340" />
      <path class="loading-route-line loading-route-line--top" d="M-40 140 C 240 60, 420 260, 700 170 S 1180 40, 1480 120" />
      <circle class="loading-route-stop" cx="470" cy="600" r="9" />
      <circle class="loading-route-stop" cx="960" cy="640" r="9" />
      <circle class="loading-route-stop" cx="700" cy="170" r="7" />
    </svg>

    <div class="loading-center">
      <BrandLogo class="loading-logo" spin="always" white />
      <p class="loading-word" aria-hidden="true">
        <span v-for="(letter, i) in WORD" :key="i" :class="{ 'is-accent': i >= 4 }" :style="{ '--i': i }">{{
          letter
        }}</span>
      </p>
      <p class="loading-title">{{ title }}</p>

      <!-- Estrada com a van indo e voltando: carregamento sem porcentagem (duração desconhecida). -->
      <div class="loading-road" aria-hidden="true">
        <span class="loading-road-lane"></span>
        <span class="loading-road-fill">
          <span class="loading-road-van"><BaseIcon name="mdi-bus-side" /></span>
        </span>
      </div>
      <p v-if="subtitle" class="loading-subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$orange: #e86d05;
$graphite: #1c1c1f;

.loading-screen {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 260px;
  padding: $space-6;
  color: #fff;
  background:
    radial-gradient(circle at 50% 46%, rgba(255, 176, 92, 0.55) 0%, rgba(255, 176, 92, 0) 46%),
    linear-gradient(180deg, #f2801a 0%, $orange 45%, #c45700 100%);

  &.fullscreen {
    min-height: 100vh;
    min-height: 100dvh;
  }

  &.overlay {
    position: fixed;
    inset: 0;
    z-index: $z-modal;
    min-height: 100vh;
    min-height: 100dvh;
  }
}

.loading-route {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  max-width: none;
}

.loading-route-line {
  fill: none;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 0.1 18;
  animation: route-march 1.2s linear infinite;

  &--top {
    stroke: rgba(255, 255, 255, 0.18);
    animation-direction: reverse;
  }
}

.loading-route-stop {
  fill: $orange;
  stroke: rgba(255, 255, 255, 0.6);
  stroke-width: 4;
}

@keyframes route-march {
  to {
    stroke-dashoffset: -18.1;
  }
}

.loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: center-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

@keyframes center-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
}

.loading-logo {
  width: 150px;
  filter: drop-shadow(0 10px 22px rgba(90, 35, 0, 0.25));

  @include from($bp-desktop + 1px) {
    width: 190px;
  }
}

.loading-word {
  display: flex;
  margin-top: 10px;
  perspective: 600px;
  font-size: clamp(2rem, 1.55rem + 1.5vw, 2.7rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;

  span {
    display: inline-block;
    transform-origin: 50% 100%;
    animation: letter-flip 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    animation-delay: calc(var(--i) * 40ms + 150ms);
  }

  .is-accent {
    color: $graphite;
  }
}

@keyframes letter-flip {
  from {
    opacity: 0;
    transform: rotateX(-90deg) translateY(40%);
  }
}

.loading-title {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.loading-road {
  position: relative;
  width: 230px;
  height: 14px;
  margin-top: 34px;
  border-radius: 999px;
  background: $graphite;
  box-shadow: 0 10px 24px -10px rgba(60, 20, 0, 0.6);

  @include from($bp-desktop + 1px) {
    width: 270px;
  }
}

.loading-road-lane {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 6px;
  height: 2px;
  background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.55) 0 10px, transparent 10px 20px);
  animation: lane 0.45s linear infinite;
}

@keyframes lane {
  from {
    background-position: 20px 0;
  }
  to {
    background-position: 0 0;
  }
}

.loading-road-fill {
  position: absolute;
  inset: 3px auto 3px 3px;
  width: 12%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff7a00, #ffa33a);
  animation: road-loop 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}

@keyframes road-loop {
  0% {
    width: 12%;
  }
  60% {
    width: calc(100% - 6px);
  }
  100% {
    width: 12%;
  }
}

.loading-road-van {
  position: absolute;
  right: -16px;
  bottom: 9px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.7rem;
  filter: drop-shadow(0 3px 4px rgba(90, 35, 0, 0.35));
  animation: van-bump 0.3s ease-in-out infinite alternate;
}

@keyframes van-bump {
  to {
    translate: 0 -2px;
  }
}

.loading-subtitle {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.8rem;
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .loading-route-line,
  .loading-road-lane,
  .loading-road-fill,
  .loading-road-van,
  .loading-center,
  .loading-word span {
    animation: none;
  }
}
</style>
