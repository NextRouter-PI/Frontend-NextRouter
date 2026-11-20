<script setup>
import { ref, onMounted } from 'vue'

const saved = localStorage.getItem('theme')
const theme = ref(saved === 'dark' ? 'dark' : 'light')

onMounted(() => {
  document.documentElement.className = theme.value === 'dark' ? 'dark' : ''
})

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.documentElement.className = theme.value === 'dark' ? 'dark' : ''
  localStorage.setItem('theme', theme.value)
}
</script>

<template>
  <button
    type="button"
    class="theme-btn"
    :title="theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'"
    :aria-label="theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'"
    @click="toggleTheme"
  >
    <Transition name="icon-swap" mode="out-in">
      <span
        v-if="theme === 'light'"
        key="night"
        class="mdi mdi-weather-night"
        aria-hidden="true"
      ></span>
      <span
        v-else
        key="sunny"
        class="mdi mdi-weather-sunny"
        aria-hidden="true"
      ></span>
    </Transition>
  </button>
</template>

<style scoped>
.theme-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--primary);
  transition: background-color 0.22s var(--ease-fluid), transform 0.22s var(--ease-fluid);
}

.theme-btn:hover {
  background: rgba(236, 131, 20, 0.14);
  transform: scale(1.06);
}

.theme-btn:active {
  transform: scale(0.94);
}

.theme-btn .mdi {
  font-size: 24px;
  line-height: 1;
}

.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: opacity 0.18s var(--ease-fluid), transform 0.22s var(--ease-fluid);
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
