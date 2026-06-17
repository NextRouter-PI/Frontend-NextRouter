<script setup>
import ThemeButton from "@/components/buttons/ThemeButton.vue"
import Logo from "@/assets/images/logo.png"
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="logo">
      <img :src="Logo" alt="Logo">
    </RouterLink>
    <ThemeButton />
  </header>
</template>

<style scoped>

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 10px 20px;
  background: var(--superfice);
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 4px var(--shadow);
  z-index: 100;
}

.logo img {
  height: 40px;
  width: auto;
}
</style>
