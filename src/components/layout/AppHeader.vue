<script setup>
import ThemeButton from "@/components/buttons/ThemeButton.vue"
</script>

<template>
  <header class="header">
    <img src="../../../public/src-header/logo.png" alt="Logo" class="logo" />
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
  background: #1E1E1E;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.logo {
  height: 40px;
}
@media (min-width: 768px) {
}

</style>
