<script setup>
import { computed, onMounted, onUnmounted, shallowRef } from 'vue'

// Metade da tela com foto, usada nas telas sem login (login, cadastro, recuperar senha, empresas).
// A foto tem um zoom lento e, por cima, frases que se revezam. A borda que encosta no conteúdo é ondulada em S.
const props = defineProps({
  small: { type: String, required: true },
  large: { type: String, required: true },
  side: { type: String, default: 'left', validator: (v) => ['left', 'right'].includes(v) },
  position: { type: String, default: 'center' },
  // Frase sobre a foto/vídeo: o trecho em destaque fica laranja.
  quote: { type: String, default: '' },
  highlight: { type: String, default: '' },
  caption: { type: String, default: '' },
  // Várias frases que se revezam sobre a foto ({ quote, highlight, caption }).
  slides: { type: Array, default: () => [] },
  // Selos com os destaques do app ({ icon, text }), abaixo da frase.
  features: { type: Array, default: () => [] },
})

const SLIDE_MS = 6500
const allSlides = computed(() =>
  props.slides.length ? props.slides : props.quote ? [{ quote: props.quote, highlight: props.highlight, caption: props.caption }] : [],
)
const slideIndex = shallowRef(0)
const current = computed(() => allSlides.value[slideIndex.value] || null)
const quoteParts = computed(() => {
  const { quote = '', highlight = '' } = current.value || {}
  const i = highlight ? quote.indexOf(highlight) : -1
  if (i < 0) return { before: quote, word: '', after: '' }
  return { before: quote.slice(0, i), word: highlight, after: quote.slice(i + highlight.length) }
})

let timer = 0
onMounted(() => {
  if (allSlides.value.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(() => {
    slideIndex.value = (slideIndex.value + 1) % allSlides.value.length
  }, SLIDE_MS)
})
onUnmounted(() => clearInterval(timer))

const style = {
  '--photo-small': `url(${props.small})`,
  '--photo-large': `url(${props.large})`,
  '--photo-position': props.position,
}

</script>

<template>
  <section class="photo-panel" :class="`side-${side}`" :style="style" aria-hidden="true">
    <div class="photo-media"></div>
    <div class="photo-shade" :class="{ 'has-quote': current }"></div>

    <div v-if="current" class="photo-quote">
      <span class="quote-bar" aria-hidden="true"></span>
      <Transition name="quote-swap" mode="out-in">
        <div :key="slideIndex">
          <p class="quote-text">
            {{ quoteParts.before }}<span>{{ quoteParts.word }}</span>{{ quoteParts.after }}
          </p>
          <p v-if="current.caption" class="quote-caption">{{ current.caption }}</p>
        </div>
      </Transition>

      <ul v-if="features.length" class="quote-features">
        <li v-for="(item, i) in features" :key="item.text" :style="{ animationDelay: `${0.8 + i * 0.12}s` }">
          <BaseIcon :name="item.icon" /> {{ item.text }}
        </li>
      </ul>

      <div v-if="allSlides.length > 1" class="quote-dots">
        <span v-for="(s, i) in allSlides" :key="i" :class="{ active: i === slideIndex }"></span>
      </div>
    </div>

    <svg class="photo-wave photo-wave--side" viewBox="0 0 100 1000" preserveAspectRatio="none">
      <path d="M100 0 H52 C 18 180, 92 330, 54 500 C 16 670, 90 820, 52 1000 H100 Z" />
      <path class="photo-edge" d="M52 0 C 18 180, 92 330, 54 500 C 16 670, 90 820, 52 1000" />
    </svg>
    <svg class="photo-wave photo-wave--bottom" viewBox="0 0 1000 100" preserveAspectRatio="none">
      <path d="M0 100 V58 C 180 10, 330 96, 500 52 C 670 8, 820 90, 1000 46 V100 Z" />
      <path class="photo-edge" d="M0 58 C 180 10, 330 96, 500 52 C 670 8, 820 90, 1000 46" />
    </svg>
  </section>
</template>

<style lang="scss" scoped>
.photo-panel {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  height: 300px;
  background: var(--chrome-bg);
  animation: fade-in 0.8s $ease-fluid backwards;

  @include from($bp-desktop + 1px) {
    flex: 0 0 60%;
    height: auto;

    &.side-right {
      order: 2;
    }
  }
}

// Foto com zoom e deslocamento lentos, indo e voltando (efeito de câmera).
.photo-media {
  position: absolute;
  inset: -3%;
  background: var(--photo-small) var(--photo-position) / cover;
  animation: camera-drift 18s ease-in-out infinite alternate;

  @include from($bp-desktop + 1px) {
    background-image: var(--photo-large);
    background-position: center;
  }
}

@keyframes camera-drift {
  from {
    transform: scale(1.02) translate3d(0, 0, 0);
  }
  to {
    transform: scale(1.16) translate3d(-2.5%, -1.5%, 0);
  }
}

// Leve sombra no pé da foto para dar profundidade.
.photo-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(20, 12, 4, 0.18) 100%);

  // Escurece o pé do vídeo para a frase ficar legível.
  &.has-quote {
    background: linear-gradient(180deg, transparent 35%, rgba(14, 8, 2, 0.35) 62%, rgba(14, 8, 2, 0.78) 100%);
  }
}

.photo-quote {
  position: absolute;
  z-index: 1;
  left: $space-5;
  right: $space-5;
  bottom: 54px;
  color: #fff;

  @include from($bp-desktop + 1px) {
    left: clamp(32px, 6%, 72px);
    right: 140px;
    bottom: clamp(40px, 9vh, 88px);
  }

  .side-right & {
    @include from($bp-desktop + 1px) {
      left: 140px;
      right: clamp(32px, 6%, 72px);
      text-align: right;
    }
  }
}

.quote-bar {
  display: block;
  width: 56px;
  height: 4px;
  margin-bottom: $space-4;
  border-radius: 999px;
  background: var(--primary);
  transform-origin: left;
  animation: quote-bar 0.9s $ease-fluid 0.5s backwards;

  .side-right & {
    margin-left: auto;
    transform-origin: right;
  }

  @include until($bp-desktop) {
    display: none;
  }
}

@keyframes quote-bar {
  from {
    transform: scaleX(0);
  }
}

.quote-text {
  max-width: 18ch;
  font-size: clamp(1.25rem, 0.8rem + 2.4vw, 3.1rem);
  font-weight: $font-extrabold;
  line-height: 1.06;
  letter-spacing: -0.03em;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
  animation: quote-in 1s $ease-fluid 0.35s backwards;

  .side-right & {
    margin-left: auto;
  }

  span {
    color: #ff9a33;
  }
}

.quote-caption {
  max-width: 40ch;
  margin-top: $space-3;
  color: rgba(255, 255, 255, 0.85);
  font-size: $text-md;
  line-height: 1.5;
  animation: quote-in 1s $ease-fluid 0.6s backwards;

  .side-right & {
    margin-left: auto;
  }

  @include until($bp-desktop) {
    display: none;
  }
}

// Troca de frase: sai subindo e a próxima entra de baixo.
.quote-swap-enter-active,
.quote-swap-leave-active {
  transition:
    opacity 0.45s ease,
    transform 0.55s $ease-fluid;
}

.quote-swap-enter-from {
  opacity: 0;
  transform: translateY(18px);
}

.quote-swap-leave-to {
  opacity: 0;
  transform: translateY(-14px);
}

// Selos com os destaques do app.
.quote-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: $space-4 0 0;
  padding: 0;
  list-style: none;

  .side-right & {
    justify-content: flex-end;
  }

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(20, 12, 4, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: #fff;
    font-size: $text-xs;
    font-weight: $font-semibold;
    animation: quote-in 0.8s $ease-fluid backwards;

    :deep(.base-icon) {
      color: #ff9a33;
    }
  }

  @include until($bp-desktop) {
    display: none;
  }
}

// Bolinhas que mostram qual frase está na tela.
.quote-dots {
  display: flex;
  gap: 6px;
  margin-top: $space-4;

  .side-right & {
    justify-content: flex-end;
  }

  span {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.4);
    transition:
      width 0.4s $ease-fluid,
      background-color 0.4s ease;

    &.active {
      width: 26px;
      background: #ff9a33;
    }
  }

  @include until($bp-desktop) {
    display: none;
  }
}

@keyframes quote-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
}

.photo-wave {
  position: absolute;
  z-index: 2;
  fill: var(--bg);
  pointer-events: none;
  overflow: visible;

  &--side {
    display: none;
    top: 0;
    right: -1px;
    width: 120px;
    height: 100%;
  }

  &--bottom {
    left: 0;
    bottom: -1px;
    width: 100%;
    height: 44px;
  }

  @include from($bp-desktop + 1px) {
    &--side {
      display: block;
    }

    &--bottom {
      display: none;
    }
  }
}

// Foto à direita: a mesma onda, espelhada para a borda esquerda.
.side-right .photo-wave--side {
  right: auto;
  left: -1px;
  transform: scaleX(-1);
}

.photo-edge {
  fill: none;
  stroke: var(--primary);
  stroke-width: 4px;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 6px rgba(236, 131, 20, 0.55));
}

@media (prefers-reduced-motion: reduce) {
  .photo-media {
    animation: none;
  }
}
</style>
