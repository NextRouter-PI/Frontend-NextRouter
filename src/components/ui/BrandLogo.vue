<script setup>
import LogoBase from '@/assets/images/logo-base.webp'
import LogoWheel from '@/assets/images/logo-roda.webp'

// Logo NR com a rodinha separada, para ela poder girar.
// spin: 'always' gira sempre (carregamento), 'hover' gira ao passar o mouse, 'none' parada.
defineProps({
  spin: { type: String, default: 'hover', validator: (v) => ['always', 'hover', 'none'].includes(v) },
  white: { type: Boolean, default: false },
  alt: { type: String, default: '' },
})
</script>

<template>
  <span class="brand-logo" :class="[`spin-${spin}`, { 'is-white': white }]" role="img" :aria-label="alt || undefined" :aria-hidden="alt ? undefined : 'true'">
    <img :src="LogoBase" alt="" class="brand-logo-base" width="599" height="417" />
    <img :src="LogoWheel" alt="" class="brand-logo-wheel" width="148" height="148" />
  </span>
</template>

<style lang="scss" scoped>
.brand-logo {
  position: relative;
  display: inline-block;
  line-height: 0;
  aspect-ratio: 599 / 417;

  img {
    display: block;
  }

  &.is-white img {
    filter: brightness(0) invert(1);
  }
}

.brand-logo-base {
  width: 100%;
  height: auto;
}

// Posição da roda dentro da imagem original (599 x 417).
.brand-logo-wheel {
  position: absolute;
  left: 28.42%;
  top: 54.26%;
  width: 12.4%;
  height: auto;
}

.spin-always .brand-logo-wheel {
  animation: wheel-spin var(--wheel-speed, 1.1s) linear infinite;
}

.spin-hover .brand-logo-wheel {
  transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}

// A roda gira com o hover na logo ou no link que a contém. Antes era `:global(a:hover) > ...`,
// que o Vue compila como `a:hover` puro: TODO link do site girava 360° no hover.
.spin-hover:is(:hover, a:hover > *, a:focus-visible > *) .brand-logo-wheel {
  transform: rotate(360deg);
}

@keyframes wheel-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spin-always .brand-logo-wheel {
    animation: none;
  }
}
</style>
