<script setup>
import { computed } from 'vue'
import panoramaSmall from '@/assets/images/banner-panoramico-900.webp'
import panoramaLarge from '@/assets/images/banner-panoramico-1914.webp'

// Cabeçalho das páginas do app no padrão das telas públicas: faixa de ponta a ponta com
// foto escurecida, título com a última palavra em laranja e borda ondulada com traço laranja.
// variant="plain" mantém o título simples (ex.: dentro das abas do perfil).
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  icon: { type: String, default: 'mdi-map-marker-radius' },
  highlight: { type: String, default: '' },
  variant: { type: String, default: 'banner', validator: (v) => ['banner', 'plain'].includes(v) },
  accent: { type: Boolean, default: true },
})

// Destaca a palavra pedida ou, por padrão, a última palavra do título.
const titleParts = computed(() => {
  const word = props.highlight || props.title.trim().split(/\s+/).pop()
  const index = props.title.lastIndexOf(word)
  if (!word || index < 0) return { before: props.title, word: '', after: '' }
  return {
    before: props.title.slice(0, index),
    word,
    after: props.title.slice(index + word.length),
  }
})

// Foto panorâmica clara gerada para os banners (a mesma em todas as páginas logadas).
const photoStyle = { '--banner-small': `url(${panoramaSmall})`, '--banner-large': `url(${panoramaLarge})` }
</script>

<template>
  <header v-if="variant === 'banner'" class="page-banner">
    <div class="banner-photo" :style="photoStyle" aria-hidden="true"></div>
    <div class="banner-inner">
      <div class="banner-copy">
        <p v-if="eyebrow" class="banner-eyebrow"><BaseIcon :name="icon" /> {{ eyebrow }}</p>
        <h1 class="banner-title">
          {{ titleParts.before }}<span>{{ titleParts.word }}</span>{{ titleParts.after }}
        </h1>
        <p v-if="subtitle" class="banner-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="banner-actions">
        <slot name="actions" />
      </div>
    </div>
    <svg class="banner-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 90 V52 C 240 6, 480 86, 720 46 C 960 6, 1200 82, 1440 40 V90 Z" />
      <path class="banner-wave-edge" d="M0 52 C 240 6, 480 86, 720 46 C 960 6, 1200 82, 1440 40" />
    </svg>
  </header>

  <header v-else class="page-header">
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
// Ocupa a largura toda da área de conteúdo (100cqw, ver .main-content) e encosta no topo.
.page-banner {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  width: 100cqw;
  margin: calc(-1 * var(--page-pad-top, #{$space-5})) 0 $space-2 calc(50% - 50cqw);
  // O header é transparente: o banner começa no topo da tela e desconta a altura dele.
  padding: calc(var(--header-height) + #{$space-6}) $space-4 72px;
  color: #ffffff;
  background: var(--chrome-bg);

  @include from($bp-md) {
    padding: calc(var(--header-height) + 40px) $space-8 96px;
  }

  // Escurece o lado do texto com o cinza-escuro dos cartões (texto branco por cima); a foto ocupa a largura toda.
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(90deg, rgba(28, 28, 30, 0.92) 0%, rgba(28, 28, 30, 0.74) 34%, rgba(28, 28, 30, 0.18) 66%),
      linear-gradient(180deg, rgba(28, 28, 30, 0.4) 0%, transparent 40%);
    backdrop-filter: blur(2px);

    @include until($bp-md) {
      background: linear-gradient(180deg, rgba(28, 28, 30, 0.55) 0%, rgba(28, 28, 30, 0.9) 100%);
    }
  }
}

.banner-photo {
  position: absolute;
  inset: 0;
  z-index: -2;
  background: var(--banner-small) center 65% / cover;
  animation: banner-zoom 16s ease-out both;

  @include from($bp-md) {
    background-image: var(--banner-large);
  }
}

@keyframes banner-zoom {
  from {
    transform: scale(1.14);
  }
  to {
    transform: scale(1);
  }
}

.banner-inner {
  position: relative;
  width: 100%;
  max-width: var(--page-max, #{$container-md});
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $space-4;
  animation: rise-in $duration-reveal $ease-fluid 0.1s backwards;
}

.banner-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $space-2;
  min-width: 0;
  max-width: 48ch;
}

.banner-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: $radius-pill;
  background: rgba(236, 131, 20, 0.18);
  border: 1px solid rgba(236, 131, 20, 0.45);
  color: #fdba74;
  font-size: 0.7rem;
  font-weight: $font-bold;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.banner-title {
  font-size: clamp(1.7rem, 1.1rem + 2vw, 2.7rem);
  font-weight: $font-extrabold;
  line-height: 1.06;
  letter-spacing: -0.03em;
  color: #ffffff;

  span {
    color: var(--primary);
  }
}

.banner-subtitle {
  color: rgba(255, 255, 255, 0.78);
  font-size: $text-md;
  line-height: 1.55;
}

.banner-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;

  // Botões sobre o banner escuro: vidro escuro com texto branco; no hover, fundo laranja.
  :deep(.base-btn.variant-outline),
  :deep(.base-btn.variant-ghost) {
    background: rgba(28, 28, 30, 0.55);
    color: #ffffff;
    outline-color: rgba(255, 255, 255, 0.35);
    backdrop-filter: blur(6px);
  }

  :deep(.base-btn.variant-outline:hover:not(:disabled)),
  :deep(.base-btn.variant-ghost:hover:not(:disabled)) {
    background: var(--primary);
    color: #ffffff;
    outline-color: var(--primary);
  }
}

.banner-wave {
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 100%;
  max-width: none;
  height: 48px;
  fill: var(--bg);

  @include from($bp-md) {
    height: 72px;
  }
}

.banner-wave-edge {
  fill: none;
  stroke: var(--primary);
  stroke-width: 3px;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 6px rgba(236, 131, 20, 0.6));
}

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
