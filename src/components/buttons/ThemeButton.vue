<script setup>
import { ref } from "vue"
import SvgIcon from "@jamescoyle/vue-icon"
import { mdiWhiteBalanceSunny, mdiWeatherNight } from "@mdi/js"

const theme = ref("light")

function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light"
  document.documentElement.className = theme.value
}
</script>

<template>
  <button v-if="theme === 'light'" @click="toggleTheme">
    <SvgIcon type="mdi" :path="mdiWeatherNight" color="#DF801A" size="35" />
  </button>
  <button v-else @click="toggleTheme">
    <SvgIcon type="mdi" :path="mdiWhiteBalanceSunny" color="#DF801A" size="35"/>
  </button>
</template>
