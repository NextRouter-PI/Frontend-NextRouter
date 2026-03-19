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
  <span class="mdi mdi-weather-night"></span>
  </button>
  <button v-else @click="toggleTheme">
  <span class="mdi mdi-weather-sunny"></span>
  </button>
</template>

<style scoped>
button {
  background: none;
  border: none;
  cursor: pointer;

}

span {
  color: var(--primary);
  font-size: 28px;
  transition: all 0.4s ease;
}

span:hover {
  color: var(--primary-hover);
}
</style>
