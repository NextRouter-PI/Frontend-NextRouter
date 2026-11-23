<script setup>
import { onMounted, shallowRef } from 'vue'
import { STORAGE_KEYS, THEME_MODES } from '@/constants'

const saved = localStorage.getItem(STORAGE_KEYS.THEME)
const theme = shallowRef(saved === THEME_MODES.DARK ? THEME_MODES.DARK : THEME_MODES.LIGHT)

onMounted(() => {
  document.documentElement.className = theme.value === THEME_MODES.DARK ? THEME_MODES.DARK : ''
})

function toggleTheme() {
  theme.value = theme.value === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT
  document.documentElement.className = theme.value === THEME_MODES.DARK ? THEME_MODES.DARK : ''
  localStorage.setItem(STORAGE_KEYS.THEME, theme.value)
}
</script>

<template>
  <button
    type="button"
    class="theme-btn"
    :title="theme === THEME_MODES.LIGHT ? 'Ativar tema escuro' : 'Ativar tema claro'"
    :aria-label="theme === THEME_MODES.LIGHT ? 'Ativar tema escuro' : 'Ativar tema claro'"
    @click="toggleTheme"
  >
    <Transition name="icon-swap" mode="out-in">
      <BaseIcon v-if="theme === THEME_MODES.LIGHT" key="night" name="mdi-weather-night" />
      <BaseIcon v-else key="sunny" name="mdi-weather-sunny" />
    </Transition>
  </button>
</template>

<style lang="scss" scoped>
.theme-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  aspect-ratio: 1;
  border-radius: $radius-round;
  @include flex-center;
  background: transparent;
  color: var(--primary);
  transition:
    background-color $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid;

  &:hover {
    background: var(--color-primary-tint);
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.94);
  }

  .mdi {
    font-size: 24px;
    line-height: 1;
  }
}

.icon-swap-enter-active,
.icon-swap-leave-active {
  transition:
    opacity 0.18s $ease-fluid,
    transform $duration-normal $ease-fluid;
}

.icon-swap-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(0.7);
}

.icon-swap-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(0.7);
}
</style>
