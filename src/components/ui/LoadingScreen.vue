<script setup>
defineProps({
  title: { type: String, default: 'Carregando NextRouter...' },
  subtitle: { type: String, default: '' },
  fullscreen: { type: Boolean, default: false },
  overlay: { type: Boolean, default: false },
})
</script>

<template>
  <div
    :class="['loading-screen', { fullscreen, overlay }]"
    role="status"
    aria-live="polite"
  >
    <div class="loading-card">
      <div class="brand-loader" aria-hidden="true">
        <div class="spinner-ring"></div>
        <svg class="brand-pin" viewBox="0 0 24 24" fill="currentColor">
          <path
            class="brand-pin-ring"
            d="M12 20c-4.42 0-8-1.34-8-3 0-1.08 1.54-2.03 3.85-2.56l.68 1.36C6.95 16.17 5.8 16.69 5.8 17c0 .77 2.55 1.7 6.2 1.7s6.2-.93 6.2-1.7c0-.31-1.15-.83-2.73-1.2l.68-1.36C18.46 14.97 20 15.92 20 17c0 1.66-3.58 3-8 3z"
          />
          <path
            class="brand-pin-head"
            d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 9.5 6 9.5s6-5 6-9.5c0-3.31-2.69-6-6-6zm0 8.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4z"
          />
        </svg>
      </div>

      <p class="loading-brand" aria-hidden="true">
        <span class="brand-accent">NEXT</span><span class="brand-rest">ROUTER</span>
      </p>

      <div class="loading-copy">
        <p class="loading-title">{{ title }}</p>
        <p v-if="subtitle" class="loading-subtitle">{{ subtitle }}</p>
      </div>

      <div class="loading-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-screen {
  @include flex-center;
  width: 100%;
  min-height: 260px;
  padding: $space-6;
  background: var(--bg);
  color: var(--text);

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
    background: color-mix(in srgb, var(--bg) 86%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  text-align: center;
  max-width: 320px;
}

.brand-loader {
  position: relative;
  width: 72px;
  height: 72px;
  @include flex-center;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border-radius: $radius-round;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-right-color: var(--primary-light);
  animation: nr-spin 0.9s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
}

.brand-pin {
  width: 34px;
  height: 34px;
  color: var(--primary);
  overflow: visible;
}

.brand-pin-head {
  transform-origin: 12px 17px;
  animation: nr-pin-hop 1.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

.loading-brand {
  margin: 0;
  font-size: 1.15rem;
  font-weight: $font-extrabold;
  letter-spacing: 0.06em;
}

.brand-accent {
  color: var(--primary);
}

.brand-rest {
  color: var(--text);
}

.loading-copy {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.loading-title {
  margin: 0;
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--text);
}

.loading-subtitle {
  margin: 0;
  font-size: $text-sm;
  color: var(--text-muted);
  line-height: 1.45;
}

.loading-dots {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  span {
    width: 6px;
    height: 6px;
    border-radius: $radius-round;
    background: var(--primary);
    opacity: 0.3;
    animation: nr-dot-pulse 1.2s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.18s;
    }

    &:nth-child(3) {
      animation-delay: 0.36s;
    }
  }
}

@keyframes nr-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes nr-pin-hop {
  0%,
  100% {
    transform: translateY(0) scale(1, 1);
  }
  45% {
    transform: translateY(-3.5px) scale(0.96, 1.05);
  }
  75% {
    transform: translateY(0.3px) scale(1.04, 0.96);
  }
}

@keyframes nr-dot-pulse {
  0%,
  80%,
  100% {
    opacity: 0.25;
    transform: scale(0.85);
  }
  40% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner-ring {
    animation-duration: 1.8s;
  }

  .brand-pin-head,
  .loading-dots span {
    animation: none;
    opacity: 0.7;
  }
}
</style>
