<script setup>
import { ref } from "vue"

const theme = ref("light")

function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light"
  document.documentElement.className = theme.value
}
</script>

<template>
  <button @click="toggleTheme">
    Trocar tema
  </button>
</template>