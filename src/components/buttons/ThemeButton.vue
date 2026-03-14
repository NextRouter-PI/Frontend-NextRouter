<script setup>
import { ref } from "vue"

const theme = ref("light")

function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light"
  document.documentElement.className = theme.value
}
</script>

<template>
  <button v-if="theme === 'light'" @click="toggleTheme">
    <img src="/src-header/theme-icons/temaEscuro.png" alt="Tema Escuro" />
  </button>

  <button v-else @click="toggleTheme">
    <img src="/src-header/theme-icons/temaClaro.png" alt="Tema Claro" />
  </button>
</template>


